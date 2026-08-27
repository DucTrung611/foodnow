import { IsEnum, IsOptional, IsString } from 'class-validator';
import { PaymentMethod } from '../../../generated/prisma/enums';

export class PayOrderDto {
  @IsEnum(PaymentMethod)
  method: PaymentMethod;

  /** Required for CARD/WALLET, checked in PaymentsService — not every method needs one. */
  @IsOptional()
  @IsString()
  paymentToken?: string;
}
