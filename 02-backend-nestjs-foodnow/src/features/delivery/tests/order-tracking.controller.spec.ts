/* eslint-disable @typescript-eslint/unbound-method -- jest mock assertions (expect(mock.method).toHaveBeenCalledWith) are always false positives for this rule */
import { Role } from '../../../shared/types/role.enum';
import { DeliveryService } from '../delivery.service';
import { OrderTrackingController } from '../order-tracking.controller';

describe('OrderTrackingController', () => {
  let controller: OrderTrackingController;
  let service: jest.Mocked<DeliveryService>;
  const user = { sub: 'customer-1', role: Role.CUSTOMER };

  beforeEach(() => {
    service = {
      getTracking: jest.fn(),
    } as unknown as jest.Mocked<DeliveryService>;
    controller = new OrderTrackingController(service);
  });

  it('getTracking delegates with the full caller payload and order id', async () => {
    await controller.getTracking(user, 'order-1');
    expect(service.getTracking).toHaveBeenCalledWith(user, 'order-1');
  });
});
