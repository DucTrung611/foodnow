/* eslint-disable @typescript-eslint/unbound-method -- jest mock assertions (expect(mock.method).toHaveBeenCalledWith) are always false positives for this rule */
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { OrderStatus } from '../../../generated/prisma/enums';
import { Role } from '../../../shared/types/role.enum';
import { haversineDistanceMeters } from '../../../shared/utils/geo.util';
import { AddressResponseDto } from '../../users/dto/address-response.dto';
import { UsersService } from '../../users/users.service';
import { MenuItemResponseDto } from '../../restaurants/dto/menu-item-response.dto';
import { RestaurantMenuResponseDto } from '../../restaurants/dto/restaurant-menu-response.dto';
import { RestaurantResponseDto } from '../../restaurants/dto/restaurant-response.dto';
import { RestaurantsService } from '../../restaurants/restaurants.service';
import { OrdersGateway } from '../orders.gateway';
import {
  CartItemWithCart,
  CartWithItems,
  OrderWithDetails,
  OrdersRepository,
} from '../orders.repository';
import { OrdersService } from '../orders.service';

const RESTAURANT: RestaurantResponseDto = {
  id: 'restaurant-1',
  ownerId: 'owner-1',
  name: 'Pho 24',
  description: null,
  lat: 21.0245,
  lng: 105.8412,
  openingHours: {} as never,
  status: 'ACTIVE',
  avgRating: '4.50',
  isOpen: true,
  version: 0,
};

const MENU_ITEM: MenuItemResponseDto = {
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
      options: [{ id: 'opt-1', name: 'Large', extraPrice: '10000.00' }],
    },
  ],
};

const MENU: RestaurantMenuResponseDto = {
  categories: [
    {
      id: 'cat-1',
      restaurantId: 'restaurant-1',
      name: 'Main',
      sortOrder: 0,
      items: [MENU_ITEM],
    },
  ],
};

const ADDRESS: AddressResponseDto = {
  id: 'address-1',
  label: 'Home',
  streetAddress: '123 Main St',
  lat: 21.03,
  lng: 105.85,
  isDefault: true,
  createdAt: new Date('2026-01-01'),
};

function makeCart(overrides: Partial<CartWithItems> = {}): CartWithItems {
  return {
    id: 'cart-1',
    customerId: 'customer-1',
    restaurantId: 'restaurant-1',
    createdAt: new Date('2026-01-01'),
    items: [],
    ...overrides,
  };
}

function makeCartItem(
  overrides: Partial<CartItemWithCart> = {},
): CartItemWithCart {
  return {
    id: 'cart-item-1',
    cartId: 'cart-1',
    menuItemId: 'item-1',
    quantity: 2,
    selectedOptions: ['opt-1'],
    note: null,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    cart: makeCart(),
    ...overrides,
  };
}

function makeOrder(
  overrides: Partial<OrderWithDetails> = {},
): OrderWithDetails {
  return {
    id: 'order-1',
    orderCode: 'FN-260824-0001',
    customerId: 'customer-1',
    restaurantId: 'restaurant-1',
    driverId: null,
    deliveryAddressId: 'address-1',
    status: OrderStatus.PENDING,
    subtotal: '55000.00' as never,
    deliveryFee: '18000.00' as never,
    discountAmount: '0.00' as never,
    totalAmount: '73000.00' as never,
    version: 0,
    placedAt: new Date('2026-08-24T10:30:00.000Z'),
    updatedAt: new Date('2026-08-24T10:30:00.000Z'),
    items: [
      {
        id: 'oi-1',
        orderId: 'order-1',
        menuItemId: 'item-1',
        itemNameSnapshot: 'Pho Bo',
        itemPriceSnapshot: '55000.00' as never,
        quantity: 1,
        subtotal: '55000.00' as never,
        note: null,
        createdAt: new Date('2026-08-24T10:30:00.000Z'),
        options: [
          {
            id: 'oio-1',
            orderItemId: 'oi-1',
            optionNameSnapshot: 'Large',
            optionPriceSnapshot: '10000.00' as never,
            createdAt: new Date('2026-08-24T10:30:00.000Z'),
          },
        ],
      },
    ],
    statusHistory: [
      {
        id: 'h-1',
        orderId: 'order-1',
        status: OrderStatus.PENDING,
        changedBy: 'customer-1',
        note: null,
        createdAt: new Date('2026-08-24T10:30:00.000Z'),
      },
    ],
    restaurant: { id: 'restaurant-1', ownerId: 'owner-1' } as never,
    ...overrides,
  };
}

