import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OnEvent } from '@nestjs/event-emitter';
import { haversineDistanceMeters } from '../../shared/utils/geo.util';
import { OrdersService } from '../orders/orders.service';
import { RestaurantsService } from '../restaurants/restaurants.service';
import { DeliveryGateway } from './delivery.gateway';
import { DeliveryRepository } from './delivery.repository';
import { DeliveryService } from './delivery.service';

type OrderReadyForPickupPayload = { orderId: string; restaurantId: string };

/**
 * `ARCHITECTURE.md`'s flagship cross-feature example: `order.confirmed` (here,
 * `order.ready_for_pickup`) → `delivery` starts driver matching. Fire-and-
 * forget — nothing HTTP-facing is waiting on this, so a zero-match result
 * (the closest analogue to `DELIVERY_4001`) just logs and emits nothing.
 */
@Injectable()
export class DeliveryListener {
  private readonly logger = new Logger(DeliveryListener.name);

  constructor(
    private readonly deliveryService: DeliveryService,
    private readonly deliveryRepository: DeliveryRepository,
    private readonly deliveryGateway: DeliveryGateway,
    private readonly restaurantsService: RestaurantsService,
    private readonly ordersService: OrdersService,
    private readonly configService: ConfigService,
  ) {}

  @OnEvent('order.ready_for_pickup')
  async handleReadyForPickup(
    payload: OrderReadyForPickupPayload,
  ): Promise<void> {
    const onlineDriverIds = await this.deliveryService.listOnlineDriverIds();
    if (onlineDriverIds.length === 0) {
      this.logger.log(`No online drivers to offer order ${payload.orderId} to`);
      return;
    }

    const [restaurant, order] = await Promise.all([
      this.restaurantsService.getById(payload.restaurantId),
      this.ordersService.getOrderUnchecked(payload.orderId),
    ]);
    const radius = this.configService.get<number>(
      'delivery.searchRadiusMeters',
      5000,
    );
    const expirySeconds = this.configService.get<number>(
      'delivery.offerExpirySeconds',
      60,
    );
    const expiresAt = new Date(Date.now() + expirySeconds * 1000).toISOString();

    for (const driverId of onlineDriverIds) {
      const location =
        await this.deliveryRepository.findLatestByDriverId(driverId);
      if (!location) continue;

      const distanceMeters = haversineDistanceMeters(
        location.lat,
        location.lng,
        restaurant.lat,
        restaurant.lng,
      );
      if (distanceMeters > radius) continue;

      this.deliveryGateway.emitNewOffer(driverId, {
        orderId: order.id,
        distanceMeters,
        estimatedEarning: order.deliveryFee,
        expiresAt,
      });
    }
  }
}
