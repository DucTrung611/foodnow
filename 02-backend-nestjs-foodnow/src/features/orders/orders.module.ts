import { Module } from '@nestjs/common';
import { PromotionsModule } from '../promotions/promotions.module';
import { RestaurantsModule } from '../restaurants/restaurants.module';
import { UsersModule } from '../users/users.module';
import { CartController } from './cart.controller';
import { OrdersController } from './orders.controller';
import { OrdersGateway } from './orders.gateway';
import { OrdersRepository } from './orders.repository';
import { OrdersService } from './orders.service';

@Module({
  imports: [RestaurantsModule, UsersModule, PromotionsModule],
  controllers: [CartController, OrdersController],
  providers: [OrdersService, OrdersRepository, OrdersGateway],
  exports: [OrdersService],
})
export class OrdersModule {}
