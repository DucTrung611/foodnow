import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../core/database/prisma.service';
import { Delivery, Prisma } from '../../generated/prisma/client';
import { DeliveryStatus } from '../../generated/prisma/enums';

export type DriverLocationRow = {
  id: string;
  driver_id: string;
  order_id: string | null;
  recorded_at: Date;
  lat: number;
  lng: number;
};

const DRIVER_LOCATION_COLUMNS = Prisma.sql`
  id, driver_id, order_id, recorded_at,
  ST_Y(location::geometry) AS lat, ST_X(location::geometry) AS lng
`;

@Injectable()
export class DeliveryRepository {
  constructor(private readonly prisma: PrismaService) {}

  // ─── Deliveries (no geography column — plain Prisma) ───────────────────

  createDelivery(data: {
    orderId: string;
    driverId: string;
    estimatedDistanceKm: number;
  }): Promise<Delivery> {
    return this.prisma.delivery.create({
      data: {
        orderId: data.orderId,
        driverId: data.driverId,
        estimatedDistanceKm: data.estimatedDistanceKm,
        status: DeliveryStatus.ASSIGNED,
      },
    });
  }

  findByOrderId(orderId: string): Promise<Delivery | null> {
    return this.prisma.delivery.findUnique({ where: { orderId } });
  }

  async findAssignedOrderIds(orderIds: string[]): Promise<Set<string>> {
    if (orderIds.length === 0) return new Set();
    const rows = await this.prisma.delivery.findMany({
      where: { orderId: { in: orderIds } },
      select: { orderId: true },
    });
    return new Set(rows.map((row) => row.orderId));
  }

  updateToPickedUp(deliveryId: string, pickupTime: Date): Promise<Delivery> {
    return this.prisma.delivery.update({
      where: { id: deliveryId },
      data: { status: DeliveryStatus.PICKED_UP, pickupTime },
    });
  }

  updateToDelivered(deliveryId: string, deliveryTime: Date): Promise<Delivery> {
    return this.prisma.delivery.update({
      where: { id: deliveryId },
      data: { status: DeliveryStatus.DELIVERED, deliveryTime },
    });
  }

  // ─── Driver locations ────────────────────────────────────────────────
  // `location` is Unsupported("geography(Point,4326)") — raw SQL only, same
  // pattern as `restaurants`/`addresses`. NOTE: the `order_id` column here
  // is a misnomer — it's actually a FK to `deliveries.id` (confirmed in the
  // migration), not `orders.id`. Callers must resolve an order id to its
  // delivery id first (see delivery.service.ts's `pushLocation`).

  async createLocation(
    driverId: string,
    point: { lat: number; lng: number; deliveryId?: string },
  ): Promise<void> {
    await this.prisma.$executeRaw`
      INSERT INTO driver_locations (id, driver_id, order_id, location, recorded_at)
      VALUES (
        gen_random_uuid(), ${driverId}, ${point.deliveryId ?? null},
        ST_SetSRID(ST_MakePoint(${point.lng}, ${point.lat}), 4326)::geography,
        now()
      )
    `;
  }

  async findLatestByDriverId(
    driverId: string,
  ): Promise<DriverLocationRow | null> {
    const rows = await this.prisma.$queryRaw<DriverLocationRow[]>`
      SELECT ${DRIVER_LOCATION_COLUMNS}
      FROM driver_locations
      WHERE driver_id = ${driverId}
      ORDER BY recorded_at DESC
      LIMIT 1
    `;
    return rows[0] ?? null;
  }

  async findLatestByDeliveryId(
    deliveryId: string,
  ): Promise<DriverLocationRow | null> {
    const rows = await this.prisma.$queryRaw<DriverLocationRow[]>`
      SELECT ${DRIVER_LOCATION_COLUMNS}
      FROM driver_locations
      WHERE order_id = ${deliveryId}
      ORDER BY recorded_at DESC
      LIMIT 1
    `;
    return rows[0] ?? null;
  }
}
