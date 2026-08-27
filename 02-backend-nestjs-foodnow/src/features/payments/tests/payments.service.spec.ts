/* eslint-disable @typescript-eslint/unbound-method -- jest mock assertions (expect(mock.method).toHaveBeenCalledWith) are always false positives for this rule */
import {
  Payment,
  PaymentTransaction,
  Prisma,
} from '../../../generated/prisma/client';
import {
  PaymentMethod,
  PaymentStatus,
  PaymentTransactionStatus,
  PaymentTransactionType,
} from '../../../generated/prisma/enums';
import { Role } from '../../../shared/types/role.enum';
import { OrderResponseDto } from '../../orders/dto/order-response.dto';
import { OrdersService } from '../../orders/orders.service';
import { PaymentsGateway } from '../payments.gateway';
import { PaymentsRepository } from '../payments.repository';
import { PaymentsService } from '../payments.service';

const IDEMPOTENCY_KEY = '550e8400-e29b-41d4-a716-446655440000';
const customer = { sub: 'customer-1', role: Role.CUSTOMER };

const ORDER: OrderResponseDto = {
  id: 'order-1',
  orderCode: 'FN-260824-0001',
  customerId: 'customer-1',
  restaurantId: 'restaurant-1',
  driverId: null,
  deliveryAddressId: 'address-1',
  status: 'PENDING',
  subtotal: '55000.00',
  deliveryFee: '18000.00',
  discountAmount: '0.00',
  totalAmount: '73000.00',
  version: 0,
  placedAt: new Date('2026-08-24T10:30:00.000Z'),
  items: [],
};

function makePayment(overrides: Partial<Payment> = {}): Payment {
  return {
    id: 'payment-1',
    orderId: 'order-1',
    amount: '73000.00' as never,
    method: PaymentMethod.CARD,
    status: PaymentStatus.PAID,
    createdAt: new Date('2026-08-24T10:30:00.000Z'),
    updatedAt: new Date('2026-08-24T10:30:00.000Z'),
    ...overrides,
  };
}

function makeTransaction(
  overrides: Partial<PaymentTransaction> = {},
): PaymentTransaction {
  return {
    id: 'tx-1',
    paymentId: 'payment-1',
    idempotencyKey: IDEMPOTENCY_KEY,
    providerTransactionId: null,
    type: PaymentTransactionType.CHARGE,
    status: PaymentTransactionStatus.SUCCESS,
    rawResponse: {
      requestPayload: {
        orderId: 'order-1',
        method: PaymentMethod.CARD,
        paymentToken: 'tok_visa',
      },
    },
    createdAt: new Date('2026-08-24T10:30:00.000Z'),
    ...overrides,
  };
}

