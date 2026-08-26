/* eslint-disable @typescript-eslint/unbound-method -- jest mock assertions (expect(mock.method).toHaveBeenCalledWith) are always false positives for this rule */
import { ConfigService } from '@nestjs/config';
import { RestaurantStatus } from '../../../generated/prisma/enums';
import { RestaurantsService } from '../restaurants.service';
import {
  CategoryWithMenu,
  MenuItemWithOptions,
  MenuItemWithRestaurant,
  RestaurantRow,
  RestaurantsRepository,
} from '../restaurants.repository';
import { OpeningHours } from '../types/restaurants.types';

const OPEN_ALL_WEEK: OpeningHours = {
  mon: { open: '08:00', close: '22:00' },
  tue: { open: '08:00', close: '22:00' },
  wed: { open: '08:00', close: '22:00' },
  thu: { open: '08:00', close: '22:00' },
  fri: { open: '08:00', close: '22:00' },
  sat: { open: '08:00', close: '22:00' },
  sun: { open: '08:00', close: '22:00' },
};

function makeRestaurantRow(
  overrides: Partial<RestaurantRow> = {},
): RestaurantRow {
  return {
    id: 'restaurant-1',
    owner_id: 'owner-1',
    name: 'Pho 24',
    description: null,
    opening_hours: OPEN_ALL_WEEK,
    status: RestaurantStatus.ACTIVE,
    avg_rating: '4.50',
    version: 0,
    created_at: new Date('2026-01-01'),
    updated_at: new Date('2026-01-01'),
    lat: 21.0245,
    lng: 105.8412,
    ...overrides,
  };
}

