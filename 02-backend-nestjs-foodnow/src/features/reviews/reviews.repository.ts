import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../core/database/prisma.service';
import { Review } from '../../generated/prisma/client';

@Injectable()
export class ReviewsRepository {
  constructor(private readonly prisma: PrismaService) {}

  findByOrderId(orderId: string): Promise<Review | null> {
    return this.prisma.review.findUnique({ where: { orderId } });
  }

  createReview(data: {
    orderId: string;
    customerId: string;
    restaurantId: string | null;
    driverId: string | null;
    rating: number;
    comment?: string;
  }): Promise<Review> {
    return this.prisma.review.create({ data });
  }

  async findByRestaurant(
    restaurantId: string,
    skip: number,
    take: number,
  ): Promise<{ rows: Review[]; total: number }> {
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.review.findMany({
        where: { restaurantId },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      this.prisma.review.count({ where: { restaurantId } }),
    ]);
    return { rows, total };
  }

  async avgRatingForRestaurant(restaurantId: string): Promise<number> {
    const result = await this.prisma.review.aggregate({
      where: { restaurantId },
      _avg: { rating: true },
    });
    return result._avg.rating ?? 0;
  }
}