describe('PaymentsService', () => {
  let service: PaymentsService;
  let repository: jest.Mocked<PaymentsRepository>;
  let ordersService: jest.Mocked<OrdersService>;
  let gateway: jest.Mocked<PaymentsGateway>;

  beforeEach(() => {
    repository = {
      findByOrderId: jest.fn(),
      findById: jest.fn(),
      findTransactionByIdempotencyKey: jest.fn(),
      beginCharge: jest.fn(),
      finalizeCharge: jest.fn(),
      createRefundTransaction: jest.fn(),
      finalizeRefund: jest.fn(),
    } as unknown as jest.Mocked<PaymentsRepository>;

    ordersService = {
      getOrderById: jest.fn(),
    } as unknown as jest.Mocked<OrdersService>;

    gateway = {
      emitPaymentUpdated: jest.fn(),
    } as unknown as jest.Mocked<PaymentsGateway>;

    service = new PaymentsService(repository, ordersService, gateway);
  });

  describe('payOrder', () => {
    const dto = { method: PaymentMethod.CARD, paymentToken: 'tok_visa' };

    it('rejects a missing Idempotency-Key (COMMON_9000)', async () => {
      await expect(
        service.payOrder(customer, 'order-1', undefined, dto),
      ).rejects.toMatchObject({ response: { code: 'COMMON_9000' } });
      expect(ordersService.getOrderById).not.toHaveBeenCalled();
    });

    it('rejects a non-UUID Idempotency-Key (COMMON_9000)', async () => {
      await expect(
        service.payOrder(customer, 'order-1', 'not-a-uuid', dto),
      ).rejects.toMatchObject({ response: { code: 'COMMON_9000' } });
    });

    it('rejects CARD/WALLET without a paymentToken (COMMON_9000)', async () => {
      await expect(
        service.payOrder(customer, 'order-1', IDEMPOTENCY_KEY, {
          method: PaymentMethod.CARD,
        }),
      ).rejects.toMatchObject({ response: { code: 'COMMON_9000' } });
      expect(ordersService.getOrderById).not.toHaveBeenCalled();
    });

    it('propagates ORDER_3005/AUTH_1003 from OrdersService.getOrderById unchanged', async () => {
      ordersService.getOrderById.mockRejectedValue(
        Object.assign(new Error('not found'), {
          response: { code: 'ORDER_3005' },
        }),
      );

      await expect(
        service.payOrder(customer, 'order-1', IDEMPOTENCY_KEY, dto),
      ).rejects.toMatchObject({ response: { code: 'ORDER_3005' } });
    });

    it('charges CASH without requiring a paymentToken', async () => {
      ordersService.getOrderById.mockResolvedValue(ORDER);
      repository.findTransactionByIdempotencyKey.mockResolvedValue(null);
      repository.findByOrderId.mockResolvedValue(null);
      repository.beginCharge.mockResolvedValue({
        paymentId: 'payment-1',
        transactionId: 'tx-1',
      });
      repository.finalizeCharge.mockResolvedValue(
        makePayment({ method: PaymentMethod.CASH }),
      );

      const result = await service.payOrder(
        customer,
        'order-1',
        IDEMPOTENCY_KEY,
        { method: PaymentMethod.CASH },
      );

      expect(repository.beginCharge).toHaveBeenCalledWith({
        orderId: 'order-1',
        amount: 73000,
        method: PaymentMethod.CASH,
        idempotencyKey: IDEMPOTENCY_KEY,
        requestPayload: {
          orderId: 'order-1',
          method: PaymentMethod.CASH,
          paymentToken: null,
        },
      });
      expect(gateway.emitPaymentUpdated).toHaveBeenCalledWith(
        'order-1',
        PaymentStatus.PAID,
      );
      expect(result.status).toBe(PaymentStatus.PAID);
    });

    it('short-circuits to the existing PAID payment without charging again', async () => {
      ordersService.getOrderById.mockResolvedValue(ORDER);
      repository.findTransactionByIdempotencyKey.mockResolvedValue(null);
      repository.findByOrderId.mockResolvedValue(
        makePayment({ status: PaymentStatus.PAID }),
      );

      const result = await service.payOrder(
        customer,
        'order-1',
        IDEMPOTENCY_KEY,
        dto,
      );

      expect(repository.beginCharge).not.toHaveBeenCalled();
      expect(result.status).toBe(PaymentStatus.PAID);
    });

    it('throws PAYMENT_5001 (402) when the provider declines and marks the payment FAILED', async () => {
      ordersService.getOrderById.mockResolvedValue(ORDER);
      repository.findTransactionByIdempotencyKey.mockResolvedValue(null);
      repository.findByOrderId.mockResolvedValue(null);
      repository.beginCharge.mockResolvedValue({
        paymentId: 'payment-1',
        transactionId: 'tx-1',
      });
      repository.finalizeCharge.mockResolvedValue(
        makePayment({ status: PaymentStatus.FAILED }),
      );

      await expect(
        service.payOrder(customer, 'order-1', IDEMPOTENCY_KEY, {
          method: PaymentMethod.CARD,
          paymentToken: 'tok_decline',
        }),
      ).rejects.toMatchObject({
        response: { code: 'PAYMENT_5001' },
        status: 402,
      });
      expect(gateway.emitPaymentUpdated).toHaveBeenCalledWith(
        'order-1',
        PaymentStatus.FAILED,
      );
    });

    it('replays the original result for the same key + same payload without a second charge', async () => {
      ordersService.getOrderById.mockResolvedValue(ORDER);
      repository.findTransactionByIdempotencyKey.mockResolvedValue(
        makeTransaction(),
      );
      repository.findById.mockResolvedValue(makePayment());

      const result = await service.payOrder(
        customer,
        'order-1',
        IDEMPOTENCY_KEY,
        dto,
      );

      expect(repository.beginCharge).not.toHaveBeenCalled();
      expect(repository.findById).toHaveBeenCalledWith('payment-1');
      expect(result.status).toBe(PaymentStatus.PAID);
    });

    it('rejects the same key with a different payload (PAYMENT_5002)', async () => {
      ordersService.getOrderById.mockResolvedValue(ORDER);
      repository.findTransactionByIdempotencyKey.mockResolvedValue(
        makeTransaction(),
      );

      await expect(
        service.payOrder(customer, 'order-1', IDEMPOTENCY_KEY, {
          method: PaymentMethod.CARD,
          paymentToken: 'tok_other',
        }),
      ).rejects.toMatchObject({ response: { code: 'PAYMENT_5002' } });
      expect(repository.findById).not.toHaveBeenCalled();
    });

    it('replays a declined result again (402) rather than re-charging', async () => {
      ordersService.getOrderById.mockResolvedValue(ORDER);
      repository.findTransactionByIdempotencyKey.mockResolvedValue(
        makeTransaction(),
      );
      repository.findById.mockResolvedValue(
        makePayment({ status: PaymentStatus.FAILED }),
      );

      await expect(
        service.payOrder(customer, 'order-1', IDEMPOTENCY_KEY, dto),
      ).rejects.toMatchObject({ response: { code: 'PAYMENT_5001' } });
    });

    it('recovers from a concurrent duplicate-key race by replaying instead of failing', async () => {
      ordersService.getOrderById.mockResolvedValue(ORDER);
      repository.findTransactionByIdempotencyKey
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(makeTransaction());
      repository.findByOrderId.mockResolvedValue(null);
      repository.findById.mockResolvedValue(makePayment());

      const raceError = new Prisma.PrismaClientKnownRequestError('duplicate', {
        code: 'P2002',
        clientVersion: 'test',
      });
      repository.beginCharge.mockRejectedValue(raceError);

      const result = await service.payOrder(
        customer,
        'order-1',
        IDEMPOTENCY_KEY,
        dto,
      );

      expect(result.status).toBe(PaymentStatus.PAID);
    });
  });

  describe('getPaymentById', () => {
    it('throws PAYMENT_5000 when the payment does not exist', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(
        service.getPaymentById(customer, 'payment-1'),
      ).rejects.toMatchObject({ response: { code: 'PAYMENT_5000' } });
      expect(ordersService.getOrderById).not.toHaveBeenCalled();
    });

    it('delegates the access check to OrdersService and returns the mapped payment', async () => {
      repository.findById.mockResolvedValue(makePayment());
      ordersService.getOrderById.mockResolvedValue(ORDER);

      const result = await service.getPaymentById(customer, 'payment-1');

      expect(ordersService.getOrderById).toHaveBeenCalledWith(
        customer,
        'order-1',
      );
      expect(result.id).toBe('payment-1');
    });

    it('propagates AUTH_1003 when the caller has no access to the order', async () => {
      repository.findById.mockResolvedValue(makePayment());
      ordersService.getOrderById.mockRejectedValue(
        Object.assign(new Error('forbidden'), {
          response: { code: 'AUTH_1003' },
        }),
      );

      await expect(
        service.getPaymentById(customer, 'payment-1'),
      ).rejects.toMatchObject({ response: { code: 'AUTH_1003' } });
    });
  });

  describe('refundPayment', () => {
    it('throws PAYMENT_5000 when the payment does not exist', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(
        service.refundPayment('payment-1', {}),
      ).rejects.toMatchObject({ response: { code: 'PAYMENT_5000' } });
    });

    it('throws PAYMENT_5003 when the payment is not PAID', async () => {
      repository.findById.mockResolvedValue(
        makePayment({ status: PaymentStatus.PENDING }),
      );

      await expect(
        service.refundPayment('payment-1', {}),
      ).rejects.toMatchObject({ response: { code: 'PAYMENT_5003' } });
      expect(repository.createRefundTransaction).not.toHaveBeenCalled();
    });

    it('refunds a PAID payment and emits payment:updated', async () => {
      repository.findById.mockResolvedValue(makePayment());
      repository.createRefundTransaction.mockResolvedValue(
        makeTransaction({
          id: 'tx-refund',
          type: PaymentTransactionType.REFUND,
        }),
      );
      repository.finalizeRefund.mockResolvedValue(
        makePayment({ status: PaymentStatus.REFUNDED }),
      );

      const result = await service.refundPayment('payment-1', {
        reason: 'customer request',
      });

      expect(repository.createRefundTransaction).toHaveBeenCalledWith(
        'payment-1',
        expect.any(String),
        'customer request',
      );
      expect(gateway.emitPaymentUpdated).toHaveBeenCalledWith(
        'order-1',
        PaymentStatus.REFUNDED,
      );
      expect(result.status).toBe(PaymentStatus.REFUNDED);
    });
  });
});
