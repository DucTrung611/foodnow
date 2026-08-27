/* eslint-disable @typescript-eslint/unbound-method -- jest mock assertions (expect(mock.method).toHaveBeenCalledWith) are always false positives for this rule */
import { Role } from '../../../shared/types/role.enum';
import { CartController } from '../cart.controller';
import { OrdersService } from '../orders.service';

describe('CartController', () => {
  let controller: CartController;
  let service: jest.Mocked<OrdersService>;
  const user = { sub: 'customer-1', role: Role.CUSTOMER };

  beforeEach(() => {
    service = {
      getCart: jest.fn(),
      addCartItem: jest.fn(),
      updateCartItem: jest.fn(),
      removeCartItem: jest.fn(),
      clearCart: jest.fn(),
    } as unknown as jest.Mocked<OrdersService>;

    controller = new CartController(service);
  });

  it('getCart delegates with the caller id', async () => {
    await controller.getCart(user);
    expect(service.getCart).toHaveBeenCalledWith('customer-1');
  });

  it('addItem delegates with the caller id and dto', async () => {
    const dto = { menuItemId: 'item-1', quantity: 1, optionIds: [] };
    await controller.addItem(user, dto);
    expect(service.addCartItem).toHaveBeenCalledWith('customer-1', dto);
  });

  it('updateItem delegates with the caller id, item id, and dto', async () => {
    const dto = { quantity: 3 };
    await controller.updateItem(user, 'cart-item-1', dto);
    expect(service.updateCartItem).toHaveBeenCalledWith(
      'customer-1',
      'cart-item-1',
      dto,
    );
  });

  it('removeItem delegates with the caller id and item id', async () => {
    await controller.removeItem(user, 'cart-item-1');
    expect(service.removeCartItem).toHaveBeenCalledWith(
      'customer-1',
      'cart-item-1',
    );
  });

  it('clearCart delegates with the caller id', async () => {
    await controller.clearCart(user);
    expect(service.clearCart).toHaveBeenCalledWith('customer-1');
  });
});
