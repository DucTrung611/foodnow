/* eslint-disable @typescript-eslint/unbound-method -- jest mock assertions (expect(mock.method).toHaveBeenCalledWith) are always false positives for this rule */
import { Role } from '../../../shared/types/role.enum';
import { MenuItemsController } from '../menu-items.controller';
import { RestaurantsService } from '../restaurants.service';

describe('MenuItemsController', () => {
  let controller: MenuItemsController;
  let service: jest.Mocked<RestaurantsService>;
  const user = { sub: 'owner-1', role: Role.VENDOR };

  beforeEach(() => {
    service = {
      updateMenuItem: jest.fn(),
      deleteMenuItem: jest.fn(),
    } as unknown as jest.Mocked<RestaurantsService>;

    controller = new MenuItemsController(service);
  });

  it('updateMenuItem delegates with the caller id, item id, and dto', async () => {
    const dto = { isAvailable: false };
    await controller.updateMenuItem(user, 'item-1', dto);
    expect(service.updateMenuItem).toHaveBeenCalledWith(
      'owner-1',
      'item-1',
      dto,
    );
  });

  it('deleteMenuItem delegates with the caller id and item id', async () => {
    await controller.deleteMenuItem(user, 'item-1');
    expect(service.deleteMenuItem).toHaveBeenCalledWith('owner-1', 'item-1');
  });
});
