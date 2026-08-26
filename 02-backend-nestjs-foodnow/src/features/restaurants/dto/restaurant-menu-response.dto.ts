import { MenuItemResponseDto } from './menu-item-response.dto';

export class CategoryResponseDto {
  id: string;
  restaurantId: string;
  name: string;
  sortOrder: number;
}

export class MenuCategoryResponseDto extends CategoryResponseDto {
  items: MenuItemResponseDto[];
}

export class RestaurantMenuResponseDto {
  categories: MenuCategoryResponseDto[];
}
