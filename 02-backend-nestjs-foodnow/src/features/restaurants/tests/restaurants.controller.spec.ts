/* eslint-disable @typescript-eslint/unbound-method -- jest mock assertions (expect(mock.method).toHaveBeenCalledWith) are always false positives for this rule */
import { Role } from '../../../shared/types/role.enum';
import { RestaurantsController } from '../restaurants.controller';
import { RestaurantsService } from '../restaurants.service';

describe('RestaurantsController', () => {
  let controller: RestaurantsController;
  let service: jest.Mocked<RestaurantsService>;
  const user = { sub: 'owner-1', role: Role.VENDOR };

  beforeEach(() => {
    service = {
      search: jest.fn(),
      getById: jest.fn(),
      getMenu: jest.fn(),
      createRestaurant: jest.fn(),
      updateRestaurant: jest.fn(),
      createCategory: jest.fn(),
      createMenuItem: jest.fn(),
    } as unknown as jest.Mocked<RestaurantsService>;

    controller = new RestaurantsController(service);
  });

  it('search delegates to the service with the query dto', async () => {
    const query = { lat: 21.0245, lng: 105.8412 } as never;
    await controller.search(query);
    expect(service.search).toHaveBeenCalledWith(query);
  });

  it('getById delegates to the service with the id', async () => {
    await controller.getById('restaurant-1');
    expect(service.getById).toHaveBeenCalledWith('restaurant-1');
  });

  it('getMenu delegates to the service with the id', async () => {
    await controller.getMenu('restaurant-1');
    expect(service.getMenu).toHaveBeenCalledWith('restaurant-1');
  });

  it('createRestaurant delegates with the caller id as owner', async () => {
    const dto = {
      name: 'Pho 24',
      lat: 21.0245,
      lng: 105.8412,
      openingHours: {},
    } as never;
    await controller.createRestaurant(user, dto);
    expect(service.createRestaurant).toHaveBeenCalledWith('owner-1', dto);
  });

  it('updateRestaurant delegates with the caller id, restaurant id, and dto', async () => {
    const dto = { name: 'New Name' };
    await controller.updateRestaurant(user, 'restaurant-1', dto);
    expect(service.updateRestaurant).toHaveBeenCalledWith(
      'owner-1',
      'restaurant-1',
      dto,
    );
  });

  it('createCategory delegates with the caller id, restaurant id, and dto', async () => {
    const dto = { name: 'Main' };
    await controller.createCategory(user, 'restaurant-1', dto);
    expect(service.createCategory).toHaveBeenCalledWith(
      'owner-1',
      'restaurant-1',
      dto,
    );
  });

  it('createMenuItem delegates with the caller id, restaurant id, and dto', async () => {
    const dto = { categoryId: 'cat-1', name: 'Pho Bo', basePrice: '45000.00' };
    await controller.createMenuItem(user, 'restaurant-1', dto);
    expect(service.createMenuItem).toHaveBeenCalledWith(
      'owner-1',
      'restaurant-1',
      dto,
    );
  });
});
