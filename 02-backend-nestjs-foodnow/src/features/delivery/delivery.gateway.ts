import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server } from 'socket.io';

@WebSocketGateway({ namespace: 'realtime' })
export class DeliveryGateway {
  @WebSocketServer()
  server: Server;
}
