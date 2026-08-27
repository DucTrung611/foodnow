import { Injectable } from '@nestjs/common';
import { DriverEarning } from '../../generated/prisma/client';
import { DriverEarningStatus } from '../../generated/prisma/enums';
import {
  EarningResponseDto,
  EarningsSummaryResponseDto,
} from './dto/earnings-summary-response.dto';
import { EarningsRepository } from './earnings.repository';

const DEFAULT_HISTORY_LIMIT = 20;

function toEarningResponseDto(earning: DriverEarning): EarningResponseDto {
  return {
    id: earning.id,
    deliveryId: earning.deliveryId,
    amount: String(earning.amount),
    status: earning.status,
    paidAt: earning.paidAt,
    createdAt: earning.createdAt,
  };
}

@Injectable()
export class EarningsService {
  constructor(private readonly earningsRepository: EarningsRepository) {}

  async getSummary(
    driverId: string,
    limit = DEFAULT_HISTORY_LIMIT,
  ): Promise<EarningsSummaryResponseDto> {
    const [totalPendingAmount, totalPaidAmount, earnings] = await Promise.all([
      this.earningsRepository.sumAmountByStatus(
        driverId,
        DriverEarningStatus.PENDING,
      ),
      this.earningsRepository.sumAmountByStatus(
        driverId,
        DriverEarningStatus.PAID,
      ),
      this.earningsRepository.findRecentByDriver(driverId, limit),
    ]);

    return {
      totalPendingAmount: totalPendingAmount.toFixed(2),
      totalPaidAmount: totalPaidAmount.toFixed(2),
      earnings: earnings.map(toEarningResponseDto),
    };
  }

  /** Called from EarningsListener on `delivery.completed` — credits the
   * driver with the order's delivery fee. */
  async recordEarning(
    driverId: string,
    deliveryId: string,
    amount: number,
  ): Promise<void> {
    await this.earningsRepository.createEarning(driverId, deliveryId, amount);
  }
}
