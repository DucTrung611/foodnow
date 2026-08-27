import { ConfigService } from '@nestjs/config';
import { haversineDistanceMeters } from '../../../shared/utils/geo.util';
import { OrdersService } from '../../orders/orders.service';
import { UsersService } from '../../users/users.service';
import { DeliveryRepository } from '../delivery.repository';

/**
 * Shared by both entry points into a location push (`drivers.controller.ts`'s
 * REST route and `delivery.gateway.ts`'s `driver:location_update` handler) —
 * kept as plain functions, not `DeliveryService` methods, specifically so the
 * gateway can call them without depending on `DeliveryService` (which itself
 * depends on `DeliveryGateway` to emit `delivery:assigned`/`driver:new_offer`
 * — injecting `DeliveryService` into the gateway too would be a circular DI).
 */

/**
 * `driver_locations.order_id` is a misnomer — it's actually a FK to
 * `deliveries.id` (see delivery.repository.ts). The public API's `orderId`
 * is resolved to that delivery id here before persisting.
 */
export async function persistDriverLocation(
  repository: DeliveryRepository,
  driverId: string,
  point: { lat: number; lng: number; orderId?: string },
): Promise<void> {
  let deliveryId: string | undefined;
  if (point.orderId) {
    const delivery = await repository.findByOrderId(point.orderId);
    deliveryId = delivery?.id;
  }
  await repository.createLocation(driverId, {
    lat: point.lat,
    lng: point.lng,
    deliveryId,
  });
}

export type LocationBroadcast = {
  orderId: string;
  lat: number;
  lng: number;
  recordedAt: string;
  etaMinutes: number;
};

export async function computeLocationBroadcast(
  ordersService: OrdersService,
  usersService: UsersService,
  configService: ConfigService,
  orderId: string,
  lat: number,
  lng: number,
): Promise<LocationBroadcast> {
  const order = await ordersService.getOrderUnchecked(orderId);
  const address = await usersService.getAddressById(
    order.customerId,
    order.deliveryAddressId,
  );
  const distanceMeters = haversineDistanceMeters(
    lat,
    lng,
    address.lat,
    address.lng,
  );
  const averageSpeedKmh = configService.get<number>(
    'delivery.averageSpeedKmh',
    30,
  );

  return {
    orderId,
    lat,
    lng,
    recordedAt: new Date().toISOString(),
    etaMinutes: Math.round((distanceMeters / 1000 / averageSpeedKmh) * 60),
  };
}
