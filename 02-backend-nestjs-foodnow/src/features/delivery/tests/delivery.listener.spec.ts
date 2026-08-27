/* eslint-disable @typescript-eslint/unbound-method -- jest mock assertions (expect(mock.method).toHaveBeenCalledWith) are always false positives for this rule */
import { ConfigService } from '@nestjs/config';
import { OrderResponseDto } from '../../orders/dto/order-response.dto';
import { OrdersService } from '../../orders/orders.service';
import { RestaurantResponseDto } from '../../restaurants/dto/restaurant-response.dto';
import { RestaurantsService } from '../../restaurants/restaurants.service';
import { DeliveryGateway } from '../delivery.gateway';
import { DeliveryListener } from '../delivery.listener';
import { DeliveryRepository, DriverLocationRow } from '../delivery.repository';
import { DeliveryService } from '../delivery.service';

const RESTAURANT = {
  id: 'restaurant-1',
  lat: 21.02,
  lng: 105.84,
} as RestaurantResponseDto;
const ORDER = { id: 'order-1', deliveryFee: '18000.00' } as OrderResponseDto;

function makeLocation(
  overrides: Partial<DriverLocationRow> = {},
): DriverLocationRow {
  return {
    id: 'loc-1',
    driver_id: 'driver-1',
    order_id: null,
    recorded_at: new Date('2026-08-24T10:00:00.000Z'),
    lat: 21.02,
    lng: 105.84,
    ...overrides,
  };
}

describe('DeliveryListener', () => {
  let listener: DeliveryListener;
  let deliveryService: jest.Mocked<DeliveryService>;
  let repository: jest.Mocked<DeliveryRepository>;
  let gateway: jest.Mocked<DeliveryGateway>;
  let restaurantsService: jest.Mocked<RestaurantsService>;
  let ordersService: jest.Mocked<OrdersService>;
  let configService: jest.Mocked<ConfigService>;

  beforeEach(() => {
    deliveryService = {
      listOnlineDriverIds: jest.fn(),
    } as unknown as jest.Mocked<DeliveryService>;
    repository = {
      findLatestByDriverId: jest.fn(),
    } as unknown as jest.Mocked<DeliveryRepository>;
    gateway = {
      emitNewOffer: jest.fn(),
    } as unknown as jest.Mocked<DeliveryGateway>;
    restaurantsService = {
      getById: jest.fn(),
    } as unknown as jest.Mocked<RestaurantsService>;
    ordersService = {
      getOrderUnchecked: jest.fn(),
    } as unknown as jest.Mocked<OrdersService>;
    configService = {
      get: jest.fn((key: string, def?: number) => {
        if (key === 'delivery.searchRadiusMeters') return 5000;
        if (key === 'delivery.offerExpirySeconds') return 60;
        return def;
      }),
    } as unknown as jest.Mocked<ConfigService>;

    listener = new DeliveryListener(
      deliveryService,
      repository,
      gateway,
      restaurantsService,
      ordersService,
      configService,
    );
  });

  it('does nothing when there are no online drivers', async () => {
    deliveryService.listOnlineDriverIds.mockResolvedValue([]);

    await listener.handleReadyForPickup({
      orderId: 'order-1',
      restaurantId: 'restaurant-1',
    });

    expect(restaurantsService.getById).not.toHaveBeenCalled();
    expect(gateway.emitNewOffer).not.toHaveBeenCalled();
  });

  it('skips a driver with no known location', async () => {
    deliveryService.listOnlineDriverIds.mockResolvedValue(['driver-1']);
    restaurantsService.getById.mockResolvedValue(RESTAURANT);
    ordersService.getOrderUnchecked.mockResolvedValue(ORDER);
    repository.findLatestByDriverId.mockResolvedValue(null);

    await listener.handleReadyForPickup({
      orderId: 'order-1',
      restaurantId: 'restaurant-1',
    });

    expect(gateway.emitNewOffer).not.toHaveBeenCalled();
  });

  it('skips a driver outside the search radius', async () => {
    deliveryService.listOnlineDriverIds.mockResolvedValue(['driver-far']);
    restaurantsService.getById.mockResolvedValue(RESTAURANT);
    ordersService.getOrderUnchecked.mockResolvedValue(ORDER);
    repository.findLatestByDriverId.mockResolvedValue(
      makeLocation({ lat: 0, lng: 0 }),
    );

    await listener.handleReadyForPickup({
      orderId: 'order-1',
      restaurantId: 'restaurant-1',
    });

    expect(gateway.emitNewOffer).not.toHaveBeenCalled();
  });

  it('emits driver:new_offer to each online driver within radius', async () => {
    deliveryService.listOnlineDriverIds.mockResolvedValue(['driver-1']);
    restaurantsService.getById.mockResolvedValue(RESTAURANT);
    ordersService.getOrderUnchecked.mockResolvedValue(ORDER);
    repository.findLatestByDriverId.mockResolvedValue(makeLocation());

    await listener.handleReadyForPickup({
      orderId: 'order-1',
      restaurantId: 'restaurant-1',
    });

    expect(gateway.emitNewOffer).toHaveBeenCalledWith(
      'driver-1',
      expect.objectContaining({
        orderId: 'order-1',
        estimatedEarning: '18000.00',
      }),
    );
  });
});
