import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';

@Injectable()
export class DeliveryListener {
  @OnEvent('order.confirmed')
  handleOrderConfirmed(): void {}
}
