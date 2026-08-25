import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../core/database/prisma.service';

@Injectable()
export class DeliveryRepository {
  constructor(private readonly prisma: PrismaService) {}
}
