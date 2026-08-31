export type RestaurantStatus = 'PENDING' | 'ACTIVE' | 'SUSPENDED';

export type OpeningHours = Record<
  'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun',
  { open: string; close: string } | null
>;

export type Restaurant = {
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
};

export type RestaurantSearchParams = {
  page?: number;
  limit?: number;
  search?: string;
  lat?: number;
  lng?: number;
  radius?: number;
  sort?: string;
  status?: RestaurantStatus;
};

export type MenuItemOption = {
  id: string;
  name: string;
  extraPrice: string;
};

export type MenuItemOptionGroup = {
  id: string;
  name: string;
  isRequired: boolean;
  minSelect: number;
  maxSelect: number;
  options: MenuItemOption[];
};

export type MenuItem = {
  id: string;
  restaurantId: string;
  categoryId: string;
  name: string;
  basePrice: string;
  imageUrl: string | null;
  isAvailable: boolean;
  optionGroups: MenuItemOptionGroup[];
  version: number;
};

export type MenuCategory = {
  id: string;
  restaurantId: string;
  name: string;
  sortOrder: number;
  items: MenuItem[];
};

export type RestaurantMenu = {
  categories: MenuCategory[];
};

export type CreateRestaurantPayload = {
  name: string;
  description?: string;
  imageUrl?: string;
  lat: number;
  lng: number;
  openingHours: OpeningHours;
};

export type CreateMenuItemPayload = {
  categoryId: string;
  name: string;
  basePrice: string;
  imageUrl?: string;
  isAvailable?: boolean;
};
