import {
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { RedisService } from '../../core/cache/redis.service';
import { Delivery } from '../../generated/prisma/client';
import { DeliveryStatus, OrderStatus } from '../../generated/prisma/enums';
import { OrdersService } from '../orders/orders.service';
import { RestaurantsService } from '../restaurants/restaurants.service';
import { UsersService } from '../users/users.service';
import { JwtPayload } from '../../shared/types/jwt-payload.type';
import { Role } from '../../shared/types/role.enum';
import { formatDecimal } from '../../shared/utils/decimal.util';
import { haversineDistanceMeters } from '../../shared/utils/geo.util';
import { AvailableDeliveryResponseDto } from './dto/available-delivery-response.dto';
import { DeliveryResponseDto } from './dto/delivery-response.dto';
import { PushLocationDto } from './dto/push-location.dto';
import { TrackingResponseDto } from './dto/tracking-response.dto';
import { DeliveryGateway } from './delivery.gateway';
import { DeliveryRepository } from './delivery.repository';
import {
  computeLocationBroadcast,
  persistDriverLocation,
} from './utils/location-push.util';

const ONLINE_DRIVERS_KEY = 'drivers:online';

function toDeliveryResponseDto(delivery: Delivery): DeliveryResponseDto {
  return {
    id: delivery.id,
    orderId: delivery.orderId,
    driverId: delivery.driverId,
    pickupTime: delivery.pickupTime,
    deliveryTime: delivery.deliveryTime,
    estimatedDistanceKm: formatDecimal(delivery.estimatedDistanceKm),
    status: delivery.status,
  };
}

@Injectable()
export class DeliveryService {
  private readonly logger = new Logger(DeliveryService.name);

  constructor(
    private readonly deliveryRepository: DeliveryRepository,
    private readonly restaurantsService: RestaurantsService,
    private readonly usersService: UsersService,
    private readonly ordersService: OrdersService,
    private readonly redisService: RedisService,
    private readonly configService: ConfigService,
    private readonly deliveryGateway: DeliveryGateway,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async setAvailability(
    driverId: string,
    isAvailable: boolean,
  ): Promise<{ isAvailable: boolean }> {
    if (isAvailable) await this.redisService.sadd(ONLINE_DRIVERS_KEY, driverId);
    else await this.redisService.srem(ONLINE_DRIVERS_KEY, driverId);
    return { isAvailable };
  }

  listOnlineDriverIds(): Promise<string[]> {
    return this.redisService.smembers(ONLINE_DRIVERS_KEY);
  }

  async listAvailableDeliveries(
    driverId: string,
  ): Promise<AvailableDeliveryResponseDto[]> {
    const lastLocation =
      await this.deliveryRepository.findLatestByDriverId(driverId);
    if (!lastLocation) return [];

    const candidates = await this.ordersService.listByStatus(
      OrderStatus.READY_FOR_PICKUP,
    );
    if (candidates.length === 0) return [];

    const assignedOrderIds = await this.deliveryRepository.findAssignedOrderIds(
      candidates.map((order) => order.id),
    );
    const radius = this.configService.get<number>(
      'delivery.searchRadiusMeters',
      5000,
    );

    const results: AvailableDeliveryResponseDto[] = [];
    for (const order of candidates) {
      if (assignedOrderIds.has(order.id)) continue;

      const restaurant = await this.restaurantsService.getById(
        order.restaurantId,
      );
      const distanceMeters = haversineDistanceMeters(
        lastLocation.lat,
        lastLocation.lng,
        restaurant.lat,
        restaurant.lng,
      );
      if (distanceMeters > radius) continue;

      results.push({
        orderId: order.id,
        restaurantId: order.restaurantId,
        distanceMeters,
        estimatedEarning: order.deliveryFee,
      });
    }

    return results.sort((a, b) => a.distanceMeters - b.distanceMeters);
  }

  async acceptDelivery(
    driverUser: JwtPayload,
    orderId: string,
  ): Promise<DeliveryResponseDto> {
    const order = await this.ordersService.getOrderUnchecked(orderId);
    if (order.status !== OrderStatus.READY_FOR_PICKUP) {
      throw new UnprocessableEntityException('Order is not ready for pickup');
    }
    const existing = await this.deliveryRepository.findByOrderId(orderId);
    if (existing) throw new ConflictException('Delivery already assigned');

    const restaurant = await this.restaurantsService.getById(
      order.restaurantId,
    );
    const address = await this.usersService.getAddressById(
      order.customerId,
      order.deliveryAddressId,
    );
    const estimatedDistanceKm =
      haversineDistanceMeters(
        restaurant.lat,
        restaurant.lng,
        address.lat,
        address.lng,
      ) / 1000;

    const delivery = await this.deliveryRepository.createDelivery({
      orderId,
      driverId: driverUser.sub,
      estimatedDistanceKm,
    });
    await this.ordersService.assignDriver(orderId, driverUser.sub);

    const driverProfile = await this.usersService.getProfile(driverUser.sub);
    this.deliveryGateway.emitDeliveryAssigned(orderId, {
      deliveryId: delivery.id,
      driver: {
        id: driverUser.sub,
        fullName: driverProfile.fullName,
        phone: driverProfile.phone,
      },
    });

    return toDeliveryResponseDto(delivery);
  }

  async confirmPickup(
    driverUser: JwtPayload,
    orderId: string,
  ): Promise<DeliveryResponseDto> {
    const delivery = await this.findDeliveryOrThrow(orderId);
    this.assertOwnDelivery(delivery, driverUser.sub);
    if (delivery.status !== DeliveryStatus.ASSIGNED) {
      throw new UnprocessableEntityException(
        'Delivery is not in a pickupable state',
      );
    }

    const order = await this.ordersService.getOrderUnchecked(orderId);
    await this.ordersService.updateStatus(driverUser, orderId, {
      status: OrderStatus.ON_THE_WAY,
      version: order.version,
    });

    const updated = await this.deliveryRepository.updateToPickedUp(
      delivery.id,
      new Date(),
    );
    return toDeliveryResponseDto(updated);
  }

  async confirmComplete(
    driverUser: JwtPayload,
    orderId: string,
  ): Promise<DeliveryResponseDto> {
    const delivery = await this.findDeliveryOrThrow(orderId);
    this.assertOwnDelivery(delivery, driverUser.sub);
    if (delivery.status !== DeliveryStatus.PICKED_UP) {
      throw new UnprocessableEntityException(
        'Delivery is not in a completable state',
      );
    }

    const order = await this.ordersService.getOrderUnchecked(orderId);
    await this.ordersService.updateStatus(driverUser, orderId, {
      status: OrderStatus.DELIVERED,
      version: order.version,
    });

    const updated = await this.deliveryRepository.updateToDelivered(
      delivery.id,
      new Date(),
    );
    this.eventEmitter.emit('delivery.completed', {
      deliveryId: updated.id,
      driverId: updated.driverId,
      orderId: updated.orderId,
    });

    return toDeliveryResponseDto(updated);
  }

  async pushLocation(driverId: string, dto: PushLocationDto): Promise<void> {
    await persistDriverLocation(this.deliveryRepository, driverId, dto);
    if (!dto.orderId) return;

    try {
      const broadcast = await computeLocationBroadcast(
        this.ordersService,
        this.usersService,
        this.configService,
        dto.orderId,
        dto.lat,
        dto.lng,
      );
      this.deliveryGateway.emitLocation(broadcast.orderId, broadcast);
    } catch (error) {
      this.logger.warn(
        `Failed to broadcast location for order ${dto.orderId}: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  async getTracking(
    user: JwtPayload,
    orderId: string,
  ): Promise<TrackingResponseDto> {
    const order = await this.ordersService.getOrderUnchecked(orderId);
    if (user.role !== Role.ADMIN && order.customerId !== user.sub) {
      throw new ForbiddenException({
        code: 'AUTH_1003',
        message: 'Insufficient role permission',
      });
    }

    const delivery = await this.deliveryRepository.findByOrderId(orderId);
    if (!delivery) throw new NotFoundException('No tracking data yet');
    const location = await this.deliveryRepository.findLatestByDeliveryId(
      delivery.id,
    );
    if (!location) throw new NotFoundException('No tracking data yet');

    const address = await this.usersService.getAddressById(
      order.customerId,
      order.deliveryAddressId,
    );
    const distanceMeters = haversineDistanceMeters(
      location.lat,
      location.lng,
      address.lat,
      address.lng,
    );
    const averageSpeedKmh = this.configService.get<number>(
      'delivery.averageSpeedKmh',
      30,
    );

    return {
      lat: location.lat,
      lng: location.lng,
      recordedAt: location.recorded_at,
      etaMinutes: Math.round((distanceMeters / 1000 / averageSpeedKmh) * 60),
    };
  }

  private async findDeliveryOrThrow(orderId: string): Promise<Delivery> {
    const delivery = await this.deliveryRepository.findByOrderId(orderId);
    if (!delivery) throw new NotFoundException('Delivery not found');
    return delivery;
  }

  private assertOwnDelivery(delivery: Delivery, driverId: string): void {
    if (delivery.driverId !== driverId) {
      throw new ForbiddenException({
        code: 'AUTH_1003',
        message: 'Insufficient role permission',
      });
    }
  }
}
