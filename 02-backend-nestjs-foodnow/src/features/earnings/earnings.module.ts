import { Module } from '@nestjs/common';
import { OrdersModule } from '../orders/orders.module';
import { EarningsController } from './earnings.controller';
import { EarningsService } from './earnings.service';
import { EarningsRepository } from './earnings.repository';
import { EarningsListener } from './earnings.listener';

@Module({
  imports: [OrdersModule],
  controllers: [EarningsController],
  providers: [EarningsService, EarningsRepository, EarningsListener],
  exports: [EarningsService],
})
export class EarningsModule {}
