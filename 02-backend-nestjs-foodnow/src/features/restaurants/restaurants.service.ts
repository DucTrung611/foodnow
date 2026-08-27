import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PaginatedResult } from '../../shared/types/paginated-result.type';
import {
  buildPaginatedResult,
  paginate,
} from '../../shared/utils/pagination.util';
import { RestaurantStatus } from '../../generated/prisma/enums';
import { RestaurantSearchQueryDto } from './dto/restaurant-search-query.dto';
import { CreateCategoryDto } from './dto/create-category.dto';
import { CreateMenuItemDto } from './dto/create-menu-item.dto';
import { CreateRestaurantDto } from './dto/create-restaurant.dto';
import {
  MenuItemOptionGroupResponseDto,
  MenuItemOptionResponseDto,
  MenuItemResponseDto,
} from './dto/menu-item-response.dto';
import {
  CategoryResponseDto,
  RestaurantMenuResponseDto,
} from './dto/restaurant-menu-response.dto';
import { RestaurantResponseDto } from './dto/restaurant-response.dto';
import { UpdateMenuItemDto } from './dto/update-menu-item.dto';
import { UpdateRestaurantDto } from './dto/update-restaurant.dto';
import {
  CategoryWithMenu,
  MenuItemWithOptions,
  RestaurantRow,
  RestaurantsRepository,
} from './restaurants.repository';
import { OpeningHours } from './types/restaurants.types';
import {
  isRestaurantOpen,
  isValidOpeningHours,
} from './utils/opening-hours.util';

function assertValidOpeningHours(value: OpeningHours): void {
  if (!isValidOpeningHours(value)) {
    throw new BadRequestException({
      code: 'COMMON_9000',
      message: 'Validation failed',
      details: [{ field: 'openingHours', issue: 'invalid shape' }],
    });
  }
}

export function toRestaurantResponseDto(
  row: RestaurantRow,
): RestaurantResponseDto {
  return {
    id: row.id,
    ownerId: row.owner_id,
    name: row.name,
    description: row.description,
    lat: row.lat,
    lng: row.lng,
    openingHours: row.opening_hours,
    status: row.status,
    avgRating: String(row.avg_rating),
    distanceMeters: row.distance_meters,
    isOpen: isRestaurantOpen(row.opening_hours),
    version: row.version,
  };
}

function toMenuItemOptionDto(option: {
  id: string;
  name: string;
  extraPrice: unknown;
}): MenuItemOptionResponseDto {
  return {
    id: option.id,
    name: option.name,
    extraPrice: String(option.extraPrice),
  };
}

function toMenuItemOptionGroupDto(group: {
  id: string;
  name: string;
  isRequired: boolean;
  minSelect: number;
  maxSelect: number;
  options: { id: string; name: string; extraPrice: unknown }[];
}): MenuItemOptionGroupResponseDto {
  return {
    id: group.id,
    name: group.name,
    isRequired: group.isRequired,
    minSelect: group.minSelect,
    maxSelect: group.maxSelect,
    options: group.options.map(toMenuItemOptionDto),
  };
}

export function toMenuItemResponseDto(
  item: MenuItemWithOptions,
): MenuItemResponseDto {
  return {
    id: item.id,
    restaurantId: item.restaurantId,
    categoryId: item.categoryId,
    name: item.name,
    basePrice: String(item.basePrice),
    isAvailable: item.isAvailable,
    optionGroups: item.optionGroups.map(toMenuItemOptionGroupDto),
    version: item.version,
  };
}

function toCategoryResponseDto(category: {
  id: string;
  restaurantId: string;
  name: string;
  sortOrder: number;
}): CategoryResponseDto {
  return {
    id: category.id,
    restaurantId: category.restaurantId,
    name: category.name,
    sortOrder: category.sortOrder,
  };
}

function toMenuCategoryResponseDto(category: CategoryWithMenu) {
  return {
    ...toCategoryResponseDto(category),
    items: category.menuItems.map(toMenuItemResponseDto),
  };
}

@Injectable()
export class RestaurantsService {
  constructor(
    private readonly restaurantsRepository: RestaurantsRepository,
    private readonly configService: ConfigService,
  ) {}

  async createRestaurant(
    ownerId: string,
    dto: CreateRestaurantDto,
  ): Promise<RestaurantResponseDto> {
    assertValidOpeningHours(dto.openingHours);
    const row = await this.restaurantsRepository.createRestaurant(ownerId, dto);
    return toRestaurantResponseDto(row);
  }

  async getById(id: string): Promise<RestaurantResponseDto> {
    const row = await this.restaurantsRepository.findById(id);
    if (!row) {
      throw new NotFoundException({
        code: 'RESTAURANT_2001',
        message: 'Restaurant not found',
      });
    }
    return toRestaurantResponseDto(row);
  }

