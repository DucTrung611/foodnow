import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server } from 'socket.io';

@WebSocketGateway({ namespace: 'realtime' })
export class OrdersGateway {
  @WebSocketServer()
  server: Server;
}
