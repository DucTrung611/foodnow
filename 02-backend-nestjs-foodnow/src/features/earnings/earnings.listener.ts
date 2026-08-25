import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';

@Injectable()
export class EarningsListener {
  @OnEvent('delivery.completed')
  handleDeliveryCompleted(): void {}
}
