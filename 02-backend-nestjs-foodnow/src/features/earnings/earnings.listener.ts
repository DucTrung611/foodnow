import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { OrdersService } from '../orders/orders.service';
import { EarningsService } from './earnings.service';

type DeliveryCompletedPayload = {
  deliveryId: string;
  driverId: string;
  orderId: string;
};

/**
 * `delivery.completed` → `earnings` records payout (ARCHITECTURE.md §5).
 * Fire-and-forget — nothing HTTP-facing is waiting on this, so a failure
 * just logs rather than surfacing anywhere.
 */
@Injectable()
export class EarningsListener {
  private readonly logger = new Logger(EarningsListener.name);

  constructor(
    private readonly earningsService: EarningsService,
    private readonly ordersService: OrdersService,
  ) {}

  @OnEvent('delivery.completed')
  async handleDeliveryCompleted(
    payload: DeliveryCompletedPayload,
  ): Promise<void> {
    try {
      const order = await this.ordersService.getOrderUnchecked(payload.orderId);
      await this.earningsService.recordEarning(
        payload.driverId,
        payload.deliveryId,
        Number(order.deliveryFee),
      );
    } catch (error) {
      this.logger.warn(
        `Failed to record earning for delivery ${payload.deliveryId}: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }
}
