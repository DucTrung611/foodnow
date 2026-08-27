import { Module } from '@nestjs/common';
import { OrdersModule } from '../orders/orders.module';
import { OrderPaymentController } from './order-payment.controller';
import { PaymentsController } from './payments.controller';
import { PaymentsGateway } from './payments.gateway';
import { PaymentsRepository } from './payments.repository';
import { PaymentsService } from './payments.service';

@Module({
  imports: [OrdersModule],
  controllers: [PaymentsController, OrderPaymentController],
  providers: [PaymentsService, PaymentsRepository, PaymentsGateway],
  exports: [PaymentsService],
})
export class PaymentsModule {}
