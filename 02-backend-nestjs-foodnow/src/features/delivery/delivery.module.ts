import { Module } from '@nestjs/common';
import { DeliveryController } from './delivery.controller';
import { DeliveryService } from './delivery.service';
import { DeliveryRepository } from './delivery.repository';
import { DeliveryGateway } from './delivery.gateway';
import { DeliveryListener } from './delivery.listener';

@Module({
  controllers: [DeliveryController],
  providers: [
    DeliveryService,
    DeliveryRepository,
    DeliveryGateway,
    DeliveryListener,
  ],
  exports: [DeliveryService],
})
export class DeliveryModule {}
