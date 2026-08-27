/* eslint-disable @typescript-eslint/unbound-method -- jest mock assertions (expect(mock.method).toHaveBeenCalledWith) are always false positives for this rule */
import { Role } from '../../../shared/types/role.enum';
import { PaymentsController } from '../payments.controller';
import { PaymentsService } from '../payments.service';

describe('PaymentsController', () => {
  let controller: PaymentsController;
  let service: jest.Mocked<PaymentsService>;
  const customer = { sub: 'customer-1', role: Role.CUSTOMER };

  beforeEach(() => {
    service = {
      getPaymentById: jest.fn(),
      refundPayment: jest.fn(),
    } as unknown as jest.Mocked<PaymentsService>;

    controller = new PaymentsController(service);
  });

  it('getPaymentById delegates with the caller and payment id', async () => {
    await controller.getPaymentById(customer, 'payment-1');
    expect(service.getPaymentById).toHaveBeenCalledWith(customer, 'payment-1');
  });

  it('refundPayment delegates with the payment id and dto', async () => {
    const dto = { reason: 'customer request' };
    await controller.refundPayment('payment-1', dto);
    expect(service.refundPayment).toHaveBeenCalledWith('payment-1', dto);
  });
});
