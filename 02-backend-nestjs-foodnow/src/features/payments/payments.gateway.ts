import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server } from 'socket.io';
import { PaymentStatus } from '../../generated/prisma/enums';

/**
 * Same shared `realtime` namespace/rooms as OrdersGateway/DeliveryGateway —
 * no client-facing events here, so no own connection auth is needed; room
 * membership is already established via `order:subscribe` on OrdersGateway.
 */
@WebSocketGateway({ namespace: 'realtime' })
export class PaymentsGateway {
  @WebSocketServer()
  server: Server;

  emitPaymentUpdated(orderId: string, paymentStatus: PaymentStatus): void {
    this.server
      .to(`order:${orderId}`)
      .emit('payment:updated', { orderId, paymentStatus });
  }
}