  async updateRestaurant(
    userId: string,
    id: string,
    dto: UpdateRestaurantDto,
  ): Promise<RestaurantResponseDto> {
    const existing = await this.restaurantsRepository.findById(id);
    if (!existing) {
      throw new NotFoundException({
        code: 'RESTAURANT_2001',
        message: 'Restaurant not found',
      });
    }
    this.assertOwner(existing.owner_id, userId);
    if (dto.openingHours !== undefined)
      assertValidOpeningHours(dto.openingHours);

    const row = await this.restaurantsRepository.updateRestaurant(id, dto);
    return toRestaurantResponseDto(row!);
  }

  async search(
    query: RestaurantSearchQueryDto,
  ): Promise<PaginatedResult<RestaurantResponseDto>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const { skip, take } = paginate(page, limit);

    const { rows, total } = await this.restaurantsRepository.search({
      lat: query.lat,
      lng: query.lng,
      radiusMeters:
        query.radius ??
        this.configService.get<number>(
          'restaurant.defaultSearchRadiusMeters',
          5000,
        ),
      search: query.search,
      status: query.status ?? RestaurantStatus.ACTIVE,
      sort: query.sort,
      skip,
      take,
    });

    return buildPaginatedResult(
      rows.map(toRestaurantResponseDto),
      total,
      page,
      limit,
    );
  }

  async getMenu(restaurantId: string): Promise<RestaurantMenuResponseDto> {
    await this.getById(restaurantId);
    const categories =
      await this.restaurantsRepository.findMenuByRestaurantId(restaurantId);
    return { categories: categories.map(toMenuCategoryResponseDto) };
  }

  async createCategory(
    userId: string,
    restaurantId: string,
    dto: CreateCategoryDto,
  ): Promise<CategoryResponseDto> {
    const restaurant = await this.restaurantsRepository.findById(restaurantId);
    if (!restaurant) {
      throw new NotFoundException({
        code: 'RESTAURANT_2001',
        message: 'Restaurant not found',
      });
    }
    this.assertOwner(restaurant.owner_id, userId);

    const sortOrder =
      dto.sortOrder ??
      (await this.restaurantsRepository.countCategories(restaurantId));
    const category = await this.restaurantsRepository.createCategory(
      restaurantId,
      {
        name: dto.name,
        sortOrder,
      },
    );
    return toCategoryResponseDto(category);
  }

  async createMenuItem(
    userId: string,
    restaurantId: string,
    dto: CreateMenuItemDto,
  ): Promise<MenuItemResponseDto> {
    const restaurant = await this.restaurantsRepository.findById(restaurantId);
    if (!restaurant) {
      throw new NotFoundException({
        code: 'RESTAURANT_2001',
        message: 'Restaurant not found',
      });
    }
    this.assertOwner(restaurant.owner_id, userId);
    await this.assertCategoryBelongsToRestaurant(dto.categoryId, restaurantId);

    const item = await this.restaurantsRepository.createMenuItem(
      restaurantId,
      dto,
    );
    return toMenuItemResponseDto(item);
  }

  async getMenuItemById(id: string): Promise<MenuItemResponseDto> {
    const item = await this.restaurantsRepository.findMenuItemById(id);
    if (!item) throw new NotFoundException('Menu item not found');
    return toMenuItemResponseDto(item);
  }

  async updateMenuItem(
    userId: string,
    id: string,
    dto: UpdateMenuItemDto,
  ): Promise<MenuItemResponseDto> {
    const existing = await this.restaurantsRepository.findMenuItemById(id);
    if (!existing) throw new NotFoundException('Menu item not found');
    this.assertOwner(existing.restaurant.ownerId, userId);
    if (dto.categoryId !== undefined) {
      await this.assertCategoryBelongsToRestaurant(
        dto.categoryId,
        existing.restaurantId,
      );
    }

    const item = await this.restaurantsRepository.updateMenuItem(id, dto);
    return toMenuItemResponseDto(item);
  }

  async deleteMenuItem(userId: string, id: string): Promise<void> {
    const existing = await this.restaurantsRepository.findMenuItemById(id);
    if (!existing) throw new NotFoundException('Menu item not found');
    this.assertOwner(existing.restaurant.ownerId, userId);

    await this.restaurantsRepository.deleteMenuItem(id);
  }

  private assertOwner(ownerId: string, userId: string): void {
    if (ownerId !== userId) {
      throw new ForbiddenException({
        code: 'AUTH_1003',
        message: 'Insufficient role permission',
      });
    }
  }

  private async assertCategoryBelongsToRestaurant(
    categoryId: string,
    restaurantId: string,
  ): Promise<void> {
    const category =
      await this.restaurantsRepository.findCategoryById(categoryId);
    if (!category || category.restaurantId !== restaurantId) {
      throw new NotFoundException('Category not found');
    }
  }
}
