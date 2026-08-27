import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../core/database/prisma.service';
import { Payment, PaymentTransaction } from '../../generated/prisma/client';
import {
  PaymentMethod,
  PaymentStatus,
  PaymentTransactionStatus,
  PaymentTransactionType,
} from '../../generated/prisma/enums';
import { ChargeRequestPayload } from './types/payments.types';
import { ProviderResult } from './utils/payment-provider.util';

@Injectable()
export class PaymentsRepository {
  constructor(private readonly prisma: PrismaService) {}

  findByOrderId(orderId: string): Promise<Payment | null> {
    return this.prisma.payment.findUnique({ where: { orderId } });
  }

  findById(id: string): Promise<Payment | null> {
    return this.prisma.payment.findUnique({ where: { id } });
  }

  findTransactionByIdempotencyKey(
    idempotencyKey: string,
  ): Promise<PaymentTransaction | null> {
    return this.prisma.paymentTransaction.findUnique({
      where: { idempotencyKey },
    });
  }

  /**
   * Check-then-insert (DATABASE.md): upserts the `payments` row (unique per
   * order) and inserts a PENDING `CHARGE` transaction in one write, so a
   * concurrent duplicate request collides on the transaction's unique
   * `idempotency_key` instead of racing across two separate statements.
   */
  async beginCharge(data: {
    orderId: string;
    amount: number;
    method: PaymentMethod;
    idempotencyKey: string;
    requestPayload: ChargeRequestPayload;
  }): Promise<{ paymentId: string; transactionId: string }> {
    return this.prisma.$transaction(async (tx) => {
      const payment = await tx.payment.upsert({
        where: { orderId: data.orderId },
        create: {
          orderId: data.orderId,
          amount: data.amount,
          method: data.method,
          status: PaymentStatus.PENDING,
        },
        update: {},
      });
      const transaction = await tx.paymentTransaction.create({
        data: {
          paymentId: payment.id,
          idempotencyKey: data.idempotencyKey,
          type: PaymentTransactionType.CHARGE,
          status: PaymentTransactionStatus.PENDING,
          rawResponse: { requestPayload: data.requestPayload },
        },
      });
      return { paymentId: payment.id, transactionId: transaction.id };
    });
  }

  async finalizeCharge(
    paymentId: string,
    transactionId: string,
    result: ProviderResult,
  ): Promise<Payment> {
    return this.prisma.$transaction(async (tx) => {
      const existing = await tx.paymentTransaction.findUniqueOrThrow({
        where: { id: transactionId },
      });
      await tx.paymentTransaction.update({
        where: { id: transactionId },
        data: {
          status: result.success
            ? PaymentTransactionStatus.SUCCESS
            : PaymentTransactionStatus.FAILED,
          providerTransactionId: result.providerTransactionId,
          rawResponse: {
            ...(existing.rawResponse as object),
            providerResponse: result,
          },
        },
      });
      return tx.payment.update({
        where: { id: paymentId },
        data: {
          status: result.success ? PaymentStatus.PAID : PaymentStatus.FAILED,
        },
      });
    });
  }

  createRefundTransaction(
    paymentId: string,
    idempotencyKey: string,
    reason?: string,
  ): Promise<PaymentTransaction> {
    return this.prisma.paymentTransaction.create({
      data: {
        paymentId,
        idempotencyKey,
        type: PaymentTransactionType.REFUND,
        status: PaymentTransactionStatus.PENDING,
        rawResponse: reason ? { reason } : undefined,
      },
    });
  }

  async finalizeRefund(
    paymentId: string,
    transactionId: string,
    result: ProviderResult,
  ): Promise<Payment> {
    return this.prisma.$transaction(async (tx) => {
      const existing = await tx.paymentTransaction.findUniqueOrThrow({
        where: { id: transactionId },
      });
      await tx.paymentTransaction.update({
        where: { id: transactionId },
        data: {
          status: result.success
            ? PaymentTransactionStatus.SUCCESS
            : PaymentTransactionStatus.FAILED,
          providerTransactionId: result.providerTransactionId,
          rawResponse: {
            ...(existing.rawResponse as object),
            providerResponse: result,
          },
        },
      });
      return tx.payment.update({
        where: { id: paymentId },
        data: {
          status: result.success ? PaymentStatus.REFUNDED : PaymentStatus.PAID,
        },
      });
    });
  }
}
