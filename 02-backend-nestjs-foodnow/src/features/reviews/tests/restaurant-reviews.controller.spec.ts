/* eslint-disable @typescript-eslint/unbound-method -- jest mock assertions (expect(mock.method).toHaveBeenCalledWith) are always false positives for this rule */
import { RestaurantReviewsController } from '../restaurant-reviews.controller';
import { ReviewsService } from '../reviews.service';

describe('RestaurantReviewsController', () => {
  let controller: RestaurantReviewsController;
  let service: jest.Mocked<ReviewsService>;

  beforeEach(() => {
    service = {
      listByRestaurant: jest.fn(),
    } as unknown as jest.Mocked<ReviewsService>;

    controller = new RestaurantReviewsController(service);
  });

  it('listReviews delegates with the restaurant id and query', async () => {
    const query = { page: 1, limit: 20 };
    await controller.listReviews('restaurant-1', query);
    expect(service.listByRestaurant).toHaveBeenCalledWith(
      'restaurant-1',
      query,
    );
  });
});
