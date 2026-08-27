import {
  Body,
  Controller,
  Headers,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../../shared/decorators/current-user.decorator';
import { Roles } from '../../shared/decorators/roles.decorator';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { RolesGuard } from '../../shared/guards/roles.guard';
import type { JwtPayload } from '../../shared/types/jwt-payload.type';
import { Role } from '../../shared/types/role.enum';
import { PayOrderDto } from './dto/pay-order.dto';
import { PaymentsService } from './payments.service';

/**
 * Lives in `payments` despite the `/orders` URL prefix — paying an order
 * writes payments-owned data (`payments`, `payment_transactions`), not
 * anything `orders` owns. Same pattern as delivery's OrderTrackingController.
 */
@Controller('orders')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.CUSTOMER)
export class OrderPaymentController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post(':id/pay')
  payOrder(
    @CurrentUser() user: JwtPayload,
    @Param('id') orderId: string,
    @Headers('idempotency-key') idempotencyKey: string | undefined,
    @Body() dto: PayOrderDto,
  ) {
    return this.paymentsService.payOrder(user, orderId, idempotencyKey, dto);
  }
}
