/* eslint-disable @typescript-eslint/unbound-method -- jest mock assertions (expect(mock.method).toHaveBeenCalledWith) are always false positives for this rule */
import { Review } from '../../../generated/prisma/client';
import { Role } from '../../../shared/types/role.enum';
import { OrderResponseDto } from '../../orders/dto/order-response.dto';
import { OrdersService } from '../../orders/orders.service';
import { RestaurantResponseDto } from '../../restaurants/dto/restaurant-response.dto';
import { RestaurantsService } from '../../restaurants/restaurants.service';
import { ReviewsRepository } from '../reviews.repository';
import { ReviewsService } from '../reviews.service';

const customer = { sub: 'customer-1', role: Role.CUSTOMER };

function makeOrder(
  overrides: Partial<OrderResponseDto> = {},
): OrderResponseDto {
  return {
    id: 'order-1',
    orderCode: 'FN-260824-0001',
    customerId: 'customer-1',
    restaurantId: 'restaurant-1',
    driverId: 'driver-1',
    deliveryAddressId: 'address-1',
    status: 'DELIVERED',
    subtotal: '55000.00',
    deliveryFee: '18000.00',
    discountAmount: '0.00',
    totalAmount: '73000.00',
    version: 3,
    placedAt: new Date('2026-08-24T10:30:00.000Z'),
    items: [],
    ...overrides,
  };
}

function makeReview(overrides: Partial<Review> = {}): Review {
  return {
    id: 'review-1',
    orderId: 'order-1',
    customerId: 'customer-1',
    restaurantId: 'restaurant-1',
    driverId: 'driver-1',
    rating: 5,
    comment: 'Great food',
    createdAt: new Date('2026-08-25T10:30:00.000Z'),
    ...overrides,
  };
}

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

describe('ReviewsService', () => {
  let service: ReviewsService;
  let repository: jest.Mocked<ReviewsRepository>;
  let ordersService: jest.Mocked<OrdersService>;
  let restaurantsService: jest.Mocked<RestaurantsService>;

  beforeEach(() => {
    repository = {
      findByOrderId: jest.fn(),
      createReview: jest.fn(),
      findByRestaurant: jest.fn(),
      avgRatingForRestaurant: jest.fn(),
    } as unknown as jest.Mocked<ReviewsRepository>;

    ordersService = {
      getOrderById: jest.fn(),
    } as unknown as jest.Mocked<OrdersService>;

    restaurantsService = {
      getById: jest.fn(),
      updateAvgRating: jest.fn(),
    } as unknown as jest.Mocked<RestaurantsService>;

    service = new ReviewsService(repository, ordersService, restaurantsService);
  });

  describe('createReview', () => {
    const dto = { rating: 5, comment: 'Great food' };

    it('propagates ORDER_3005/AUTH_1003 from OrdersService.getOrderById unchanged', async () => {
      ordersService.getOrderById.mockRejectedValue(
        Object.assign(new Error('not found'), {
          response: { code: 'ORDER_3005' },
        }),
      );

      await expect(
        service.createReview(customer, 'order-1', dto),
      ).rejects.toMatchObject({ response: { code: 'ORDER_3005' } });
    });

    it("throws AUTH_1003 when the caller isn't the order's own customer", async () => {
      ordersService.getOrderById.mockResolvedValue(
        makeOrder({ customerId: 'someone-else' }),
      );

      await expect(
        service.createReview(customer, 'order-1', dto),
      ).rejects.toMatchObject({ response: { code: 'AUTH_1003' } });
      expect(repository.createReview).not.toHaveBeenCalled();
    });

    it('throws REVIEW_7001 when the order is not DELIVERED yet', async () => {
      ordersService.getOrderById.mockResolvedValue(
        makeOrder({ status: 'ON_THE_WAY' as never }),
      );

      await expect(
        service.createReview(customer, 'order-1', dto),
      ).rejects.toMatchObject({ response: { code: 'REVIEW_7001' } });
      expect(repository.createReview).not.toHaveBeenCalled();
    });

    it('throws REVIEW_7002 when the order already has a review', async () => {
      ordersService.getOrderById.mockResolvedValue(makeOrder());
      repository.findByOrderId.mockResolvedValue(makeReview());

      await expect(
        service.createReview(customer, 'order-1', dto),
      ).rejects.toMatchObject({ response: { code: 'REVIEW_7002' } });
      expect(repository.createReview).not.toHaveBeenCalled();
    });

    it('creates the review and recomputes the restaurant avg rating', async () => {
      ordersService.getOrderById.mockResolvedValue(makeOrder());
      repository.findByOrderId.mockResolvedValue(null);
      repository.createReview.mockResolvedValue(makeReview());
      repository.avgRatingForRestaurant.mockResolvedValue(4.75);

      const result = await service.createReview(customer, 'order-1', dto);

      expect(repository.createReview).toHaveBeenCalledWith({
        orderId: 'order-1',
        customerId: 'customer-1',
        restaurantId: 'restaurant-1',
        driverId: 'driver-1',
        rating: 5,
        comment: 'Great food',
      });
      expect(repository.avgRatingForRestaurant).toHaveBeenCalledWith(
        'restaurant-1',
      );
      expect(restaurantsService.updateAvgRating).toHaveBeenCalledWith(
        'restaurant-1',
        4.75,
      );
      expect(result.id).toBe('review-1');
    });
  });

  describe('listByRestaurant', () => {
    it('throws RESTAURANT_2001 when the restaurant does not exist', async () => {
      restaurantsService.getById.mockRejectedValue(
        Object.assign(new Error('not found'), {
          response: { code: 'RESTAURANT_2001' },
        }),
      );

      await expect(
        service.listByRestaurant('restaurant-1', {}),
      ).rejects.toMatchObject({ response: { code: 'RESTAURANT_2001' } });
    });

    it('returns a paginated list of reviews for the restaurant', async () => {
      restaurantsService.getById.mockResolvedValue(RESTAURANT);
      repository.findByRestaurant.mockResolvedValue({
        rows: [makeReview()],
        total: 1,
      });

      const result = await service.listByRestaurant('restaurant-1', {
        page: 1,
        limit: 20,
      });

      expect(repository.findByRestaurant).toHaveBeenCalledWith(
        'restaurant-1',
        0,
        20,
      );
      expect(result.data).toHaveLength(1);
      expect(result.meta).toEqual({
        page: 1,
        limit: 20,
        total: 1,
        totalPages: 1,
      });
    });
  });
});
