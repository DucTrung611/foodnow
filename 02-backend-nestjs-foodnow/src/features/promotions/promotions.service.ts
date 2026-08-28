import {
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  UnprocessableEntityException,
} from '@nestjs/common';
import { Prisma, Promotion } from '../../generated/prisma/client';
import { PromotionDiscountType } from '../../generated/prisma/enums';
import { RestaurantsService } from '../restaurants/restaurants.service';
import { JwtPayload } from '../../shared/types/jwt-payload.type';
import { Role } from '../../shared/types/role.enum';
import { formatDecimal } from '../../shared/utils/decimal.util';
import { CreatePromotionDto } from './dto/create-promotion.dto';
import { PromotionResponseDto } from './dto/promotion-response.dto';
import { ValidatePromotionDto } from './dto/validate-promotion.dto';
import { ValidatePromotionResponseDto } from './dto/validate-promotion-response.dto';
import { PromotionsRepository } from './promotions.repository';

function toPromotionResponseDto(promo: Promotion): PromotionResponseDto {
  return {
    id: promo.id,
    code: promo.code,
    restaurantId: promo.restaurantId,
    discountType: promo.discountType,
    discountValue: formatDecimal(promo.discountValue),
    minOrderAmount:
      promo.minOrderAmount === null
        ? null
        : formatDecimal(promo.minOrderAmount),
    maxDiscountAmount:
      promo.maxDiscountAmount === null
        ? null
        : formatDecimal(promo.maxDiscountAmount),
    usageLimit: promo.usageLimit,
    usageLimitPerUser: promo.usageLimitPerUser,
    startsAt: promo.startsAt,
    endsAt: promo.endsAt,
    isActive: promo.isActive,
  };
}

function throwInvalidPromo(): never {
  throw new UnprocessableEntityException({
    code: 'PROMO_6001',
    message: 'Promotion expired or usage limit reached',
  });
}

@Injectable()
export class PromotionsService {
  private readonly logger = new Logger(PromotionsService.name);

  constructor(
    private readonly promotionsRepository: PromotionsRepository,
    private readonly restaurantsService: RestaurantsService,
  ) {}

  async validate(
    customerId: string,
    dto: ValidatePromotionDto,
  ): Promise<ValidatePromotionResponseDto> {
    const promotion = await this.promotionsRepository.findByCode(dto.code);
    if (!promotion) throwInvalidPromo();

    const now = new Date();
    if (
      !promotion.isActive ||
      now < promotion.startsAt ||
      now > promotion.endsAt
    ) {
      throwInvalidPromo();
    }
    if (
      promotion.restaurantId !== null &&
      promotion.restaurantId !== dto.restaurantId
    ) {
      throwInvalidPromo();
    }

    const subtotal = Number(dto.subtotal);
    if (
      promotion.minOrderAmount !== null &&
      subtotal < Number(promotion.minOrderAmount)
    ) {
      throwInvalidPromo();
    }

    if (promotion.usageLimit !== null) {
      const used = await this.promotionsRepository.countUsages(promotion.id);
      if (used >= promotion.usageLimit) throwInvalidPromo();
    }
    if (promotion.usageLimitPerUser !== null) {
      const usedByCustomer =
        await this.promotionsRepository.countUsagesByCustomer(
          promotion.id,
          customerId,
        );
      if (usedByCustomer >= promotion.usageLimitPerUser) throwInvalidPromo();
    }

    return {
      id: promotion.id,
      code: promotion.code,
      discountAmount: this.computeDiscount(promotion, subtotal).toFixed(2),
    };
  }

  private computeDiscount(promotion: Promotion, subtotal: number): number {
    let discount =
      promotion.discountType === PromotionDiscountType.PERCENTAGE
        ? subtotal * (Number(promotion.discountValue) / 100)
        : Number(promotion.discountValue);
    if (promotion.maxDiscountAmount !== null) {
      discount = Math.min(discount, Number(promotion.maxDiscountAmount));
    }
    return Math.min(discount, subtotal);
  }

  async createPromotion(
    user: JwtPayload,
    dto: CreatePromotionDto,
  ): Promise<PromotionResponseDto> {
    const restaurantId = dto.restaurantId ?? null;
    if (restaurantId) {
      const restaurant = await this.restaurantsService.getById(restaurantId);
      if (user.role === Role.VENDOR && restaurant.ownerId !== user.sub) {
        throw new ForbiddenException({
          code: 'AUTH_1003',
          message: 'Insufficient role permission',
        });
      }
    } else if (user.role === Role.VENDOR) {
      // Global (restaurant-less) promotions are ADMIN-only.
      throw new ForbiddenException({
        code: 'AUTH_1003',
        message: 'Insufficient role permission',
      });
    }

    try {
      const promotion = await this.promotionsRepository.createPromotion({
        code: dto.code,
        restaurantId,
        discountType: dto.discountType,
        discountValue: Number(dto.discountValue),
        minOrderAmount:
          dto.minOrderAmount === undefined
            ? undefined
            : Number(dto.minOrderAmount),
        maxDiscountAmount:
          dto.maxDiscountAmount === undefined
            ? undefined
            : Number(dto.maxDiscountAmount),
        usageLimit: dto.usageLimit,
        usageLimitPerUser: dto.usageLimitPerUser,
        startsAt: new Date(dto.startsAt),
        endsAt: new Date(dto.endsAt),
        isActive: dto.isActive ?? true,
      });
      return toPromotionResponseDto(promotion);
    } catch (error) {
      const isDuplicateCode =
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002';
      if (isDuplicateCode) {
        throw new ConflictException({
          code: 'PROMO_6002',
          message: 'Promotion code already exists',
        });
      }
      throw error;
    }
  }

  /** Fire-and-forget from OrdersService after its order-creation transaction
   * commits — a failure here means undercounted usage, not a broken order. */
  async recordUsage(
    promotionId: string,
    customerId: string,
    orderId: string,
    discountApplied: number,
  ): Promise<void> {
    try {
      await this.promotionsRepository.createUsage(
        promotionId,
        customerId,
        orderId,
        discountApplied,
      );
    } catch (error) {
      this.logger.warn(
        `Failed to record promotion usage for order ${orderId}: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }
}
