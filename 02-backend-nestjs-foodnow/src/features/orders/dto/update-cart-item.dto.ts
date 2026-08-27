import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class UpdateCartItemDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  quantity?: number;

  @IsOptional()
  @IsString()
  note?: string;
}
