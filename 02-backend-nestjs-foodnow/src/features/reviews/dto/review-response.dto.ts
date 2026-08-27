export class ReviewResponseDto {
  id: string;
  orderId: string;
  customerId: string;
  restaurantId: string | null;
  driverId: string | null;
  rating: number;
  comment: string | null;
  createdAt: Date;
}
