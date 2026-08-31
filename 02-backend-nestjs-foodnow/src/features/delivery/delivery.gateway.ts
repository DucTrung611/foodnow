import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import {
  REALTIME_CORS,
  REALTIME_NAMESPACE,
} from '../../shared/constants/websocket.constant';
import { JwtPayload } from '../../shared/types/jwt-payload.type';
import { OrdersService } from '../orders/orders.service';
import { UsersService } from '../users/users.service';
import { DeliveryRepository } from './delivery.repository';
import {
  computeLocationBroadcast,
  persistDriverLocation,
} from './utils/location-push.util';

/** Same pitfall/fix as orders.gateway.ts's AuthenticatedSocket — Omit first, or `data` stays `any`. */
type AuthenticatedSocket = Omit<Socket, 'data'> & {
  data: { user?: JwtPayload };
};

/**
 * `delivery:assigned`/`delivery:location` target the same `order:<id>` rooms
 * `OrdersGateway` manages — that's a Socket.IO room primitive, not a NestJS
 * DI concept, so this gateway can join/emit to them directly without
 * importing anything from `orders`. Own JWT handshake auth (duplicated from
 * OrdersGateway on purpose — no cross-feature gateway imports).
 *
 * Deliberately injects `DeliveryRepository`/`OrdersService`/`UsersService`
 * directly rather than `DeliveryService` — `DeliveryService` depends on
 * *this* gateway (to emit `delivery:assigned`/`driver:new_offer`), so
 * depending on it back here would be a circular DI. `driver:location_update`
 * reuses the same plain helpers `DeliveryService.pushLocation` uses (see
 * `utils/location-push.util.ts`) instead.
 */
@WebSocketGateway({ namespace: REALTIME_NAMESPACE, cors: REALTIME_CORS })
export class DeliveryGateway implements OnGatewayConnection {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(DeliveryGateway.name);

  constructor(
    private readonly deliveryRepository: DeliveryRepository,
    private readonly ordersService: OrdersService,
    private readonly usersService: UsersService,
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
  ) {}

  async handleConnection(client: AuthenticatedSocket): Promise<void> {
    const token = client.handshake.auth?.token as string | undefined;
    if (!token) {
      this.logger.warn(`Rejected socket ${client.id}: no token in handshake`);
      client.disconnect(true);
      return;
    }

    try {
      client.data.user = await this.jwtService.verifyAsync<JwtPayload>(token, {
        secret: this.configService.get<string>('jwt.accessSecret'),
      });
    } catch {
      this.logger.warn(`Rejected socket ${client.id}: invalid token`);
      client.disconnect(true);
    }
  }

  @SubscribeMessage('driver:location_update')
  async handleLocationUpdate(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() body: { lat?: number; lng?: number; orderId?: string },
  ): Promise<void> {
    const user = client.data.user;
    if (!user || body.lat === undefined || body.lng === undefined) return;

    await persistDriverLocation(this.deliveryRepository, user.sub, {
      lat: body.lat,
      lng: body.lng,
      orderId: body.orderId,
    });
    if (!body.orderId) return;

    try {
      const broadcast = await computeLocationBroadcast(
        this.ordersService,
        this.usersService,
        this.configService,
        body.orderId,
        body.lat,
        body.lng,
      );
      this.emitLocation(broadcast.orderId, broadcast);
    } catch (error) {
      this.logger.warn(
        `Failed to broadcast location for order ${body.orderId}: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  emitDeliveryAssigned(
    orderId: string,
    payload: {
      deliveryId: string;
      driver: { id: string; fullName: string; phone: string };
    },
  ): void {
    this.server.to(`order:${orderId}`).emit('delivery:assigned', payload);
  }

  emitLocation(
    orderId: string,
    payload: {
      lat: number;
      lng: number;
      recordedAt: string;
      etaMinutes: number;
    },
  ): void {
    this.server.to(`order:${orderId}`).emit('delivery:location', payload);
  }

  emitNewOffer(
    driverId: string,
    payload: {
      orderId: string;
      distanceMeters: number;
      estimatedEarning: string;
      expiresAt: string;
    },
  ): void {
    this.server.to(`driver:${driverId}`).emit('driver:new_offer', payload);
  }
}
