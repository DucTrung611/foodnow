/* eslint-disable @typescript-eslint/unbound-method -- jest mock assertions (expect(mock.method).toHaveBeenCalledWith) are always false positives for this rule */
import { DriverEarning } from '../../../generated/prisma/client';
import { DriverEarningStatus } from '../../../generated/prisma/enums';
import { EarningsRepository } from '../earnings.repository';
import { EarningsService } from '../earnings.service';

function makeEarning(overrides: Partial<DriverEarning> = {}): DriverEarning {
  return {
    id: 'earning-1',
    driverId: 'driver-1',
    deliveryId: 'delivery-1',
    amount: '18000.00' as never,
    status: DriverEarningStatus.PENDING,
    paidAt: null,
    createdAt: new Date('2026-08-24T10:30:00.000Z'),
    ...overrides,
  };
}

describe('EarningsService', () => {
  let service: EarningsService;
  let repository: jest.Mocked<EarningsRepository>;

  beforeEach(() => {
    repository = {
      createEarning: jest.fn(),
      sumAmountByStatus: jest.fn(),
      findRecentByDriver: jest.fn(),
    } as unknown as jest.Mocked<EarningsRepository>;

    service = new EarningsService(repository);
  });

  describe('getSummary', () => {
    it('aggregates pending/paid totals and the recent earnings list', async () => {
      repository.sumAmountByStatus.mockImplementation((_driverId, status) =>
        Promise.resolve(status === DriverEarningStatus.PENDING ? 18000 : 54000),
      );
      repository.findRecentByDriver.mockResolvedValue([makeEarning()]);

      const result = await service.getSummary('driver-1', 10);

      expect(repository.sumAmountByStatus).toHaveBeenCalledWith(
        'driver-1',
        DriverEarningStatus.PENDING,
      );
      expect(repository.sumAmountByStatus).toHaveBeenCalledWith(
        'driver-1',
        DriverEarningStatus.PAID,
      );
      expect(repository.findRecentByDriver).toHaveBeenCalledWith(
        'driver-1',
        10,
      );
      expect(result).toEqual({
        totalPendingAmount: '18000.00',
        totalPaidAmount: '54000.00',
        earnings: [
          {
            id: 'earning-1',
            deliveryId: 'delivery-1',
            amount: '18000.00',
            status: DriverEarningStatus.PENDING,
            paidAt: null,
            createdAt: makeEarning().createdAt,
          },
        ],
      });
    });

    it('defaults the history limit to 20 when not provided', async () => {
      repository.sumAmountByStatus.mockResolvedValue(0);
      repository.findRecentByDriver.mockResolvedValue([]);

      await service.getSummary('driver-1');

      expect(repository.findRecentByDriver).toHaveBeenCalledWith(
        'driver-1',
        20,
      );
    });
  });

  describe('recordEarning', () => {
    it('delegates to the repository', async () => {
      await service.recordEarning('driver-1', 'delivery-1', 18000);

      expect(repository.createEarning).toHaveBeenCalledWith(
        'driver-1',
        'delivery-1',
        18000,
      );
    });
  });
});
