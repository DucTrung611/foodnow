import { Controller, Get, Param, Query } from '@nestjs/common';
import { ReviewListQueryDto } from './dto/review-list-query.dto';
import { ReviewsService } from './reviews.service';

/**
 * Lives in `reviews` despite the `/restaurants` URL prefix — same
 * cross-feature-owned-URL pattern as OrderReviewController. Public route,
 * no guards.
 */
@Controller('restaurants')
export class RestaurantReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Get(':id/reviews')
  listReviews(
    @Param('id') restaurantId: string,
    @Query() query: ReviewListQueryDto,
  ) {
    return this.reviewsService.listByRestaurant(restaurantId, query);
  }
}
