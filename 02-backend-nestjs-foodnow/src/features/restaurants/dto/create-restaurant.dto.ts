import {
  IsLatitude,
  IsLongitude,
  IsObject,
  IsOptional,
  IsString,
} from 'class-validator';
import type { OpeningHours } from '../types/restaurants.types';

export class CreateRestaurantDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsLatitude()
  lat: number;

  @IsLongitude()
  lng: number;

  @IsObject()
  openingHours: OpeningHours;
}
