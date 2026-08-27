import { DeliveryStatus } from '../types/delivery.types';

export class DeliveryResponseDto {
  id: string;
  orderId: string;
  driverId: string;
  pickupTime: Date | null;
  deliveryTime: Date | null;
  estimatedDistanceKm: string;
  status: DeliveryStatus;
}
