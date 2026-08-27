/* eslint-disable @typescript-eslint/unbound-method -- jest mock assertions (expect(mock.method).toHaveBeenCalledWith) are always false positives for this rule */
import { PaymentMethod } from '../../../generated/prisma/enums';
import { Role } from '../../../shared/types/role.enum';
import { OrderPaymentController } from '../order-payment.controller';
import { PaymentsService } from '../payments.service';

describe('OrderPaymentController', () => {
  let controller: OrderPaymentController;
  let service: jest.Mocked<PaymentsService>;
  const customer = { sub: 'customer-1', role: Role.CUSTOMER };

  beforeEach(() => {
    service = {
      payOrder: jest.fn(),
    } as unknown as jest.Mocked<PaymentsService>;

    controller = new OrderPaymentController(service);
  });

  it('payOrder delegates with the caller, order id, idempotency key, and dto', async () => {
    const dto = { method: PaymentMethod.CARD, paymentToken: 'tok_visa' };
    await controller.payOrder(customer, 'order-1', 'idem-key-1', dto);
    expect(service.payOrder).toHaveBeenCalledWith(
      customer,
      'order-1',
      'idem-key-1',
      dto,
    );
  });

  it('passes through an undefined idempotency key so the service can reject it', async () => {
    const dto = { method: PaymentMethod.CASH };
    await controller.payOrder(customer, 'order-1', undefined, dto);
    expect(service.payOrder).toHaveBeenCalledWith(
      customer,
      'order-1',
      undefined,
      dto,
    );
  });
});
