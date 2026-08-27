/* eslint-disable @typescript-eslint/unbound-method -- jest mock assertions (expect(mock.method).toHaveBeenCalledWith) are always false positives for this rule */
import { Role } from '../../../shared/types/role.enum';
import { OrderReviewController } from '../order-review.controller';
import { ReviewsService } from '../reviews.service';

describe('OrderReviewController', () => {
  let controller: OrderReviewController;
  let service: jest.Mocked<ReviewsService>;
  const customer = { sub: 'customer-1', role: Role.CUSTOMER };

  beforeEach(() => {
    service = {
      createReview: jest.fn(),
    } as unknown as jest.Mocked<ReviewsService>;

    controller = new OrderReviewController(service);
  });

  it('createReview delegates with the caller, order id, and dto', async () => {
    const dto = { rating: 5, comment: 'Great food' };
    await controller.createReview(customer, 'order-1', dto);
    expect(service.createReview).toHaveBeenCalledWith(customer, 'order-1', dto);
  });
});
