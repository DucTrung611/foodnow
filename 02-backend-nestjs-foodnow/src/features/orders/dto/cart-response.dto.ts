export class CartItemOptionResponseDto {
  id: string;
  name: string;
  extraPrice: string;
}

export class CartItemResponseDto {
  id: string;
  menuItemId: string;
  name: string;
  basePrice: string;
  quantity: number;
  selectedOptions: CartItemOptionResponseDto[];
  note: string | null;
}

export class CartResponseDto {
  id: string;
  restaurantId: string | null;
  items: CartItemResponseDto[];
}
