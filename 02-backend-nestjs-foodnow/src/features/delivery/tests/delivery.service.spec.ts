/* eslint-disable @typescript-eslint/unbound-method -- jest mock assertions (expect(mock.method).toHaveBeenCalledWith) are always false positives for this rule */
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { RedisService } from '../../../core/cache/redis.service';
import { DeliveryStatus, OrderStatus } from '../../../generated/prisma/enums';
import { Role } from '../../../shared/types/role.enum';
import { AddressResponseDto } from '../../users/dto/address-response.dto';
import { UserResponseDto } from '../../users/dto/user-response.dto';
import { UsersService } from '../../users/users.service';
import { OrderResponseDto } from '../../orders/dto/order-response.dto';
import { OrdersService } from '../../orders/orders.service';
import { RestaurantResponseDto } from '../../restaurants/dto/restaurant-response.dto';
import { RestaurantsService } from '../../restaurants/restaurants.service';
import { DeliveryGateway } from '../delivery.gateway';
import { DeliveryRepository, DriverLocationRow } from '../delivery.repository';
import { DeliveryService } from '../delivery.service';

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

const ADDRESS: AddressResponseDto = {
  id: 'address-1',
  label: 'Home',
  streetAddress: '123 Main St',
  lat: 21.03,
  lng: 105.85,
  isDefault: true,
  createdAt: new Date('2026-01-01'),
};

const DRIVER_PROFILE: UserResponseDto = {
  id: 'driver-1',
  email: 'driver@test.com',
  phone: '0900000000',
  fullName: 'Driver One',
  avatarUrl: null,
  role: Role.DRIVER,
  status: 'ACTIVE',
  createdAt: new Date('2026-01-01'),
};

function makeOrder(
  overrides: Partial<OrderResponseDto> = {},
): OrderResponseDto {
  return {
    id: 'order-1',
    orderCode: 'FN-260824-0001',
    customerId: 'customer-1',
    restaurantId: 'restaurant-1',
    driverId: null,
    deliveryAddressId: 'address-1',
    status: OrderStatus.READY_FOR_PICKUP,
    subtotal: '55000.00',
    deliveryFee: '18000.00',
    discountAmount: '0.00',
    totalAmount: '73000.00',
    version: 0,
    placedAt: new Date('2026-08-24T10:30:00.000Z'),
    items: [],
    ...overrides,
  };
}

function makeDelivery(
  overrides: Partial<ReturnType<typeof baseDelivery>> = {},
) {
  return { ...baseDelivery(), ...overrides };
}
function baseDelivery() {
  return {
    id: 'delivery-1',
    orderId: 'order-1',
    driverId: 'driver-1',
    pickupTime: null as Date | null,
    deliveryTime: null as Date | null,
    estimatedDistanceKm: '3.20' as never,
    status: DeliveryStatus.ASSIGNED,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
  };
}

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

