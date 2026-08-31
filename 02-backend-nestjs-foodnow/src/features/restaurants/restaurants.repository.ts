import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../core/database/prisma.service';
import { Prisma } from '../../generated/prisma/client';
import { RestaurantStatus } from '../../generated/prisma/enums';
import { OpeningHours } from './types/restaurants.types';

export type RestaurantRow = {
  id: string;
  owner_id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  opening_hours: OpeningHours;
  status: RestaurantStatus;
  avg_rating: string;
  version: number;
  created_at: Date;
  updated_at: Date;
  lat: number;
  lng: number;
  distance_meters?: number;
};

const RESTAURANT_COLUMNS = Prisma.sql`
  id, owner_id, name, description, image_url, opening_hours, status, avg_rating, version, created_at, updated_at,
  ST_Y(location::geometry) AS lat, ST_X(location::geometry) AS lng
`;

export type RestaurantSearchParams = {
  lat: number;
  lng: number;
  radiusMeters: number;
  search?: string;
  status: RestaurantStatus;
  sort?: string;
  skip: number;
  take: number;
};

function sortToOrderBy(sort: string | undefined): Prisma.Sql {
  switch (sort) {
    case '-avgRating':
      return Prisma.sql`avg_rating DESC`;
    case 'avgRating':
      return Prisma.sql`avg_rating ASC`;
    case '-createdAt':
      return Prisma.sql`created_at DESC`;
    case 'createdAt':
      return Prisma.sql`created_at ASC`;
    default:
      return Prisma.sql`distance_meters ASC`;
  }
}

export type CategoryWithMenu = Prisma.CategoryGetPayload<{
  include: {
    menuItems: {
      include: { optionGroups: { include: { options: true } } };
    };
  };
}>;

export type MenuItemWithRestaurant = Prisma.MenuItemGetPayload<{
  include: {
    restaurant: true;
    optionGroups: { include: { options: true } };
  };
}>;

export type MenuItemWithOptions = Prisma.MenuItemGetPayload<{
  include: { optionGroups: { include: { options: true } } };
}>;

