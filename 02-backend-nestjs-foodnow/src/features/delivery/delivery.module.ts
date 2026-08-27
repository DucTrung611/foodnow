import { Module } from '@nestjs/common';
import { OrdersModule } from '../orders/orders.module';
import { RestaurantsModule } from '../restaurants/restaurants.module';
import { UsersModule } from '../users/users.module';
import { DeliveriesController } from './deliveries.controller';
import { DeliveryGateway } from './delivery.gateway';
import { DeliveryListener } from './delivery.listener';
import { DeliveryRepository } from './delivery.repository';
import { DeliveryService } from './delivery.service';
import { DriversController } from './drivers.controller';
import { OrderTrackingController } from './order-tracking.controller';

@Module({
  imports: [RestaurantsModule, UsersModule, OrdersModule],
  controllers: [
    DriversController,
    DeliveriesController,
    OrderTrackingController,
  ],
  providers: [
    DeliveryService,
    DeliveryRepository,
    DeliveryGateway,
    DeliveryListener,
  ],
  exports: [DeliveryService],
})
export class DeliveryModule {}
