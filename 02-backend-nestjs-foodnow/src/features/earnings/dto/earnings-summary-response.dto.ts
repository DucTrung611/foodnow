import { DriverEarningStatus } from '../../../generated/prisma/enums';

export class EarningResponseDto {
  id: string;
  deliveryId: string;
  amount: string;
  status: DriverEarningStatus;
  paidAt: Date | null;
  createdAt: Date;
}

export class EarningsSummaryResponseDto {
  totalPendingAmount: string;
  totalPaidAmount: string;
  earnings: EarningResponseDto[];
}