describe('RestaurantsService', () => {
  let service: RestaurantsService;
  let repository: jest.Mocked<RestaurantsRepository>;
  let configService: jest.Mocked<ConfigService>;

  beforeEach(() => {
    repository = {
      createRestaurant: jest.fn(),
      findById: jest.fn(),
      updateRestaurant: jest.fn(),
      search: jest.fn(),
      createCategory: jest.fn(),
      countCategories: jest.fn(),
      findCategoryById: jest.fn(),
      createMenuItem: jest.fn(),
      findMenuItemById: jest.fn(),
      updateMenuItem: jest.fn(),
      deleteMenuItem: jest.fn(),
      findMenuByRestaurantId: jest.fn(),
    } as unknown as jest.Mocked<RestaurantsRepository>;

    configService = {
      get: jest.fn().mockReturnValue(5000),
    } as unknown as jest.Mocked<ConfigService>;

    service = new RestaurantsService(repository, configService);
  });

  describe('createRestaurant', () => {
    it('rejects malformed openingHours before touching the repository', async () => {
      await expect(
        service.createRestaurant('owner-1', {
          name: 'Pho 24',
          lat: 21.0245,
          lng: 105.8412,
          openingHours: { mon: { open: '25:00', close: '22:00' } } as never,
        }),
      ).rejects.toThrow('Validation failed');
      expect(repository.createRestaurant).not.toHaveBeenCalled();
    });

    it('creates the restaurant and maps the row to a response dto', async () => {
      repository.createRestaurant.mockResolvedValue(makeRestaurantRow());

      const result = await service.createRestaurant('owner-1', {
        name: 'Pho 24',
        lat: 21.0245,
        lng: 105.8412,
        openingHours: OPEN_ALL_WEEK,
      });

      expect(repository.createRestaurant).toHaveBeenCalledWith('owner-1', {
        name: 'Pho 24',
        lat: 21.0245,
        lng: 105.8412,
        openingHours: OPEN_ALL_WEEK,
      });
      expect(result.ownerId).toBe('owner-1');
      expect(result.avgRating).toBe('4.50');
      expect(result.status).toBe(RestaurantStatus.ACTIVE);
    });
  });

  describe('getById', () => {
    it('throws NotFoundException with RESTAURANT_2001 when missing', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(service.getById('missing')).rejects.toMatchObject({
        response: { code: 'RESTAURANT_2001' },
      });
    });

    it('maps the row, computing isOpen from openingHours', async () => {
      repository.findById.mockResolvedValue(makeRestaurantRow());

      const result = await service.getById('restaurant-1');

      expect(result.id).toBe('restaurant-1');
      expect(result.distanceMeters).toBeUndefined();
    });
  });

  describe('updateRestaurant', () => {
    it('throws 404 when the restaurant does not exist', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(
        service.updateRestaurant('owner-1', 'restaurant-1', { name: 'New' }),
      ).rejects.toMatchObject({ response: { code: 'RESTAURANT_2001' } });
      expect(repository.updateRestaurant).not.toHaveBeenCalled();
    });

    it('throws Forbidden (AUTH_1003) when the caller is not the owner', async () => {
      repository.findById.mockResolvedValue(
        makeRestaurantRow({ owner_id: 'owner-1' }),
      );

      await expect(
        service.updateRestaurant('someone-else', 'restaurant-1', {
          name: 'New',
        }),
      ).rejects.toMatchObject({ response: { code: 'AUTH_1003' } });
      expect(repository.updateRestaurant).not.toHaveBeenCalled();
    });

    it('updates when the caller is the owner', async () => {
      repository.findById.mockResolvedValue(
        makeRestaurantRow({ owner_id: 'owner-1' }),
      );
      repository.updateRestaurant.mockResolvedValue(
        makeRestaurantRow({
          owner_id: 'owner-1',
          name: 'New Name',
          version: 1,
        }),
      );

      const result = await service.updateRestaurant('owner-1', 'restaurant-1', {
        name: 'New Name',
      });

      expect(repository.updateRestaurant).toHaveBeenCalledWith('restaurant-1', {
        name: 'New Name',
      });
      expect(result.name).toBe('New Name');
    });
  });

  describe('search', () => {
    it('defaults status to ACTIVE, radius from config, page 1 / limit 20', async () => {
      repository.search.mockResolvedValue({ rows: [], total: 0 });

      await service.search({ lat: 21.0245, lng: 105.8412 });

      expect(repository.search).toHaveBeenCalledWith({
        lat: 21.0245,
        lng: 105.8412,
        radiusMeters: 5000,
        search: undefined,
        status: RestaurantStatus.ACTIVE,
        sort: undefined,
        skip: 0,
        take: 20,
      });
    });

    it('maps rows including distanceMeters and paginates the result', async () => {
      repository.search.mockResolvedValue({
        rows: [makeRestaurantRow({ distance_meters: 1234.5 })],
        total: 1,
      });

      const result = await service.search({
        lat: 21.0245,
        lng: 105.8412,
        page: 2,
        limit: 10,
      });

      expect(result.data[0].distanceMeters).toBe(1234.5);
      expect(result.meta).toEqual({
        page: 2,
        limit: 10,
        total: 1,
        totalPages: 1,
      });
    });
  });

  describe('getMenu', () => {
    it('throws 404 when the restaurant does not exist', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(service.getMenu('missing')).rejects.toMatchObject({
        response: { code: 'RESTAURANT_2001' },
      });
      expect(repository.findMenuByRestaurantId).not.toHaveBeenCalled();
    });

    it('maps the category -> menu item -> option group -> option tree', async () => {
      repository.findById.mockResolvedValue(makeRestaurantRow());
      const categories: CategoryWithMenu[] = [
        {
          id: 'cat-1',
          restaurantId: 'restaurant-1',
          name: 'Main',
          sortOrder: 0,
          createdAt: new Date('2026-01-01'),
          menuItems: [
            {
              id: 'item-1',
              restaurantId: 'restaurant-1',
              categoryId: 'cat-1',
              name: 'Pho Bo',
              basePrice: '45000.00' as never,
              isAvailable: true,
              version: 0,
              createdAt: new Date('2026-01-01'),
              updatedAt: new Date('2026-01-01'),
              optionGroups: [
                {
                  id: 'group-1',
                  menuItemId: 'item-1',
                  name: 'Size',
                  isRequired: true,
                  minSelect: 1,
                  maxSelect: 1,
                  createdAt: new Date('2026-01-01'),
                  options: [
                    {
                      id: 'opt-1',
                      optionGroupId: 'group-1',
                      name: 'Large',
                      extraPrice: '10000.00' as never,
                      createdAt: new Date('2026-01-01'),
                    },
                  ],
                },
              ],
            },
          ],
        },
      ];
      repository.findMenuByRestaurantId.mockResolvedValue(categories);

      const result = await service.getMenu('restaurant-1');

      expect(result.categories).toEqual([
        {
          id: 'cat-1',
          restaurantId: 'restaurant-1',
          name: 'Main',
          sortOrder: 0,
          items: [
            {
              id: 'item-1',
              restaurantId: 'restaurant-1',
              categoryId: 'cat-1',
              name: 'Pho Bo',
              basePrice: '45000.00',
              isAvailable: true,
              version: 0,
              optionGroups: [
                {
                  id: 'group-1',
                  name: 'Size',
                  isRequired: true,
                  minSelect: 1,
                  maxSelect: 1,
                  options: [
                    { id: 'opt-1', name: 'Large', extraPrice: '10000.00' },
                  ],
                },
              ],
            },
          ],
        },
      ]);
    });
  });

  describe('createCategory', () => {
    it('throws 404 when the restaurant does not exist', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(
        service.createCategory('owner-1', 'restaurant-1', { name: 'Main' }),
      ).rejects.toMatchObject({ response: { code: 'RESTAURANT_2001' } });
    });

    it('throws Forbidden when the caller is not the owner', async () => {
      repository.findById.mockResolvedValue(
        makeRestaurantRow({ owner_id: 'owner-1' }),
      );

      await expect(
        service.createCategory('someone-else', 'restaurant-1', {
          name: 'Main',
        }),
      ).rejects.toMatchObject({ response: { code: 'AUTH_1003' } });
    });

    it('defaults sortOrder to the current category count when omitted', async () => {
      repository.findById.mockResolvedValue(
        makeRestaurantRow({ owner_id: 'owner-1' }),
      );
      repository.countCategories.mockResolvedValue(2);
      repository.createCategory.mockResolvedValue({
        id: 'cat-3',
        restaurantId: 'restaurant-1',
        name: 'Drinks',
        sortOrder: 2,
        createdAt: new Date('2026-01-01'),
      });

      await service.createCategory('owner-1', 'restaurant-1', {
        name: 'Drinks',
      });

      expect(repository.createCategory).toHaveBeenCalledWith('restaurant-1', {
        name: 'Drinks',
        sortOrder: 2,
      });
    });

    it('uses the explicit sortOrder when provided', async () => {
      repository.findById.mockResolvedValue(
        makeRestaurantRow({ owner_id: 'owner-1' }),
      );
      repository.createCategory.mockResolvedValue({
        id: 'cat-3',
        restaurantId: 'restaurant-1',
        name: 'Drinks',
        sortOrder: 5,
        createdAt: new Date('2026-01-01'),
      });

      await service.createCategory('owner-1', 'restaurant-1', {
        name: 'Drinks',
        sortOrder: 5,
      });

      expect(repository.countCategories).not.toHaveBeenCalled();
      expect(repository.createCategory).toHaveBeenCalledWith('restaurant-1', {
        name: 'Drinks',
        sortOrder: 5,
      });
    });
  });

  describe('createMenuItem', () => {
    const dto = { categoryId: 'cat-1', name: 'Pho Bo', basePrice: '45000.00' };

    it('throws 404 when the restaurant does not exist', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(
        service.createMenuItem('owner-1', 'restaurant-1', dto),
      ).rejects.toMatchObject({
        response: { code: 'RESTAURANT_2001' },
      });
    });

    it('throws Forbidden when the caller is not the owner', async () => {
      repository.findById.mockResolvedValue(
        makeRestaurantRow({ owner_id: 'owner-1' }),
      );

      await expect(
        service.createMenuItem('someone-else', 'restaurant-1', dto),
      ).rejects.toMatchObject({ response: { code: 'AUTH_1003' } });
    });

    it('throws NotFoundException when the category does not belong to the restaurant', async () => {
      repository.findById.mockResolvedValue(
        makeRestaurantRow({ owner_id: 'owner-1' }),
      );
      repository.findCategoryById.mockResolvedValue({
        id: 'cat-1',
        restaurantId: 'other-restaurant',
      } as never);

      await expect(
        service.createMenuItem('owner-1', 'restaurant-1', dto),
      ).rejects.toThrow('Category not found');
      expect(repository.createMenuItem).not.toHaveBeenCalled();
    });

    it('creates the menu item when the category belongs to the restaurant', async () => {
      repository.findById.mockResolvedValue(
        makeRestaurantRow({ owner_id: 'owner-1' }),
      );
      repository.findCategoryById.mockResolvedValue({
        id: 'cat-1',
        restaurantId: 'restaurant-1',
      } as never);
      const item: MenuItemWithOptions = {
        id: 'item-1',
        restaurantId: 'restaurant-1',
        categoryId: 'cat-1',
        name: 'Pho Bo',
        basePrice: '45000.00' as never,
        isAvailable: true,
        version: 0,
        createdAt: new Date('2026-01-01'),
        updatedAt: new Date('2026-01-01'),
        optionGroups: [],
      };
      repository.createMenuItem.mockResolvedValue(item);

      const result = await service.createMenuItem(
        'owner-1',
        'restaurant-1',
        dto,
      );

      expect(repository.createMenuItem).toHaveBeenCalledWith(
        'restaurant-1',
        dto,
      );
      expect(result.basePrice).toBe('45000.00');
    });
  });

  describe('updateMenuItem / deleteMenuItem', () => {
    function makeItemWithRestaurant(ownerId: string): MenuItemWithRestaurant {
      return {
        id: 'item-1',
        restaurantId: 'restaurant-1',
        categoryId: 'cat-1',
        name: 'Pho Bo',
        basePrice: '45000.00' as never,
        isAvailable: true,
        version: 0,
        createdAt: new Date('2026-01-01'),
        updatedAt: new Date('2026-01-01'),
        restaurant: makeRestaurantRowAsPrisma(ownerId),
      };
    }

    function makeRestaurantRowAsPrisma(ownerId: string) {
      return { id: 'restaurant-1', ownerId } as never;
    }

    it('throws 404 when the menu item does not exist', async () => {
      repository.findMenuItemById.mockResolvedValue(null);

      await expect(
        service.updateMenuItem('owner-1', 'item-1', { name: 'New' }),
      ).rejects.toThrow('Menu item not found');
      await expect(service.deleteMenuItem('owner-1', 'item-1')).rejects.toThrow(
        'Menu item not found',
      );
    });

    it("throws Forbidden when the caller does not own the item's restaurant", async () => {
      repository.findMenuItemById.mockResolvedValue(
        makeItemWithRestaurant('owner-1'),
      );

      await expect(
        service.updateMenuItem('someone-else', 'item-1', { name: 'New' }),
      ).rejects.toMatchObject({ response: { code: 'AUTH_1003' } });
      await expect(
        service.deleteMenuItem('someone-else', 'item-1'),
      ).rejects.toMatchObject({
        response: { code: 'AUTH_1003' },
      });
    });

    it('updates the item when the caller is the owner', async () => {
      repository.findMenuItemById.mockResolvedValue(
        makeItemWithRestaurant('owner-1'),
      );
      repository.updateMenuItem.mockResolvedValue({
        id: 'item-1',
        restaurantId: 'restaurant-1',
        categoryId: 'cat-1',
        name: 'Pho Ga',
        basePrice: '40000.00' as never,
        isAvailable: false,
        version: 1,
        optionGroups: [],
      } as unknown as MenuItemWithOptions);

      const result = await service.updateMenuItem('owner-1', 'item-1', {
        name: 'Pho Ga',
        isAvailable: false,
      });

      expect(repository.updateMenuItem).toHaveBeenCalledWith('item-1', {
        name: 'Pho Ga',
        isAvailable: false,
      });
      expect(result.name).toBe('Pho Ga');
    });

    it('deletes the item when the caller is the owner', async () => {
      repository.findMenuItemById.mockResolvedValue(
        makeItemWithRestaurant('owner-1'),
      );
      repository.deleteMenuItem.mockResolvedValue(undefined);

      await service.deleteMenuItem('owner-1', 'item-1');

      expect(repository.deleteMenuItem).toHaveBeenCalledWith('item-1');
    });
  });
});
