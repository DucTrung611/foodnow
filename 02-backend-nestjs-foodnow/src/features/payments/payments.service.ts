import { randomUUID } from 'crypto';
import {
  BadRequestException,
  ConflictException,
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { isUUID } from 'class-validator';
import {
  Payment,
  PaymentTransaction,
  Prisma,
} from '../../generated/prisma/client';
import { PaymentMethod, PaymentStatus } from '../../generated/prisma/enums';
import { OrdersService } from '../orders/orders.service';
import { JwtPayload } from '../../shared/types/jwt-payload.type';
import { formatDecimal } from '../../shared/utils/decimal.util';
import { PayOrderDto } from './dto/pay-order.dto';
import { PaymentResponseDto } from './dto/payment-response.dto';
import { RefundPaymentDto } from './dto/refund-payment.dto';
import { PaymentsGateway } from './payments.gateway';
import { PaymentsRepository } from './payments.repository';
import { ChargeRequestPayload } from './types/payments.types';
import { simulateCharge, simulateRefund } from './utils/payment-provider.util';

function toPaymentResponseDto(payment: Payment): PaymentResponseDto {
  return {
    id: payment.id,
    orderId: payment.orderId,
    amount: formatDecimal(payment.amount),
    method: payment.method,
    status: payment.status,
    createdAt: payment.createdAt,
    updatedAt: payment.updatedAt,
  };
}

function throwDeclined(): never {
  throw new HttpException(
    { code: 'PAYMENT_5001', message: 'Payment declined by provider' },
    HttpStatus.PAYMENT_REQUIRED,
  );
}

@Injectable()
export class PaymentsService {
  constructor(
    private readonly paymentsRepository: PaymentsRepository,
    private readonly ordersService: OrdersService,
    private readonly paymentsGateway: PaymentsGateway,
  ) {}

  async payOrder(
    user: JwtPayload,
    orderId: string,
    idempotencyKey: string | undefined,
    dto: PayOrderDto,
  ): Promise<PaymentResponseDto> {
    if (!idempotencyKey || !isUUID(idempotencyKey)) {
      throw new BadRequestException({
        code: 'COMMON_9000',
        message: 'Validation failed',
        details: [
          {
            field: 'Idempotency-Key',
            issue: 'required header, must be a UUID',
          },
        ],
      });
    }
    if (dto.method !== PaymentMethod.CASH && !dto.paymentToken) {
      throw new BadRequestException({
        code: 'COMMON_9000',
        message: 'Validation failed',
        details: [{ field: 'paymentToken', issue: 'required for CARD/WALLET' }],
      });
    }

    // Ownership/existence check — CUSTOMER must own the order (ADMIN not
    // reachable here, the controller restricts this route to CUSTOMER).
    const order = await this.ordersService.getOrderById(user, orderId);

    const requestPayload: ChargeRequestPayload = {
      orderId,
      method: dto.method,
      paymentToken: dto.paymentToken ?? null,
    };

    const existingTransaction =
      await this.paymentsRepository.findTransactionByIdempotencyKey(
        idempotencyKey,
      );
    if (existingTransaction) {
      return this.replayCharge(existingTransaction, requestPayload);
    }

    const existingPayment =
      await this.paymentsRepository.findByOrderId(orderId);
    if (existingPayment?.status === PaymentStatus.PAID) {
      return toPaymentResponseDto(existingPayment);
    }

    let paymentId: string;
    let transactionId: string;
    try {
      ({ paymentId, transactionId } = await this.paymentsRepository.beginCharge(
        {
          orderId,
          amount: Number(order.totalAmount),
          method: dto.method,
          idempotencyKey,
          requestPayload,
        },
      ));
    } catch (error) {
      const isDuplicateKey =
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002';
      if (!isDuplicateKey) throw error;
      const raced =
        await this.paymentsRepository.findTransactionByIdempotencyKey(
          idempotencyKey,
        );
      if (!raced) throw error;
      return this.replayCharge(raced, requestPayload);
    }

    const result = simulateCharge(dto.method, dto.paymentToken);
    const payment = await this.paymentsRepository.finalizeCharge(
      paymentId,
      transactionId,
      result,
    );
    this.paymentsGateway.emitPaymentUpdated(orderId, payment.status);

    if (!result.success) throwDeclined();
    return toPaymentResponseDto(payment);
  }

  private async replayCharge(
    transaction: PaymentTransaction,
    requestPayload: ChargeRequestPayload,
  ): Promise<PaymentResponseDto> {
    const stored = (
      transaction.rawResponse as {
        requestPayload?: ChargeRequestPayload;
      } | null
    )?.requestPayload;
    const samePayload =
      stored?.orderId === requestPayload.orderId &&
      stored?.method === requestPayload.method &&
      stored?.paymentToken === requestPayload.paymentToken;

    if (!samePayload) {
      throw new ConflictException({
        code: 'PAYMENT_5002',
        message: 'Duplicate idempotency key with different payload',
      });
    }

    const payment = await this.paymentsRepository.findById(
      transaction.paymentId,
    );
    if (!payment) {
      throw new NotFoundException({
        code: 'PAYMENT_5000',
        message: 'Payment not found',
      });
    }
    if (payment.status === PaymentStatus.FAILED) throwDeclined();
    return toPaymentResponseDto(payment);
  }

  async getPaymentById(
    user: JwtPayload,
    id: string,
  ): Promise<PaymentResponseDto> {
    const payment = await this.findPaymentOrThrow(id);
    // Delegates the CUSTOMER-owns-order / ADMIN-any check to OrdersService —
    // the controller already restricts this route to CUSTOMER/ADMIN.
    await this.ordersService.getOrderById(user, payment.orderId);
    return toPaymentResponseDto(payment);
  }

  /** `null` means no charge attempt has been made yet — not an error. */
  async getPaymentByOrderId(
    user: JwtPayload,
    orderId: string,
  ): Promise<PaymentResponseDto | null> {
    // Ownership/existence check — same as payOrder above.
    await this.ordersService.getOrderById(user, orderId);
    const payment = await this.paymentsRepository.findByOrderId(orderId);
    return payment ? toPaymentResponseDto(payment) : null;
  }

  async refundPayment(
    id: string,
    dto: RefundPaymentDto,
  ): Promise<PaymentResponseDto> {
    const payment = await this.findPaymentOrThrow(id);
    if (payment.status !== PaymentStatus.PAID) {
      throw new UnprocessableEntityException({
        code: 'PAYMENT_5003',
        message: 'Payment is not in a refundable state',
      });
    }

    const transaction = await this.paymentsRepository.createRefundTransaction(
      payment.id,
      randomUUID(),
      dto.reason,
    );
    const result = simulateRefund();
    const updated = await this.paymentsRepository.finalizeRefund(
      payment.id,
      transaction.id,
      result,
    );
    this.paymentsGateway.emitPaymentUpdated(updated.orderId, updated.status);

    if (!result.success) throwDeclined();
    return toPaymentResponseDto(updated);
  }

  private async findPaymentOrThrow(id: string): Promise<Payment> {
    const payment = await this.paymentsRepository.findById(id);
    if (!payment) {
      throw new NotFoundException({
        code: 'PAYMENT_5000',
        message: 'Payment not found',
      });
    }
    return payment;
  }
}
