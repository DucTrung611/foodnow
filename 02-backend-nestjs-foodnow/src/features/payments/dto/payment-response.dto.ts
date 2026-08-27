import { PaymentMethod, PaymentStatus } from '../../../generated/prisma/enums';

export class PaymentResponseDto {
  id: string;
  orderId: string;
  amount: string;
  method: PaymentMethod;
  status: PaymentStatus;
  createdAt: Date;
  updatedAt: Date;
}