describe('DeliveryService', () => {
  let service: DeliveryService;
  let repository: jest.Mocked<DeliveryRepository>;
  let restaurantsService: jest.Mocked<RestaurantsService>;
  let usersService: jest.Mocked<UsersService>;
  let ordersService: jest.Mocked<OrdersService>;
  let redisService: jest.Mocked<RedisService>;
  let configService: jest.Mocked<ConfigService>;
  let gateway: jest.Mocked<DeliveryGateway>;
  let eventEmitter: jest.Mocked<EventEmitter2>;

  beforeEach(() => {
    repository = {
      createDelivery: jest.fn(),
      findByOrderId: jest.fn(),
      findAssignedOrderIds: jest.fn(),
      updateToPickedUp: jest.fn(),
      updateToDelivered: jest.fn(),
      createLocation: jest.fn(),
      findLatestByDriverId: jest.fn(),
      findLatestByDeliveryId: jest.fn(),
    } as unknown as jest.Mocked<DeliveryRepository>;

    restaurantsService = {
      getById: jest.fn(),
    } as unknown as jest.Mocked<RestaurantsService>;

    usersService = {
      getAddressById: jest.fn(),
      getProfile: jest.fn(),
    } as unknown as jest.Mocked<UsersService>;

    ordersService = {
      listByStatus: jest.fn(),
      getOrderUnchecked: jest.fn(),
      assignDriver: jest.fn(),
      updateStatus: jest.fn(),
    } as unknown as jest.Mocked<OrdersService>;

    redisService = {
      sadd: jest.fn(),
      srem: jest.fn(),
      smembers: jest.fn(),
    } as unknown as jest.Mocked<RedisService>;

    configService = {
      get: jest.fn((key: string, def?: number) => {
        if (key === 'delivery.searchRadiusMeters') return 5000;
        if (key === 'delivery.averageSpeedKmh') return 30;
        if (key === 'delivery.offerExpirySeconds') return 60;
        return def;
      }),
    } as unknown as jest.Mocked<ConfigService>;

    gateway = {
      emitDeliveryAssigned: jest.fn(),
      emitLocation: jest.fn(),
      emitNewOffer: jest.fn(),
    } as unknown as jest.Mocked<DeliveryGateway>;

    eventEmitter = { emit: jest.fn() } as unknown as jest.Mocked<EventEmitter2>;

    service = new DeliveryService(
      repository,
      restaurantsService,
      usersService,
      ordersService,
      redisService,
      configService,
      gateway,
      eventEmitter,
    );
  });

  describe('setAvailability', () => {
    it('adds the driver to the online set when going online', async () => {
      const result = await service.setAvailability('driver-1', true);
      expect(redisService.sadd).toHaveBeenCalledWith(
        'drivers:online',
        'driver-1',
      );
      expect(redisService.srem).not.toHaveBeenCalled();
      expect(result).toEqual({ isAvailable: true });
    });

    it('removes the driver from the online set when going offline', async () => {
      const result = await service.setAvailability('driver-1', false);
      expect(redisService.srem).toHaveBeenCalledWith(
        'drivers:online',
        'driver-1',
      );
      expect(redisService.sadd).not.toHaveBeenCalled();
      expect(result).toEqual({ isAvailable: false });
    });
  });

  describe('listAvailableDeliveries', () => {
    it('returns an empty list when the driver has no known location', async () => {
      repository.findLatestByDriverId.mockResolvedValue(null);

      const result = await service.listAvailableDeliveries('driver-1');

      expect(result).toEqual([]);
      expect(ordersService.listByStatus).not.toHaveBeenCalled();
    });

    it('excludes orders that already have a delivery assigned', async () => {
      repository.findLatestByDriverId.mockResolvedValue(makeLocation());
      ordersService.listByStatus.mockResolvedValue([
        makeOrder({ id: 'order-1' }),
        makeOrder({ id: 'order-2' }),
      ]);
      repository.findAssignedOrderIds.mockResolvedValue(new Set(['order-1']));
      restaurantsService.getById.mockResolvedValue(RESTAURANT);

      const result = await service.listAvailableDeliveries('driver-1');

      expect(result).toHaveLength(1);
      expect(result[0].orderId).toBe('order-2');
    });

    it('excludes restaurants outside the search radius', async () => {
      repository.findLatestByDriverId.mockResolvedValue(
        makeLocation({ lat: 0, lng: 0 }),
      );
      ordersService.listByStatus.mockResolvedValue([makeOrder()]);
      repository.findAssignedOrderIds.mockResolvedValue(new Set());
      restaurantsService.getById.mockResolvedValue(RESTAURANT); // far from (0,0)

      const result = await service.listAvailableDeliveries('driver-1');

      expect(result).toEqual([]);
    });

    it('reuses the order deliveryFee as estimatedEarning and sorts by distance', async () => {
      repository.findLatestByDriverId.mockResolvedValue(makeLocation());
      ordersService.listByStatus.mockResolvedValue([
        makeOrder({
          id: 'order-near',
          restaurantId: 'restaurant-1',
          deliveryFee: '15000.00',
        }),
        makeOrder({
          id: 'order-far',
          restaurantId: 'restaurant-2',
          deliveryFee: '20000.00',
        }),
      ]);
      repository.findAssignedOrderIds.mockResolvedValue(new Set());
      restaurantsService.getById.mockImplementation((id: string) =>
        Promise.resolve(
          id === 'restaurant-1'
            ? { ...RESTAURANT, lat: 21.02, lng: 105.84 }
            : { ...RESTAURANT, id: 'restaurant-2', lat: 21.03, lng: 105.845 },
        ),
      );

      const result = await service.listAvailableDeliveries('driver-1');

      expect(result.map((r) => r.orderId)).toEqual(['order-near', 'order-far']);
      expect(result[0].estimatedEarning).toBe('15000.00');
    });
  });

  describe('acceptDelivery', () => {
    const driverUser = { sub: 'driver-1', role: Role.DRIVER };

    it('throws when the order is not ready for pickup', async () => {
      ordersService.getOrderUnchecked.mockResolvedValue(
        makeOrder({ status: OrderStatus.PREPARING }),
      );

      await expect(
        service.acceptDelivery(driverUser, 'order-1'),
      ).rejects.toThrow('Order is not ready for pickup');
    });

    it('throws when the order already has a delivery assigned', async () => {
      ordersService.getOrderUnchecked.mockResolvedValue(makeOrder());
      repository.findByOrderId.mockResolvedValue(makeDelivery());

      await expect(
        service.acceptDelivery(driverUser, 'order-1'),
      ).rejects.toThrow('Delivery already assigned');
    });

    it('creates the delivery, assigns the driver, and emits delivery:assigned', async () => {
      ordersService.getOrderUnchecked.mockResolvedValue(makeOrder());
      repository.findByOrderId.mockResolvedValue(null);
      restaurantsService.getById.mockResolvedValue(RESTAURANT);
      usersService.getAddressById.mockResolvedValue(ADDRESS);
      repository.createDelivery.mockResolvedValue(makeDelivery());
      usersService.getProfile.mockResolvedValue(DRIVER_PROFILE);

      const result = await service.acceptDelivery(driverUser, 'order-1');

      expect(repository.createDelivery).toHaveBeenCalledWith(
        expect.objectContaining({ orderId: 'order-1', driverId: 'driver-1' }),
      );
      expect(ordersService.assignDriver).toHaveBeenCalledWith(
        'order-1',
        'driver-1',
      );
      expect(gateway.emitDeliveryAssigned).toHaveBeenCalledWith('order-1', {
        deliveryId: 'delivery-1',
        driver: { id: 'driver-1', fullName: 'Driver One', phone: '0900000000' },
      });
      expect(result.id).toBe('delivery-1');
    });
  });

  describe('confirmPickup', () => {
    const driverUser = { sub: 'driver-1', role: Role.DRIVER };

    it('throws 404 when no delivery exists for the order', async () => {
      repository.findByOrderId.mockResolvedValue(null);

      await expect(
        service.confirmPickup(driverUser, 'order-1'),
      ).rejects.toThrow('Delivery not found');
    });

    it('throws Forbidden when the caller is not the assigned driver', async () => {
      repository.findByOrderId.mockResolvedValue(
        makeDelivery({ driverId: 'someone-else' }),
      );

      await expect(
        service.confirmPickup(driverUser, 'order-1'),
      ).rejects.toMatchObject({
        response: { code: 'AUTH_1003' },
      });
    });

    it('throws when the delivery is not in ASSIGNED state', async () => {
      repository.findByOrderId.mockResolvedValue(
        makeDelivery({ status: DeliveryStatus.PICKED_UP }),
      );

      await expect(
        service.confirmPickup(driverUser, 'order-1'),
      ).rejects.toThrow('Delivery is not in a pickupable state');
    });

    it('advances the order to ON_THE_WAY and records pickupTime', async () => {
      repository.findByOrderId.mockResolvedValue(makeDelivery());
      ordersService.getOrderUnchecked.mockResolvedValue(
        makeOrder({ version: 2 }),
      );
      repository.updateToPickedUp.mockResolvedValue(
        makeDelivery({
          status: DeliveryStatus.PICKED_UP,
          pickupTime: new Date(),
        }),
      );

      const result = await service.confirmPickup(driverUser, 'order-1');

      expect(ordersService.updateStatus).toHaveBeenCalledWith(
        driverUser,
        'order-1',
        {
          status: OrderStatus.ON_THE_WAY,
          version: 2,
        },
      );
      expect(repository.updateToPickedUp).toHaveBeenCalledWith(
        'delivery-1',
        expect.any(Date),
      );
      expect(result.status).toBe(DeliveryStatus.PICKED_UP);
    });
  });

  describe('confirmComplete', () => {
    const driverUser = { sub: 'driver-1', role: Role.DRIVER };

    it('throws when the delivery is not in PICKED_UP state', async () => {
      repository.findByOrderId.mockResolvedValue(
        makeDelivery({ status: DeliveryStatus.ASSIGNED }),
      );

      await expect(
        service.confirmComplete(driverUser, 'order-1'),
      ).rejects.toThrow('Delivery is not in a completable state');
    });

    it('advances the order to DELIVERED, records deliveryTime, and emits delivery.completed', async () => {
      repository.findByOrderId.mockResolvedValue(
        makeDelivery({ status: DeliveryStatus.PICKED_UP }),
      );
      ordersService.getOrderUnchecked.mockResolvedValue(
        makeOrder({ version: 3 }),
      );
      repository.updateToDelivered.mockResolvedValue(
        makeDelivery({
          status: DeliveryStatus.DELIVERED,
          deliveryTime: new Date(),
        }),
      );

      const result = await service.confirmComplete(driverUser, 'order-1');

      expect(ordersService.updateStatus).toHaveBeenCalledWith(
        driverUser,
        'order-1',
        {
          status: OrderStatus.DELIVERED,
          version: 3,
        },
      );
      expect(eventEmitter.emit).toHaveBeenCalledWith('delivery.completed', {
        deliveryId: 'delivery-1',
        driverId: 'driver-1',
        orderId: 'order-1',
      });
      expect(result.status).toBe(DeliveryStatus.DELIVERED);
    });
  });

  describe('pushLocation', () => {
    it('always persists the location', async () => {
      await service.pushLocation('driver-1', { lat: 21.02, lng: 105.84 });

      expect(repository.createLocation).toHaveBeenCalledWith('driver-1', {
        lat: 21.02,
        lng: 105.84,
        deliveryId: undefined,
      });
    });

    it('resolves the orderId to a deliveryId before persisting', async () => {
      repository.findByOrderId.mockResolvedValue(makeDelivery());

      await service.pushLocation('driver-1', {
        lat: 21.02,
        lng: 105.84,
        orderId: 'order-1',
      });

      expect(repository.createLocation).toHaveBeenCalledWith('driver-1', {
        lat: 21.02,
        lng: 105.84,
        deliveryId: 'delivery-1',
      });
    });

    it('broadcasts an ETA update when orderId is given', async () => {
      repository.findByOrderId.mockResolvedValue(makeDelivery());
      ordersService.getOrderUnchecked.mockResolvedValue(makeOrder());
      usersService.getAddressById.mockResolvedValue(ADDRESS);

      await service.pushLocation('driver-1', {
        lat: 21.02,
        lng: 105.84,
        orderId: 'order-1',
      });

      expect(gateway.emitLocation).toHaveBeenCalledWith(
        'order-1',
        expect.objectContaining({
          orderId: 'order-1',
          lat: 21.02,
          lng: 105.84,
        }),
      );
    });

    it('swallows a broadcast failure without throwing (append-only ping must not fail)', async () => {
      repository.findByOrderId.mockResolvedValue(makeDelivery());
      ordersService.getOrderUnchecked.mockRejectedValue(
        new Error('order lookup failed'),
      );

      await expect(
        service.pushLocation('driver-1', {
          lat: 21.02,
          lng: 105.84,
          orderId: 'order-1',
        }),
      ).resolves.toBeUndefined();
      expect(gateway.emitLocation).not.toHaveBeenCalled();
    });

    it('does not attempt a broadcast when no orderId is given', async () => {
      await service.pushLocation('driver-1', { lat: 21.02, lng: 105.84 });
      expect(ordersService.getOrderUnchecked).not.toHaveBeenCalled();
      expect(gateway.emitLocation).not.toHaveBeenCalled();
    });
  });

  describe('getTracking', () => {
    it('throws Forbidden for a caller who is neither the owning customer nor ADMIN', async () => {
      ordersService.getOrderUnchecked.mockResolvedValue(makeOrder());

      await expect(
        service.getTracking(
          { sub: 'stranger', role: Role.CUSTOMER },
          'order-1',
        ),
      ).rejects.toMatchObject({ response: { code: 'AUTH_1003' } });
    });

    it('throws 404 when no delivery exists yet for the order', async () => {
      ordersService.getOrderUnchecked.mockResolvedValue(makeOrder());
      repository.findByOrderId.mockResolvedValue(null);

      await expect(
        service.getTracking(
          { sub: 'customer-1', role: Role.CUSTOMER },
          'order-1',
        ),
      ).rejects.toThrow('No tracking data yet');
    });

    it('throws 404 when the delivery has no recorded location yet', async () => {
      ordersService.getOrderUnchecked.mockResolvedValue(makeOrder());
      repository.findByOrderId.mockResolvedValue(makeDelivery());
      repository.findLatestByDeliveryId.mockResolvedValue(null);

      await expect(
        service.getTracking(
          { sub: 'customer-1', role: Role.CUSTOMER },
          'order-1',
        ),
      ).rejects.toThrow('No tracking data yet');
    });

    it('returns lat/lng/recordedAt/etaMinutes for the owning customer', async () => {
      ordersService.getOrderUnchecked.mockResolvedValue(makeOrder());
      repository.findByOrderId.mockResolvedValue(makeDelivery());
      repository.findLatestByDeliveryId.mockResolvedValue(makeLocation());
      usersService.getAddressById.mockResolvedValue(ADDRESS);

      const result = await service.getTracking(
        { sub: 'customer-1', role: Role.CUSTOMER },
        'order-1',
      );

      expect(result.lat).toBe(21.02);
      expect(result.lng).toBe(105.84);
      expect(typeof result.etaMinutes).toBe('number');
    });

    it('allows ADMIN regardless of ownership', async () => {
      ordersService.getOrderUnchecked.mockResolvedValue(makeOrder());
      repository.findByOrderId.mockResolvedValue(makeDelivery());
      repository.findLatestByDeliveryId.mockResolvedValue(makeLocation());
      usersService.getAddressById.mockResolvedValue(ADDRESS);

      await expect(
        service.getTracking({ sub: 'admin-1', role: Role.ADMIN }, 'order-1'),
      ).resolves.toBeDefined();
    });
  });
});
