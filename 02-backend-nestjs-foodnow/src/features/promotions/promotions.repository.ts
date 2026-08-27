import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../core/database/prisma.service';
import { Promotion } from '../../generated/prisma/client';
import { PromotionDiscountType } from '../../generated/prisma/enums';

@Injectable()
export class PromotionsRepository {
  constructor(private readonly prisma: PrismaService) {}

  findByCode(code: string): Promise<Promotion | null> {
    return this.prisma.promotion.findUnique({ where: { code } });
  }

  createPromotion(data: {
    code: string;
    restaurantId: string | null;
    discountType: PromotionDiscountType;
    discountValue: number;
    minOrderAmount?: number;
    maxDiscountAmount?: number;
    usageLimit?: number;
    usageLimitPerUser?: number;
    startsAt: Date;
    endsAt: Date;
    isActive: boolean;
  }): Promise<Promotion> {
    return this.prisma.promotion.create({ data });
  }

  countUsages(promotionId: string): Promise<number> {
    return this.prisma.promotionUsage.count({ where: { promotionId } });
  }

  countUsagesByCustomer(
    promotionId: string,
    customerId: string,
  ): Promise<number> {
    return this.prisma.promotionUsage.count({
      where: { promotionId, customerId },
    });
  }

  async createUsage(
    promotionId: string,
    customerId: string,
    orderId: string,
    discountApplied: number,
  ): Promise<void> {
    await this.prisma.promotionUsage.create({
      data: { promotionId, customerId, orderId, discountApplied },
    });
  }
}
