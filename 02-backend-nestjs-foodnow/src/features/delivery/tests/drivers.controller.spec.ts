/* eslint-disable @typescript-eslint/unbound-method -- jest mock assertions (expect(mock.method).toHaveBeenCalledWith) are always false positives for this rule */
import { Role } from '../../../shared/types/role.enum';
import { DeliveryService } from '../delivery.service';
import { DriversController } from '../drivers.controller';

describe('DriversController', () => {
  let controller: DriversController;
  let service: jest.Mocked<DeliveryService>;
  const user = { sub: 'driver-1', role: Role.DRIVER };

  beforeEach(() => {
    service = {
      setAvailability: jest.fn(),
      pushLocation: jest.fn(),
    } as unknown as jest.Mocked<DeliveryService>;

    controller = new DriversController(service);
  });

  it('setAvailability delegates with the caller id and isAvailable flag', async () => {
    await controller.setAvailability(user, { isAvailable: true });
    expect(service.setAvailability).toHaveBeenCalledWith('driver-1', true);
  });

  it('pushLocation delegates with the caller id and dto', async () => {
    const dto = { lat: 21.02, lng: 105.84 };
    await controller.pushLocation(user, dto);
    expect(service.pushLocation).toHaveBeenCalledWith('driver-1', dto);
  });
});
