import { Module } from '@nestjs/common';
import { ConfigModule as NestConfigModule } from '@nestjs/config';
import { envValidationSchema } from './env.validation';
import appConfig from './app.config';
import databaseConfig from './database.config';
import redisConfig from './redis.config';
import jwtConfig from './jwt.config';
import restaurantConfig from './restaurant.config';
import orderConfig from './order.config';
import deliveryConfig from './delivery.config';

@Module({
  imports: [
    NestConfigModule.forRoot({
      isGlobal: true,
      validationSchema: envValidationSchema,
      load: [
        appConfig,
        databaseConfig,
        redisConfig,
        jwtConfig,
        restaurantConfig,
        orderConfig,
        deliveryConfig,
      ],
    }),
  ],
})
export class ConfigModule {}
