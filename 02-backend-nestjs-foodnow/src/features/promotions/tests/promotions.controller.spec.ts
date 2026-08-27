/* eslint-disable @typescript-eslint/unbound-method -- jest mock assertions (expect(mock.method).toHaveBeenCalledWith) are always false positives for this rule */
import { PromotionDiscountType } from '../../../generated/prisma/enums';
import { Role } from '../../../shared/types/role.enum';
import { PromotionsController } from '../promotions.controller';
import { PromotionsService } from '../promotions.service';

describe('PromotionsController', () => {
  let controller: PromotionsController;
  let service: jest.Mocked<PromotionsService>;
  const customer = { sub: 'customer-1', role: Role.CUSTOMER };
  const admin = { sub: 'admin-1', role: Role.ADMIN };

  beforeEach(() => {
    service = {
      validate: jest.fn(),
      createPromotion: jest.fn(),
    } as unknown as jest.Mocked<PromotionsService>;

    controller = new PromotionsController(service);
  });

  it('validate delegates with the caller id and dto', async () => {
    const dto = {
      code: 'FREESHIP',
      restaurantId: 'restaurant-1',
      subtotal: '100000.00',
    };
    await controller.validate(customer, dto);
    expect(service.validate).toHaveBeenCalledWith('customer-1', dto);
  });

  it('createPromotion delegates with the full caller payload and dto', async () => {
    const dto = {
      code: 'NEWPROMO',
      discountType: PromotionDiscountType.FIXED_AMOUNT,
      discountValue: '10000.00',
      startsAt: '2026-01-01T00:00:00.000Z',
      endsAt: '2027-01-01T00:00:00.000Z',
    };
    await controller.createPromotion(admin, dto);
    expect(service.createPromotion).toHaveBeenCalledWith(admin, dto);
  });
});
