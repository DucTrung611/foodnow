/* eslint-disable @typescript-eslint/unbound-method -- jest mock assertions (expect(mock.method).toHaveBeenCalledWith) are always false positives for this rule */
import { Prisma, Promotion } from '../../../generated/prisma/client';
import { PromotionDiscountType } from '../../../generated/prisma/enums';
import { Role } from '../../../shared/types/role.enum';
import { RestaurantResponseDto } from '../../restaurants/dto/restaurant-response.dto';
import { RestaurantsService } from '../../restaurants/restaurants.service';
import { PromotionsRepository } from '../promotions.repository';
import { PromotionsService } from '../promotions.service';

const RESTAURANT: RestaurantResponseDto = {
  id: 'restaurant-1',
  ownerId: 'owner-1',
  name: 'Pho 24',
  description: null,
  lat: 21.0245,
  lng: 105.8412,
  openingHours: {} as never,
  status: 'ACTIVE',
  avgRating: '4.50',
  isOpen: true,
  version: 0,
};

function makePromotion(overrides: Partial<Promotion> = {}): Promotion {
  return {
    id: 'promo-1',
    code: 'FREESHIP',
    restaurantId: null,
    discountType: PromotionDiscountType.PERCENTAGE,
    discountValue: '10' as never,
    minOrderAmount: null,
    maxDiscountAmount: null,
    usageLimit: null,
    usageLimitPerUser: null,
    startsAt: new Date('2026-01-01T00:00:00.000Z'),
    endsAt: new Date('2027-01-01T00:00:00.000Z'),
    isActive: true,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    ...overrides,
  };
}

