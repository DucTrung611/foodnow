import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../core/database/prisma.service';
import { DriverEarning } from '../../generated/prisma/client';
import { DriverEarningStatus } from '../../generated/prisma/enums';

@Injectable()
export class EarningsRepository {
  constructor(private readonly prisma: PrismaService) {}

  createEarning(
    driverId: string,
    deliveryId: string,
    amount: number,
  ): Promise<DriverEarning> {
    return this.prisma.driverEarning.create({
      data: {
        driverId,
        deliveryId,
        amount,
        status: DriverEarningStatus.PENDING,
      },
    });
  }

  async sumAmountByStatus(
    driverId: string,
    status: DriverEarningStatus,
  ): Promise<number> {
    const result = await this.prisma.driverEarning.aggregate({
      where: { driverId, status },
      _sum: { amount: true },
    });
    return Number(result._sum.amount ?? 0);
  }

  findRecentByDriver(driverId: string, take: number): Promise<DriverEarning[]> {
    return this.prisma.driverEarning.findMany({
      where: { driverId },
      orderBy: { createdAt: 'desc' },
      take,
    });
  }
}
