import { RestaurantStatus } from '../../../generated/prisma/enums';
import { OpeningHours } from '../types/restaurants.types';

export class RestaurantResponseDto {
  id: string;
  ownerId: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  lat: number;
  lng: number;
  openingHours: OpeningHours;
  status: RestaurantStatus;
  avgRating: string;
  distanceMeters?: number;
  isOpen: boolean;
  version: number;
}