describe('PromotionsService', () => {
  let service: PromotionsService;
  let repository: jest.Mocked<PromotionsRepository>;
  let restaurantsService: jest.Mocked<RestaurantsService>;

  beforeEach(() => {
    repository = {
      findByCode: jest.fn(),
      createPromotion: jest.fn(),
      countUsages: jest.fn(),
      countUsagesByCustomer: jest.fn(),
      createUsage: jest.fn(),
    } as unknown as jest.Mocked<PromotionsRepository>;

    restaurantsService = {
      getById: jest.fn(),
    } as unknown as jest.Mocked<RestaurantsService>;

    service = new PromotionsService(repository, restaurantsService);
  });

  describe('validate', () => {
    const dto = {
      code: 'FREESHIP',
      restaurantId: 'restaurant-1',
      subtotal: '100000.00',
    };

    it('throws PROMO_6001 when the code does not exist', async () => {
      repository.findByCode.mockResolvedValue(null);

      await expect(service.validate('customer-1', dto)).rejects.toMatchObject({
        response: { code: 'PROMO_6001' },
      });
    });

    it('throws PROMO_6001 when the promotion is inactive', async () => {
      repository.findByCode.mockResolvedValue(
        makePromotion({ isActive: false }),
      );

      await expect(service.validate('customer-1', dto)).rejects.toMatchObject({
        response: { code: 'PROMO_6001' },
      });
    });

    it('throws PROMO_6001 when outside the active date window', async () => {
      repository.findByCode.mockResolvedValue(
        makePromotion({
          startsAt: new Date('2020-01-01'),
          endsAt: new Date('2020-02-01'),
        }),
      );

      await expect(service.validate('customer-1', dto)).rejects.toMatchObject({
        response: { code: 'PROMO_6001' },
      });
    });

    it('throws PROMO_6001 when scoped to a different restaurant', async () => {
      repository.findByCode.mockResolvedValue(
        makePromotion({ restaurantId: 'other-restaurant' }),
      );

      await expect(service.validate('customer-1', dto)).rejects.toMatchObject({
        response: { code: 'PROMO_6001' },
      });
    });

    it('throws PROMO_6001 when subtotal is below minOrderAmount', async () => {
      repository.findByCode.mockResolvedValue(
        makePromotion({ minOrderAmount: '200000.00' as never }),
      );

      await expect(service.validate('customer-1', dto)).rejects.toMatchObject({
        response: { code: 'PROMO_6001' },
      });
    });

    it('throws PROMO_6001 when the global usage limit is reached', async () => {
      repository.findByCode.mockResolvedValue(makePromotion({ usageLimit: 5 }));
      repository.countUsages.mockResolvedValue(5);

      await expect(service.validate('customer-1', dto)).rejects.toMatchObject({
        response: { code: 'PROMO_6001' },
      });
    });

    it('throws PROMO_6001 when the per-user usage limit is reached', async () => {
      repository.findByCode.mockResolvedValue(
        makePromotion({ usageLimitPerUser: 1 }),
      );
      repository.countUsagesByCustomer.mockResolvedValue(1);

      await expect(service.validate('customer-1', dto)).rejects.toMatchObject({
        response: { code: 'PROMO_6001' },
      });
    });

    it('computes a PERCENTAGE discount capped at maxDiscountAmount', async () => {
      repository.findByCode.mockResolvedValue(
        makePromotion({
          discountType: PromotionDiscountType.PERCENTAGE,
          discountValue: '50' as never, // 50% of 100000 = 50000
          maxDiscountAmount: '20000.00' as never,
        }),
      );

      const result = await service.validate('customer-1', dto);

      expect(result).toEqual({
        id: 'promo-1',
        code: 'FREESHIP',
        discountAmount: '20000.00',
      });
    });

    it('computes a FIXED_AMOUNT discount capped at the subtotal', async () => {
      repository.findByCode.mockResolvedValue(
        makePromotion({
          discountType: PromotionDiscountType.FIXED_AMOUNT,
          discountValue: '500000.00' as never, // way more than subtotal
        }),
      );

      const result = await service.validate('customer-1', {
        ...dto,
        subtotal: '100000.00',
      });

      expect(result.discountAmount).toBe('100000.00');
    });
  });

  describe('createPromotion', () => {
    const dto = {
      code: 'NEWPROMO',
      discountType: PromotionDiscountType.FIXED_AMOUNT,
      discountValue: '10000.00',
      startsAt: '2026-01-01T00:00:00.000Z',
      endsAt: '2027-01-01T00:00:00.000Z',
    };

    it('rejects a VENDOR creating a global (restaurant-less) promotion', async () => {
      await expect(
        service.createPromotion({ sub: 'vendor-1', role: Role.VENDOR }, dto),
      ).rejects.toMatchObject({ response: { code: 'AUTH_1003' } });
      expect(repository.createPromotion).not.toHaveBeenCalled();
    });

    it("rejects a VENDOR creating a promotion for a restaurant they don't own", async () => {
      restaurantsService.getById.mockResolvedValue(RESTAURANT);

      await expect(
        service.createPromotion(
          { sub: 'someone-else', role: Role.VENDOR },
          { ...dto, restaurantId: 'restaurant-1' },
        ),
      ).rejects.toMatchObject({ response: { code: 'AUTH_1003' } });
      expect(repository.createPromotion).not.toHaveBeenCalled();
    });

    it('allows ADMIN to create a global promotion', async () => {
      repository.createPromotion.mockResolvedValue(makePromotion());

      await service.createPromotion({ sub: 'admin-1', role: Role.ADMIN }, dto);

      expect(repository.createPromotion).toHaveBeenCalledWith(
        expect.objectContaining({ code: 'NEWPROMO', restaurantId: null }),
      );
    });

    it('allows a VENDOR to create a promotion for their own restaurant', async () => {
      restaurantsService.getById.mockResolvedValue(RESTAURANT);
      repository.createPromotion.mockResolvedValue(
        makePromotion({ restaurantId: 'restaurant-1' }),
      );

      const result = await service.createPromotion(
        { sub: 'owner-1', role: Role.VENDOR },
        { ...dto, restaurantId: 'restaurant-1' },
      );

      expect(repository.createPromotion).toHaveBeenCalledWith(
        expect.objectContaining({ restaurantId: 'restaurant-1' }),
      );
      expect(result.id).toBe('promo-1');
    });

    it('throws PROMO_6002 on a duplicate promotion code', async () => {
      const p2002 = new Prisma.PrismaClientKnownRequestError('duplicate', {
        code: 'P2002',
        clientVersion: 'test',
      });
      repository.createPromotion.mockRejectedValue(p2002);

      await expect(
        service.createPromotion({ sub: 'admin-1', role: Role.ADMIN }, dto),
      ).rejects.toMatchObject({ response: { code: 'PROMO_6002' } });
    });
  });

  describe('recordUsage', () => {
    it('delegates to the repository', async () => {
      await service.recordUsage('promo-1', 'customer-1', 'order-1', 15000);

      expect(repository.createUsage).toHaveBeenCalledWith(
        'promo-1',
        'customer-1',
        'order-1',
        15000,
      );
    });

    it('swallows repository errors — usage accounting must never break order creation', async () => {
      repository.createUsage.mockRejectedValue(new Error('db down'));

      await expect(
        service.recordUsage('promo-1', 'customer-1', 'order-1', 15000),
      ).resolves.toBeUndefined();
    });
  });
});
