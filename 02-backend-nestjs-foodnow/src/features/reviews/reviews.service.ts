import {
  ConflictException,
  ForbiddenException,
  Injectable,
  UnprocessableEntityException,
} from '@nestjs/common';
import { Review } from '../../generated/prisma/client';
import { OrderStatus } from '../../generated/prisma/enums';
import { OrdersService } from '../orders/orders.service';
import { RestaurantsService } from '../restaurants/restaurants.service';
import { JwtPayload } from '../../shared/types/jwt-payload.type';
import { PaginatedResult } from '../../shared/types/paginated-result.type';
import {
  buildPaginatedResult,
  paginate,
} from '../../shared/utils/pagination.util';
import { CreateReviewDto } from './dto/create-review.dto';
import { ReviewListQueryDto } from './dto/review-list-query.dto';
import { ReviewResponseDto } from './dto/review-response.dto';
import { ReviewsRepository } from './reviews.repository';

function toReviewResponseDto(review: Review): ReviewResponseDto {
  return {
    id: review.id,
    orderId: review.orderId,
    customerId: review.customerId,
    restaurantId: review.restaurantId,
    driverId: review.driverId,
    rating: review.rating,
    comment: review.comment,
    createdAt: review.createdAt,
  };
}

@Injectable()
export class ReviewsService {
  constructor(
    private readonly reviewsRepository: ReviewsRepository,
    private readonly ordersService: OrdersService,
    private readonly restaurantsService: RestaurantsService,
  ) {}

  async createReview(
    user: JwtPayload,
    orderId: string,
    dto: CreateReviewDto,
  ): Promise<ReviewResponseDto> {
    const order = await this.ordersService.getOrderById(user, orderId);
    // Defense in depth — the controller already restricts this route to
    // CUSTOMER, but only the order's own customer may review it.
    if (order.customerId !== user.sub) {
      throw new ForbiddenException({
        code: 'AUTH_1003',
        message: 'Insufficient role permission',
      });
    }
    if (order.status !== OrderStatus.DELIVERED) {
      throw new UnprocessableEntityException({
        code: 'REVIEW_7001',
        message: 'Order is not yet reviewable',
      });
    }
    const existing = await this.reviewsRepository.findByOrderId(orderId);
    if (existing) {
      throw new ConflictException({
        code: 'REVIEW_7002',
        message: 'Order has already been reviewed',
      });
    }

    const review = await this.reviewsRepository.createReview({
      orderId,
      customerId: user.sub,
      restaurantId: order.restaurantId,
      driverId: order.driverId,
      rating: dto.rating,
      comment: dto.comment,
    });

    const avgRating = await this.reviewsRepository.avgRatingForRestaurant(
      order.restaurantId,
    );
    await this.restaurantsService.updateAvgRating(
      order.restaurantId,
      avgRating,
    );

    return toReviewResponseDto(review);
  }

  async listByRestaurant(
    restaurantId: string,
    query: ReviewListQueryDto,
  ): Promise<PaginatedResult<ReviewResponseDto>> {
    await this.restaurantsService.getById(restaurantId);

    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const { skip, take } = paginate(page, limit);
    const { rows, total } = await this.reviewsRepository.findByRestaurant(
      restaurantId,
      skip,
      take,
    );
    return buildPaginatedResult(
      rows.map(toReviewResponseDto),
      total,
      page,
      limit,
    );
  }
}
