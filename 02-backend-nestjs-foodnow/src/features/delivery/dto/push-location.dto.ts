import { IsLatitude, IsLongitude, IsOptional, IsUUID } from 'class-validator';

export class PushLocationDto {
  @IsLatitude()
  lat: number;

  @IsLongitude()
  lng: number;

  @IsOptional()
  @IsUUID()
  orderId?: string;
}
