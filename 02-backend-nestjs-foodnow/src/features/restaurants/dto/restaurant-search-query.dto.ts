import { Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsLatitude,
  IsLongitude,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { RestaurantStatus } from '../../../generated/prisma/enums';

export class RestaurantSearchQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;

  @IsOptional()
  @IsString()
  search?: string;

  @Type(() => Number)
  @IsLatitude()
  lat: number;

  @Type(() => Number)
  @IsLongitude()
  lng: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  radius?: number;

  @IsOptional()
  @IsString()
  sort?: string;

  @IsOptional()
  @IsEnum(RestaurantStatus)
  status?: RestaurantStatus;
}
