import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../core/database/prisma.service';

@Injectable()
export class RestaurantsRepository {
  constructor(private readonly prisma: PrismaService) {}
}