@Injectable()
export class RestaurantsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createRestaurant(
    ownerId: string,
    dto: {
      name: string;
      description?: string;
      imageUrl?: string;
      lat: number;
      lng: number;
      openingHours: OpeningHours;
    },
  ): Promise<RestaurantRow> {
    const rows = await this.prisma.$queryRaw<RestaurantRow[]>`
      INSERT INTO restaurants (id, owner_id, name, description, image_url, location, opening_hours, status, avg_rating, version, created_at, updated_at)
      VALUES (
        gen_random_uuid(), ${ownerId}, ${dto.name}, ${dto.description ?? null}, ${dto.imageUrl ?? null},
        ST_SetSRID(ST_MakePoint(${dto.lng}, ${dto.lat}), 4326)::geography,
        ${JSON.stringify(dto.openingHours)}::jsonb,
        'PENDING', 0, 0, now(), now()
      )
      RETURNING ${RESTAURANT_COLUMNS}
    `;
    return rows[0];
  }

  async findById(id: string): Promise<RestaurantRow | null> {
    const rows = await this.prisma.$queryRaw<RestaurantRow[]>`
      SELECT ${RESTAURANT_COLUMNS}
      FROM restaurants
      WHERE id = ${id}
    `;
    return rows[0] ?? null;
  }

  async findByOwnerId(ownerId: string): Promise<RestaurantRow | null> {
    const rows = await this.prisma.$queryRaw<RestaurantRow[]>`
      SELECT ${RESTAURANT_COLUMNS}
      FROM restaurants
      WHERE owner_id = ${ownerId}
      ORDER BY created_at ASC
      LIMIT 1
    `;
    return rows[0] ?? null;
  }

  async updateRestaurant(
    id: string,
    dto: {
      name?: string;
      description?: string;
      imageUrl?: string;
      lat?: number;
      lng?: number;
      openingHours?: OpeningHours;
    },
  ): Promise<RestaurantRow | null> {
    const sets: Prisma.Sql[] = [];
    if (dto.name !== undefined) sets.push(Prisma.sql`name = ${dto.name}`);
    if (dto.description !== undefined) {
      sets.push(Prisma.sql`description = ${dto.description}`);
    }
    if (dto.imageUrl !== undefined) {
      sets.push(Prisma.sql`image_url = ${dto.imageUrl}`);
    }
    if (dto.openingHours !== undefined) {
      sets.push(
        Prisma.sql`opening_hours = ${JSON.stringify(dto.openingHours)}::jsonb`,
      );
    }
    if (dto.lat !== undefined && dto.lng !== undefined) {
      sets.push(
        Prisma.sql`location = ST_SetSRID(ST_MakePoint(${dto.lng}, ${dto.lat}), 4326)::geography`,
      );
    }
    if (sets.length === 0) return this.findById(id);
    sets.push(
      Prisma.sql`version = version + 1`,
      Prisma.sql`updated_at = now()`,
    );

    const rows = await this.prisma.$queryRaw<RestaurantRow[]>(Prisma.sql`
      UPDATE restaurants
      SET ${Prisma.join(sets, ', ')}
      WHERE id = ${id}
      RETURNING ${RESTAURANT_COLUMNS}
    `);
    return rows[0] ?? null;
  }

  async updateAvgRating(id: string, avgRating: number): Promise<void> {
    await this.prisma.$executeRaw`
      UPDATE restaurants
      SET avg_rating = ${avgRating}, updated_at = now()
      WHERE id = ${id}
    `;
  }

  /** Unscoped by geography — `search()` requires lat/lng, which an admin
   * picking a restaurant to filter orders by has no reason to supply. */
  async findAllForAdmin(params: {
    search?: string;
    skip: number;
    take: number;
  }): Promise<{ rows: RestaurantRow[]; total: number }> {
    const where = params.search
      ? Prisma.sql`WHERE name ILIKE ${'%' + params.search + '%'}`
      : Prisma.empty;

    const rows = await this.prisma.$queryRaw<RestaurantRow[]>(Prisma.sql`
      SELECT ${RESTAURANT_COLUMNS}
      FROM restaurants
      ${where}
      ORDER BY name ASC
      LIMIT ${params.take} OFFSET ${params.skip}
    `);

    const countRows = await this.prisma.$queryRaw<
      { count: bigint }[]
    >(Prisma.sql`
      SELECT COUNT(*) AS count FROM restaurants ${where}
    `);
    return { rows, total: Number(countRows[0]?.count ?? 0) };
  }

  async search(
    params: RestaurantSearchParams,
  ): Promise<{ rows: RestaurantRow[]; total: number }> {
    const point = Prisma.sql`ST_SetSRID(ST_MakePoint(${params.lng}, ${params.lat}), 4326)::geography`;
    const conditions: Prisma.Sql[] = [
      Prisma.sql`ST_DWithin(location, ${point}, ${params.radiusMeters})`,
      Prisma.sql`status = ${params.status}::"RestaurantStatus"`,
    ];
    if (params.search) {
      conditions.push(Prisma.sql`name ILIKE ${'%' + params.search + '%'}`);
    }
    const where = Prisma.join(conditions, ' AND ');
    const orderBy = sortToOrderBy(params.sort);

    const rows = await this.prisma.$queryRaw<RestaurantRow[]>(Prisma.sql`
      SELECT ${RESTAURANT_COLUMNS}, ST_Distance(location, ${point}) AS distance_meters
      FROM restaurants
      WHERE ${where}
      ORDER BY ${orderBy}
      LIMIT ${params.take} OFFSET ${params.skip}
    `);

    const countRows = await this.prisma.$queryRaw<
      { count: bigint }[]
    >(Prisma.sql`
      SELECT COUNT(*) AS count FROM restaurants WHERE ${where}
    `);
    return { rows, total: Number(countRows[0]?.count ?? 0) };
  }

  createCategory(
    restaurantId: string,
    dto: { name: string; sortOrder: number },
  ) {
    return this.prisma.category.create({
      data: { restaurantId, name: dto.name, sortOrder: dto.sortOrder },
    });
  }

  countCategories(restaurantId: string): Promise<number> {
    return this.prisma.category.count({ where: { restaurantId } });
  }

  findCategoryById(id: string) {
    return this.prisma.category.findUnique({ where: { id } });
  }

  createMenuItem(
    restaurantId: string,
    dto: {
      categoryId: string;
      name: string;
      basePrice: string;
      imageUrl?: string;
      isAvailable?: boolean;
    },
  ): Promise<MenuItemWithOptions> {
    return this.prisma.menuItem.create({
      data: {
        restaurantId,
        categoryId: dto.categoryId,
        name: dto.name,
        basePrice: dto.basePrice,
        imageUrl: dto.imageUrl,
        isAvailable: dto.isAvailable ?? true,
      },
      include: { optionGroups: { include: { options: true } } },
    });
  }

  findMenuItemById(id: string): Promise<MenuItemWithRestaurant | null> {
    return this.prisma.menuItem.findUnique({
      where: { id },
      include: {
        restaurant: true,
        optionGroups: { include: { options: true } },
      },
    });
  }

  updateMenuItem(
    id: string,
    dto: {
      categoryId?: string;
      name?: string;
      basePrice?: string;
      imageUrl?: string;
      isAvailable?: boolean;
    },
  ): Promise<MenuItemWithOptions> {
    return this.prisma.menuItem.update({
      where: { id },
      data: { ...dto, version: { increment: 1 } },
      include: { optionGroups: { include: { options: true } } },
    });
  }

  deleteMenuItem(id: string): Promise<void> {
    return this.prisma.menuItem.delete({ where: { id } }).then(() => undefined);
  }

  findMenuByRestaurantId(restaurantId: string): Promise<CategoryWithMenu[]> {
    return this.prisma.category.findMany({
      where: { restaurantId },
      orderBy: { sortOrder: 'asc' },
      include: {
        menuItems: {
          include: { optionGroups: { include: { options: true } } },
        },
      },
    });
  }
}