describe('OrdersService', () => {
  let service: OrdersService;
  let repository: jest.Mocked<OrdersRepository>;
  let restaurantsService: jest.Mocked<RestaurantsService>;
  let usersService: jest.Mocked<UsersService>;
  let configService: jest.Mocked<ConfigService>;
  let gateway: jest.Mocked<OrdersGateway>;
  let eventEmitter: jest.Mocked<EventEmitter2>;

  beforeEach(() => {
    repository = {
      findCartByCustomerId: jest.fn(),
      createCart: jest.fn(),
      createCartItem: jest.fn(),
      findCartItemForCustomer: jest.fn(),
      updateCartItem: jest.fn(),
      deleteCartItem: jest.fn(),
      countCartItems: jest.fn(),
      deleteCartByCustomerId: jest.fn(),
      deleteCart: jest.fn(),
      createOrder: jest.fn(),
      findOrders: jest.fn(),
      findOrderById: jest.fn(),
      advanceStatus: jest.fn(),
      cancelOrder: jest.fn(),
      findManyByStatus: jest.fn(),
      assignDriver: jest.fn(),
    } as unknown as jest.Mocked<OrdersRepository>;

    restaurantsService = {
      getById: jest.fn(),
      getMenu: jest.fn(),
      getMenuItemById: jest.fn(),
    } as unknown as jest.Mocked<RestaurantsService>;

    usersService = {
      getAddressById: jest.fn(),
    } as unknown as jest.Mocked<UsersService>;

    configService = {
      get: jest.fn((key: string, def?: number) => {
        if (key === 'order.baseDeliveryFee') return 15000;
        if (key === 'order.perKmDeliveryFee') return 3000;
        return def;
      }),
    } as unknown as jest.Mocked<ConfigService>;

    gateway = {
      emitOrderCreated: jest.fn(),
      emitStatusChanged: jest.fn(),
      emitCancelled: jest.fn(),
    } as unknown as jest.Mocked<OrdersGateway>;

    eventEmitter = { emit: jest.fn() } as unknown as jest.Mocked<EventEmitter2>;

    service = new OrdersService(
      repository,
      restaurantsService,
      usersService,
      configService,
      gateway,
      eventEmitter,
    );
  });

  describe('getCart', () => {
    it('returns a synthetic empty cart when no cart row exists', async () => {
      repository.findCartByCustomerId.mockResolvedValue(null);

      const result = await service.getCart('customer-1');

      expect(result).toEqual({ id: '', restaurantId: null, items: [] });
      expect(restaurantsService.getMenu).not.toHaveBeenCalled();
    });

    it('resolves live name/price/options from the current menu', async () => {
      repository.findCartByCustomerId.mockResolvedValue(
        makeCart({ items: [makeCartItem()] }),
      );
      restaurantsService.getMenu.mockResolvedValue(MENU);

      const result = await service.getCart('customer-1');

      expect(restaurantsService.getMenu).toHaveBeenCalledWith('restaurant-1');
      expect(result).toEqual({
        id: 'cart-1',
        restaurantId: 'restaurant-1',
        items: [
          {
            id: 'cart-item-1',
            menuItemId: 'item-1',
            name: 'Pho Bo',
            basePrice: '45000.00',
            quantity: 2,
            selectedOptions: [
              { id: 'opt-1', name: 'Large', extraPrice: '10000.00' },
            ],
            note: null,
          },
        ],
      });
    });
  });

  describe('addCartItem', () => {
    const dto = { menuItemId: 'item-1', quantity: 1, optionIds: ['opt-1'] };

    it('rejects an unknown optionId without touching the cart', async () => {
      restaurantsService.getMenuItemById.mockResolvedValue(MENU_ITEM);

      await expect(
        service.addCartItem('customer-1', {
          ...dto,
          optionIds: ['not-an-option'],
        }),
      ).rejects.toMatchObject({ response: { code: 'COMMON_9000' } });
      expect(repository.findCartByCustomerId).not.toHaveBeenCalled();
    });

    it('rejects adding an item from a different restaurant than the existing cart (CART_3001)', async () => {
      restaurantsService.getMenuItemById.mockResolvedValue(MENU_ITEM);
      repository.findCartByCustomerId.mockResolvedValue(
        makeCart({ restaurantId: 'other-restaurant' }),
      );

      await expect(
        service.addCartItem('customer-1', dto),
      ).rejects.toMatchObject({
        response: { code: 'CART_3001' },
      });
      expect(repository.createCartItem).not.toHaveBeenCalled();
    });

    it('creates a new cart when the customer has none yet', async () => {
      restaurantsService.getMenuItemById.mockResolvedValue(MENU_ITEM);
      repository.findCartByCustomerId
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(makeCart({ items: [makeCartItem()] }));
      repository.createCart.mockResolvedValue(makeCart());
      restaurantsService.getMenu.mockResolvedValue(MENU);

      await service.addCartItem('customer-1', dto);

      expect(repository.createCart).toHaveBeenCalledWith(
        'customer-1',
        'restaurant-1',
      );
      expect(repository.createCartItem).toHaveBeenCalledWith('cart-1', {
        menuItemId: 'item-1',
        quantity: 1,
        selectedOptions: ['opt-1'],
        note: undefined,
      });
    });

    it('reuses the existing cart when it is for the same restaurant', async () => {
      restaurantsService.getMenuItemById.mockResolvedValue(MENU_ITEM);
      repository.findCartByCustomerId.mockResolvedValue(
        makeCart({ items: [makeCartItem()] }),
      );
      restaurantsService.getMenu.mockResolvedValue(MENU);

      await service.addCartItem('customer-1', dto);

      expect(repository.createCart).not.toHaveBeenCalled();
      expect(repository.createCartItem).toHaveBeenCalledWith(
        'cart-1',
        expect.any(Object),
      );
    });
  });

  describe('updateCartItem', () => {
    it('throws when the cart item does not belong to the customer', async () => {
      repository.findCartItemForCustomer.mockResolvedValue(null);

      await expect(
        service.updateCartItem('customer-1', 'cart-item-1', { quantity: 3 }),
      ).rejects.toThrow('Cart item not found');
      expect(repository.updateCartItem).not.toHaveBeenCalled();
    });

    it('updates the item and returns the refreshed cart', async () => {
      repository.findCartItemForCustomer.mockResolvedValue(makeCartItem());
      repository.findCartByCustomerId.mockResolvedValue(
        makeCart({ items: [makeCartItem()] }),
      );
      restaurantsService.getMenu.mockResolvedValue(MENU);

      await service.updateCartItem('customer-1', 'cart-item-1', {
        quantity: 3,
      });

      expect(repository.updateCartItem).toHaveBeenCalledWith('cart-item-1', {
        quantity: 3,
      });
    });
  });

  describe('removeCartItem', () => {
    it('throws when the cart item does not belong to the customer', async () => {
      repository.findCartItemForCustomer.mockResolvedValue(null);

      await expect(
        service.removeCartItem('customer-1', 'cart-item-1'),
      ).rejects.toThrow('Cart item not found');
    });

    it('deletes the now-empty cart when the last item is removed', async () => {
      repository.findCartItemForCustomer.mockResolvedValue(makeCartItem());
      repository.countCartItems.mockResolvedValue(0);
      repository.findCartByCustomerId.mockResolvedValue(null);

      await service.removeCartItem('customer-1', 'cart-item-1');

      expect(repository.deleteCart).toHaveBeenCalledWith('cart-1');
    });

    it('keeps the cart when other items remain', async () => {
      repository.findCartItemForCustomer.mockResolvedValue(makeCartItem());
      repository.countCartItems.mockResolvedValue(1);
      repository.findCartByCustomerId.mockResolvedValue(
        makeCart({ items: [makeCartItem()] }),
      );
      restaurantsService.getMenu.mockResolvedValue(MENU);

      await service.removeCartItem('customer-1', 'cart-item-1');

      expect(repository.deleteCart).not.toHaveBeenCalled();
    });
  });

  describe('clearCart', () => {
    it('delegates to the repository', async () => {
      await service.clearCart('customer-1');
      expect(repository.deleteCartByCustomerId).toHaveBeenCalledWith(
        'customer-1',
      );
    });
  });

  describe('createOrder', () => {
    const dto = {
      restaurantId: 'restaurant-1',
      deliveryAddressId: 'address-1',
      items: [{ menuItemId: 'item-1', quantity: 2, optionIds: ['opt-1'] }],
    };

    beforeEach(() => {
      restaurantsService.getById.mockResolvedValue(RESTAURANT);
      restaurantsService.getMenu.mockResolvedValue(MENU);
      usersService.getAddressById.mockResolvedValue(ADDRESS);
    });

    it('rejects when the restaurant is closed (RESTAURANT_2002)', async () => {
      restaurantsService.getById.mockResolvedValue({
        ...RESTAURANT,
        isOpen: false,
      });

      await expect(
        service.createOrder('customer-1', dto),
      ).rejects.toMatchObject({
        response: { code: 'RESTAURANT_2002' },
      });
      expect(usersService.getAddressById).not.toHaveBeenCalled();
    });

    it('rejects any promotionCode (PROMO_6001) — promotions is not implemented yet', async () => {
      await expect(
        service.createOrder('customer-1', {
          ...dto,
          promotionCode: 'FREESHIP',
        }),
      ).rejects.toMatchObject({ response: { code: 'PROMO_6001' } });
      expect(usersService.getAddressById).not.toHaveBeenCalled();
    });

    it("rejects an item that is not on this restaurant's menu (CART_3001)", async () => {
      await expect(
        service.createOrder('customer-1', {
          ...dto,
          items: [{ menuItemId: 'other-item', quantity: 1, optionIds: [] }],
        }),
      ).rejects.toMatchObject({ response: { code: 'CART_3001' } });
    });

    it('rejects an unavailable menu item (MENU_2010)', async () => {
      restaurantsService.getMenu.mockResolvedValue({
        categories: [
          {
            id: 'cat-1',
            restaurantId: 'restaurant-1',
            name: 'Main',
            sortOrder: 0,
            items: [{ ...MENU_ITEM, isAvailable: false }],
          },
        ],
      });

      await expect(
        service.createOrder('customer-1', dto),
      ).rejects.toMatchObject({
        response: { code: 'MENU_2010' },
      });
    });

    it('rejects an unknown optionId (COMMON_9000)', async () => {
      await expect(
        service.createOrder('customer-1', {
          ...dto,
          items: [{ menuItemId: 'item-1', quantity: 1, optionIds: ['bogus'] }],
        }),
      ).rejects.toMatchObject({ response: { code: 'COMMON_9000' } });
    });

    it('computes subtotal/deliveryFee/total, snapshots items, and emits order:created', async () => {
      const created = makeOrder();
      repository.createOrder.mockResolvedValue(created);

      const result = await service.createOrder('customer-1', dto);

      // unitPrice = 45000 base + 10000 option = 55000; quantity 2 -> subtotal 110000
      const expectedSubtotal = 110000;
      const distanceMeters = haversineDistanceMeters(
        RESTAURANT.lat,
        RESTAURANT.lng,
        ADDRESS.lat,
        ADDRESS.lng,
      );
      const expectedDeliveryFee =
        15000 + 3000 * Math.ceil(distanceMeters / 1000);

      expect(repository.createOrder).toHaveBeenCalledWith({
        customerId: 'customer-1',
        restaurantId: 'restaurant-1',
        deliveryAddressId: 'address-1',
        note: undefined,
        subtotal: expectedSubtotal,
        deliveryFee: expectedDeliveryFee,
        discountAmount: 0,
        totalAmount: expectedSubtotal + expectedDeliveryFee,
        items: [
          {
            menuItemId: 'item-1',
            name: 'Pho Bo',
            unitPrice: 55000,
            quantity: 2,
            note: undefined,
            options: [{ id: 'opt-1', name: 'Large', extraPrice: 10000 }],
          },
        ],
      });
      expect(gateway.emitOrderCreated).toHaveBeenCalledWith(
        'restaurant-1',
        expect.objectContaining({ id: 'order-1' }),
      );
      expect(result.id).toBe('order-1');
      expect(result.statusHistory).toHaveLength(1);
    });
  });

  describe('listOrders', () => {
    it('scopes to the caller for CUSTOMER', async () => {
      repository.findOrders.mockResolvedValue({ rows: [], total: 0 });

      await service.listOrders({ sub: 'customer-1', role: Role.CUSTOMER }, {});

      expect(repository.findOrders).toHaveBeenCalledWith(
        { customerId: 'customer-1' },
        undefined,
        0,
        20,
      );
    });

    it('scopes to owned restaurants for VENDOR', async () => {
      repository.findOrders.mockResolvedValue({ rows: [], total: 0 });

      await service.listOrders({ sub: 'owner-1', role: Role.VENDOR }, {});

      expect(repository.findOrders).toHaveBeenCalledWith(
        { restaurant: { ownerId: 'owner-1' } },
        undefined,
        0,
        20,
      );
    });

    it('scopes to assigned orders for DRIVER', async () => {
      repository.findOrders.mockResolvedValue({ rows: [], total: 0 });

      await service.listOrders({ sub: 'driver-1', role: Role.DRIVER }, {});

      expect(repository.findOrders).toHaveBeenCalledWith(
        { driverId: 'driver-1' },
        undefined,
        0,
        20,
      );
    });

    it('is unscoped for ADMIN and merges the status filter', async () => {
      repository.findOrders.mockResolvedValue({
        rows: [makeOrder()],
        total: 1,
      });

      const result = await service.listOrders(
        { sub: 'admin-1', role: Role.ADMIN },
        { status: OrderStatus.PENDING, page: 2, limit: 10 },
      );

      expect(repository.findOrders).toHaveBeenCalledWith(
        { status: OrderStatus.PENDING },
        undefined,
        10,
        10,
      );
      expect(result.meta).toEqual({
        page: 2,
        limit: 10,
        total: 1,
        totalPages: 1,
      });
      expect(result.data[0].statusHistory).toBeUndefined();
    });
  });

  describe('getOrderById', () => {
    it('throws ORDER_3005 when the order does not exist', async () => {
      repository.findOrderById.mockResolvedValue(null);

      await expect(
        service.getOrderById(
          { sub: 'customer-1', role: Role.CUSTOMER },
          'order-1',
        ),
      ).rejects.toMatchObject({ response: { code: 'ORDER_3005' } });
    });

    it('throws AUTH_1003 when the caller has no relation to the order', async () => {
      repository.findOrderById.mockResolvedValue(makeOrder());

      await expect(
        service.getOrderById(
          { sub: 'stranger', role: Role.CUSTOMER },
          'order-1',
        ),
      ).rejects.toMatchObject({ response: { code: 'AUTH_1003' } });
    });

    it('returns the mapped order for the owning customer', async () => {
      repository.findOrderById.mockResolvedValue(makeOrder());

      const result = await service.getOrderById(
        { sub: 'customer-1', role: Role.CUSTOMER },
        'order-1',
      );

      expect(result.id).toBe('order-1');
      expect(result.statusHistory).toHaveLength(1);
    });
  });

  describe('updateStatus', () => {
    const vendorUser = { sub: 'owner-1', role: Role.VENDOR };

    it('throws ORDER_3005 when the order does not exist', async () => {
      repository.findOrderById.mockResolvedValue(null);

      await expect(
        service.updateStatus(vendorUser, 'order-1', {
          status: OrderStatus.CONFIRMED,
          version: 0,
        }),
      ).rejects.toMatchObject({ response: { code: 'ORDER_3005' } });
    });

    it('throws AUTH_1003 when the VENDOR does not own the restaurant', async () => {
      repository.findOrderById.mockResolvedValue(makeOrder());

      await expect(
        service.updateStatus(
          { sub: 'someone-else', role: Role.VENDOR },
          'order-1',
          { status: OrderStatus.CONFIRMED, version: 0 },
        ),
      ).rejects.toMatchObject({ response: { code: 'AUTH_1003' } });
      expect(repository.advanceStatus).not.toHaveBeenCalled();
    });

    it('throws ORDER_3008 for an invalid transition', async () => {
      repository.findOrderById.mockResolvedValue(
        makeOrder({ status: OrderStatus.DELIVERED }),
      );

      await expect(
        service.updateStatus(vendorUser, 'order-1', {
          status: OrderStatus.CONFIRMED,
          version: 0,
        }),
      ).rejects.toMatchObject({ response: { code: 'ORDER_3008' } });
      expect(repository.advanceStatus).not.toHaveBeenCalled();
    });

    it('throws ORDER_3009 with the fresh version when the optimistic lock fails', async () => {
      repository.findOrderById
        .mockResolvedValueOnce(makeOrder({ version: 0 }))
        .mockResolvedValueOnce(makeOrder({ version: 2 }));
      repository.advanceStatus.mockResolvedValue(null);

      await expect(
        service.updateStatus(vendorUser, 'order-1', {
          status: OrderStatus.CONFIRMED,
          version: 0,
        }),
      ).rejects.toMatchObject({
        response: {
          code: 'ORDER_3009',
          details: [{ field: 'version', expected: 0, actual: 2 }],
        },
      });
    });

    it('advances the status and emits order:status_changed on success', async () => {
      repository.findOrderById.mockResolvedValue(makeOrder({ version: 0 }));
      const updated = makeOrder({ status: OrderStatus.CONFIRMED, version: 1 });
      repository.advanceStatus.mockResolvedValue(updated);

      const result = await service.updateStatus(vendorUser, 'order-1', {
        status: OrderStatus.CONFIRMED,
        version: 0,
      });

      expect(repository.advanceStatus).toHaveBeenCalledWith(
        'order-1',
        0,
        OrderStatus.CONFIRMED,
        'owner-1',
        undefined,
      );
      expect(gateway.emitStatusChanged).toHaveBeenCalledWith(
        expect.objectContaining({ status: OrderStatus.CONFIRMED, version: 1 }),
      );
      expect(result.status).toBe(OrderStatus.CONFIRMED);
      expect(eventEmitter.emit).not.toHaveBeenCalled();
    });

    it('emits order.ready_for_pickup only when the new status is READY_FOR_PICKUP', async () => {
      repository.findOrderById.mockResolvedValue(
        makeOrder({ status: OrderStatus.PREPARING, version: 2 }),
      );
      repository.advanceStatus.mockResolvedValue(
        makeOrder({ status: OrderStatus.READY_FOR_PICKUP, version: 3 }),
      );

      await service.updateStatus(vendorUser, 'order-1', {
        status: OrderStatus.READY_FOR_PICKUP,
        version: 2,
      });

      expect(eventEmitter.emit).toHaveBeenCalledWith('order.ready_for_pickup', {
        orderId: 'order-1',
        restaurantId: 'restaurant-1',
      });
    });
  });

  describe('cancelOrder', () => {
    it('throws ORDER_3005 when the order does not exist', async () => {
      repository.findOrderById.mockResolvedValue(null);

      await expect(
        service.cancelOrder(
          { sub: 'customer-1', role: Role.CUSTOMER },
          'order-1',
          {
            reason: 'changed my mind',
          },
        ),
      ).rejects.toMatchObject({ response: { code: 'ORDER_3005' } });
    });

    it('throws AUTH_1003 when the caller is neither the owning customer nor ADMIN', async () => {
      repository.findOrderById.mockResolvedValue(makeOrder());

      await expect(
        service.cancelOrder(
          { sub: 'stranger', role: Role.CUSTOMER },
          'order-1',
          {
            reason: 'changed my mind',
          },
        ),
      ).rejects.toMatchObject({ response: { code: 'AUTH_1003' } });
    });

    it('throws ORDER_3008 once the order is past the cancellable stage', async () => {
      repository.findOrderById.mockResolvedValue(
        makeOrder({ status: OrderStatus.ON_THE_WAY }),
      );

      await expect(
        service.cancelOrder(
          { sub: 'customer-1', role: Role.CUSTOMER },
          'order-1',
          {
            reason: 'changed my mind',
          },
        ),
      ).rejects.toMatchObject({ response: { code: 'ORDER_3008' } });
    });

    it('cancels and emits order:cancelled on success', async () => {
      repository.findOrderById.mockResolvedValue(makeOrder());
      repository.cancelOrder.mockResolvedValue(
        makeOrder({ status: OrderStatus.CANCELLED }),
      );

      const result = await service.cancelOrder(
        { sub: 'customer-1', role: Role.CUSTOMER },
        'order-1',
        { reason: 'changed my mind' },
      );

      expect(repository.cancelOrder).toHaveBeenCalledWith(
        'order-1',
        'customer-1',
        'changed my mind',
      );
      expect(gateway.emitCancelled).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'order-1' }),
        'changed my mind',
        'customer-1',
      );
      expect(result.status).toBe(OrderStatus.CANCELLED);
    });
  });

  describe('getOrderUnchecked', () => {
    it('throws ORDER_3005 when missing, with no access check otherwise', async () => {
      repository.findOrderById.mockResolvedValue(null);

      await expect(service.getOrderUnchecked('order-1')).rejects.toMatchObject({
        response: { code: 'ORDER_3005' },
      });
    });

    it('returns the mapped order for any id regardless of caller', async () => {
      repository.findOrderById.mockResolvedValue(makeOrder());

      const result = await service.getOrderUnchecked('order-1');

      expect(result.id).toBe('order-1');
    });
  });

  describe('listByStatus', () => {
    it('delegates to the repository and maps every row', async () => {
      repository.findManyByStatus.mockResolvedValue([
        makeOrder({ id: 'order-1' }),
        makeOrder({ id: 'order-2' }),
      ]);

      const result = await service.listByStatus(OrderStatus.READY_FOR_PICKUP);

      expect(repository.findManyByStatus).toHaveBeenCalledWith(
        OrderStatus.READY_FOR_PICKUP,
      );
      expect(result.map((o) => o.id)).toEqual(['order-1', 'order-2']);
    });
  });

  describe('assignDriver', () => {
    it('sets driverId without touching version', async () => {
      repository.assignDriver.mockResolvedValue(
        makeOrder({ driverId: 'driver-1' }),
      );

      const result = await service.assignDriver('order-1', 'driver-1');

      expect(repository.assignDriver).toHaveBeenCalledWith(
        'order-1',
        'driver-1',
      );
      expect(result.driverId).toBe('driver-1');
    });
  });
});
