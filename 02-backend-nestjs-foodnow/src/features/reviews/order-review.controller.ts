import { Body, Controller, Param, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../../shared/decorators/current-user.decorator';
import { Roles } from '../../shared/decorators/roles.decorator';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { RolesGuard } from '../../shared/guards/roles.guard';
import type { JwtPayload } from '../../shared/types/jwt-payload.type';
import { Role } from '../../shared/types/role.enum';
import { CreateReviewDto } from './dto/create-review.dto';
import { ReviewsService } from './reviews.service';

/**
 * Lives in `reviews` despite the `/orders` URL prefix — posting a review
 * writes reviews-owned data (`reviews`), not anything `orders` owns. Same
 * pattern as delivery's OrderTrackingController / payments' OrderPaymentController.
 */
@Controller('orders')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.CUSTOMER)
export class OrderReviewController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Post(':id/reviews')
  createReview(
    @CurrentUser() user: JwtPayload,
    @Param('id') orderId: string,
    @Body() dto: CreateReviewDto,
  ) {
    return this.reviewsService.createReview(user, orderId, dto);
  }
}
