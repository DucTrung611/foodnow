/* eslint-disable @typescript-eslint/unbound-method -- jest mock assertions (expect(mock.method).toHaveBeenCalledWith) are always false positives for this rule */
import { Role } from '../../../shared/types/role.enum';
import { DeliveriesController } from '../deliveries.controller';
import { DeliveryService } from '../delivery.service';

describe('DeliveriesController', () => {
  let controller: DeliveriesController;
  let service: jest.Mocked<DeliveryService>;
  const user = { sub: 'driver-1', role: Role.DRIVER };

  beforeEach(() => {
    service = {
      listAvailableDeliveries: jest.fn(),
      acceptDelivery: jest.fn(),
      confirmPickup: jest.fn(),
      confirmComplete: jest.fn(),
    } as unknown as jest.Mocked<DeliveryService>;

    controller = new DeliveriesController(service);
  });

  it('listAvailable delegates with the caller id', async () => {
    await controller.listAvailable(user);
    expect(service.listAvailableDeliveries).toHaveBeenCalledWith('driver-1');
  });

  it('accept delegates with the full caller payload and order id', async () => {
    await controller.accept(user, 'order-1');
    expect(service.acceptDelivery).toHaveBeenCalledWith(user, 'order-1');
  });

  it('pickup delegates with the full caller payload and order id', async () => {
    await controller.pickup(user, 'order-1');
    expect(service.confirmPickup).toHaveBeenCalledWith(user, 'order-1');
  });

  it('complete delegates with the full caller payload and order id', async () => {
    await controller.complete(user, 'order-1');
    expect(service.confirmComplete).toHaveBeenCalledWith(user, 'order-1');
  });
});
