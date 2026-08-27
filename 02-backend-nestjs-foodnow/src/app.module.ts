import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from './config/config.module';
import { PrismaModule } from './core/database/prisma.module';
import { QueueModule } from './core/cache/queue.module';
import { EventBusModule } from './core/events/event-bus.module';
import { GlobalJwtModule } from './core/auth/jwt.module';
import { RequestIdMiddleware } from './shared/middlewares/request-id.middleware';
import { UsersModule } from './features/users/users.module';
import { RestaurantsModule } from './features/restaurants/restaurants.module';
import { OrdersModule } from './features/orders/orders.module';
import { DeliveryModule } from './features/delivery/delivery.module';
import { PaymentsModule } from './features/payments/payments.module';
import { PromotionsModule } from './features/promotions/promotions.module';
import { ReviewsModule } from './features/reviews/reviews.module';
import { EarningsModule } from './features/earnings/earnings.module';
import { AdminModule } from './features/admin/admin.module';

@Module({
  imports: [
    ConfigModule,
    PrismaModule,
    QueueModule,
    EventBusModule,
    GlobalJwtModule,
    UsersModule,
    RestaurantsModule,
    OrdersModule,
    DeliveryModule,
    PaymentsModule,
    PromotionsModule,
    ReviewsModule,
    EarningsModule,
    AdminModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(RequestIdMiddleware).forRoutes('*path');
  }
}
