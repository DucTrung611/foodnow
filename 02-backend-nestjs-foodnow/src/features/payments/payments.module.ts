import { Module } from '@nestjs/common';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { PaymentsRepository } from './payments.repository';
import { PaymentsGateway } from './payments.gateway';

@Module({
  controllers: [PaymentsController],
  providers: [PaymentsService, PaymentsRepository, PaymentsGateway],
  exports: [PaymentsService],
})
export class PaymentsModule {}
