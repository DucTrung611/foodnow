export class MenuItemOptionResponseDto {
  id: string;
  name: string;
  extraPrice: string;
}

export class MenuItemOptionGroupResponseDto {
  id: string;
  name: string;
  isRequired: boolean;
  minSelect: number;
  maxSelect: number;
  options: MenuItemOptionResponseDto[];
}

export class MenuItemResponseDto {
  id: string;
  restaurantId: string;
  categoryId: string;
  name: string;
  basePrice: string;
  isAvailable: boolean;
  optionGroups: MenuItemOptionGroupResponseDto[];
  version: number;
}
