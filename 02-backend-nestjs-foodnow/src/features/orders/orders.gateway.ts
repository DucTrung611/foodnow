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
import { JwtPayload } from '../../shared/types/jwt-payload.type';
import { OrderResponseDto } from './dto/order-response.dto';
import { OrdersRepository } from './orders.repository';
import { hasOrderAccess } from './utils/order-access.util';

/**
 * `Socket['data']` is typed `any` by default (its `SocketData` generic), so a
 * plain `Socket & { data: {...} }` intersection still collapses to `any` —
 * `Omit` drops the `any`-typed field first so the replacement actually sticks.
 */
type AuthenticatedSocket = Omit<Socket, 'data'> & {
  data: { user?: JwtPayload };
};

/**
 * Realtime delivery mechanism only — every event here mirrors a REST
 * response DTO and has a REST equivalent for reconnect/replay (API_SPEC.md
 * Socket.IO Rules). Emits are always called from OrdersService *after* its
 * write transaction commits, never from inside one.
 */
@WebSocketGateway({ namespace: 'realtime' })
export class OrdersGateway implements OnGatewayConnection {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(OrdersGateway.name);

  constructor(
    private readonly ordersRepository: OrdersRepository,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
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

  @SubscribeMessage('order:subscribe')
  async handleSubscribe(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() body: { orderId?: string },
  ): Promise<void> {
    const user = client.data.user;
    if (!user || !body?.orderId) return;

    const order = await this.ordersRepository.findOrderById(body.orderId);
    if (!order || !hasOrderAccess(user, order)) return;

    await client.join(`order:${body.orderId}`);
  }

  emitOrderCreated(restaurantId: string, order: OrderResponseDto): void {
    this.server.to(`restaurant:${restaurantId}`).emit('order:created', {
      orderId: order.id,
      orderCode: order.orderCode,
      totalAmount: order.totalAmount,
      itemCount: order.items.length,
    });
  }

  emitStatusChanged(order: OrderResponseDto): void {
    this.server.to(`order:${order.id}`).emit('order:status_changed', {
      orderId: order.id,
      status: order.status,
      version: order.version,
      changedAt: new Date().toISOString(),
    });
  }

  emitCancelled(
    order: OrderResponseDto,
    reason: string,
    cancelledBy: string,
  ): void {
    this.server.to(`order:${order.id}`).emit('order:cancelled', {
      orderId: order.id,
      reason,
      cancelledBy,
    });
  }
}
