/* eslint-disable @typescript-eslint/unbound-method -- jest mock assertions (expect(mock.method).toHaveBeenCalledWith) are always false positives for this rule */
import { Role } from '../../../shared/types/role.enum';
import { EarningsController } from '../earnings.controller';
import { EarningsService } from '../earnings.service';

describe('EarningsController', () => {
  let controller: EarningsController;
  let service: jest.Mocked<EarningsService>;
  const driver = { sub: 'driver-1', role: Role.DRIVER };

  beforeEach(() => {
    service = {
      getSummary: jest.fn(),
    } as unknown as jest.Mocked<EarningsService>;

    controller = new EarningsController(service);
  });

  it('getSummary delegates with the caller id and query limit', async () => {
    await controller.getSummary(driver, { limit: 10 });
    expect(service.getSummary).toHaveBeenCalledWith('driver-1', 10);
  });

  it('passes an undefined limit through so the service can default it', async () => {
    await controller.getSummary(driver, {});
    expect(service.getSummary).toHaveBeenCalledWith('driver-1', undefined);
  });
});
