import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Prisma } from '../../generated/prisma/client';
import { OrderStatus } from '../../generated/prisma/enums';
import { PromotionsService } from '../promotions/promotions.service';
import { RestaurantsService } from '../restaurants/restaurants.service';
import {
  MenuItemOptionResponseDto,
  MenuItemResponseDto,
} from '../restaurants/dto/menu-item-response.dto';
import { RestaurantMenuResponseDto } from '../restaurants/dto/restaurant-menu-response.dto';
import { UsersService } from '../users/users.service';
import { JwtPayload } from '../../shared/types/jwt-payload.type';
import { Role } from '../../shared/types/role.enum';
import { PaginatedResult } from '../../shared/types/paginated-result.type';
import {
  buildPaginatedResult,
  paginate,
} from '../../shared/utils/pagination.util';
import { formatDecimal } from '../../shared/utils/decimal.util';
import { haversineDistanceMeters } from '../../shared/utils/geo.util';
import { AddCartItemDto } from './dto/add-cart-item.dto';
import { CancelOrderDto } from './dto/cancel-order.dto';
import { CartItemResponseDto, CartResponseDto } from './dto/cart-response.dto';
import { CreateOrderDto, CreateOrderItemDto } from './dto/create-order.dto';
import { OrderListQueryDto } from './dto/order-list-query.dto';
import {
  OrderItemResponseDto,
  OrderResponseDto,
} from './dto/order-response.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { OrdersGateway } from './orders.gateway';
import {
  CartItemWithCart,
  OrderWithDetails,
  OrderWithItems,
  OrdersRepository,
} from './orders.repository';
import { AdminOrderFilter, ResolvedOrderItem } from './types/orders.types';
import { canAdvance } from './utils/order-status-transitions.util';
import { hasOrderAccess } from './utils/order-access.util';

const CANCELLABLE_STATUSES: OrderStatus[] = [
  OrderStatus.PENDING,
  OrderStatus.CONFIRMED,
  OrderStatus.PREPARING,
];

function flattenMenuItems(
  menu: RestaurantMenuResponseDto,
): Map<string, MenuItemResponseDto> {
  const map = new Map<string, MenuItemResponseDto>();
  for (const category of menu.categories) {
    for (const item of category.items) map.set(item.id, item);
  }
  return map;
}

function toCartItemResponseDto(
  cartItem: {
    id: string;
    menuItemId: string;
    quantity: number;
    note: string | null;
    selectedOptions: unknown;
  },
  menuItem: MenuItemResponseDto | undefined,
): CartItemResponseDto {
  const optionIds = Array.isArray(cartItem.selectedOptions)
    ? (cartItem.selectedOptions as string[])
    : [];
  const allOptions =
    menuItem?.optionGroups.flatMap((group) => group.options) ?? [];
  const selectedOptions = optionIds
    .map((id) => allOptions.find((option) => option.id === id))
    .filter((option): option is MenuItemOptionResponseDto => Boolean(option))
    .map((option) => ({
      id: option.id,
      name: option.name,
      extraPrice: option.extraPrice,
    }));

  return {
    id: cartItem.id,
    menuItemId: cartItem.menuItemId,
    name: menuItem?.name ?? 'Unknown item',
    basePrice: menuItem?.basePrice ?? '0.00',
    quantity: cartItem.quantity,
    selectedOptions,
    note: cartItem.note,
  };
}

export function toOrderItemResponseDto(item: {
  id: string;
  menuItemId: string;
  itemNameSnapshot: string;
  itemPriceSnapshot: unknown;
  quantity: number;
  subtotal: unknown;
  note: string | null;
  options: {
    id: string;
    optionNameSnapshot: string;
    optionPriceSnapshot: unknown;
  }[];
}): OrderItemResponseDto {
  return {
    id: item.id,
    menuItemId: item.menuItemId,
    itemNameSnapshot: item.itemNameSnapshot,
    itemPriceSnapshot: formatDecimal(item.itemPriceSnapshot),
    quantity: item.quantity,
    subtotal: formatDecimal(item.subtotal),
    note: item.note,
    options: item.options.map((option) => ({
      id: option.id,
      optionNameSnapshot: option.optionNameSnapshot,
      optionPriceSnapshot: formatDecimal(option.optionPriceSnapshot),
    })),
  };
}

function toOrderListItemDto(order: OrderWithItems): OrderResponseDto {
  return {
    id: order.id,
    orderCode: order.orderCode,
    customerId: order.customerId,
    restaurantId: order.restaurantId,
    driverId: order.driverId,
    deliveryAddressId: order.deliveryAddressId,
    status: order.status,
    subtotal: formatDecimal(order.subtotal),
    deliveryFee: formatDecimal(order.deliveryFee),
    discountAmount: formatDecimal(order.discountAmount),
    totalAmount: formatDecimal(order.totalAmount),
    version: order.version,
    placedAt: order.placedAt,
    items: order.items.map(toOrderItemResponseDto),
  };
}

export function toOrderResponseDto(order: OrderWithDetails): OrderResponseDto {
  return {
    ...toOrderListItemDto(order),
    statusHistory: order.statusHistory.map((entry) => ({
      id: entry.id,
      status: entry.status,
      changedBy: entry.changedBy,
      note: entry.note,
      createdAt: entry.createdAt,
    })),
  };
}

@Injectable()
export class OrdersService {
  constructor(
    private readonly ordersRepository: OrdersRepository,
    private readonly restaurantsService: RestaurantsService,
    private readonly usersService: UsersService,
    private readonly configService: ConfigService,
    private readonly ordersGateway: OrdersGateway,
    private readonly eventEmitter: EventEmitter2,
    private readonly promotionsService: PromotionsService,
  ) {}

  // ─── Cart ────────────────────────────────────────────────────────────

  async getCart(customerId: string): Promise<CartResponseDto> {
    const cart = await this.ordersRepository.findCartByCustomerId(customerId);
    if (!cart) return { id: '', restaurantId: null, items: [] };

    const menu = await this.restaurantsService.getMenu(cart.restaurantId);
    const itemsById = flattenMenuItems(menu);
    return {
      id: cart.id,
      restaurantId: cart.restaurantId,
      items: cart.items.map((item) =>
        toCartItemResponseDto(item, itemsById.get(item.menuItemId)),
      ),
    };
  }

  async addCartItem(
    customerId: string,
    dto: AddCartItemDto,
  ): Promise<CartResponseDto> {
    const menuItem = await this.restaurantsService.getMenuItemById(
      dto.menuItemId,
    );
    this.assertValidOptionIds(menuItem, dto.optionIds);

    const existingCart =
      await this.ordersRepository.findCartByCustomerId(customerId);
    if (existingCart && existingCart.restaurantId !== menuItem.restaurantId) {
      throw new UnprocessableEntityException({
        code: 'CART_3001',
        message: 'Cart contains items from another restaurant',
      });
    }

    const cartId = existingCart
      ? existingCart.id
      : (
          await this.ordersRepository.createCart(
            customerId,
            menuItem.restaurantId,
          )
        ).id;

    await this.ordersRepository.createCartItem(cartId, {
      menuItemId: dto.menuItemId,
      quantity: dto.quantity,
      selectedOptions: dto.optionIds,
      note: dto.note,
    });

    return this.getCart(customerId);
  }

  async updateCartItem(
    customerId: string,
    cartItemId: string,
    dto: UpdateCartItemDto,
  ): Promise<CartResponseDto> {
    await this.assertCartItemOwnership(cartItemId, customerId);
    await this.ordersRepository.updateCartItem(cartItemId, dto);
    return this.getCart(customerId);
  }

  async removeCartItem(
    customerId: string,
    cartItemId: string,
  ): Promise<CartResponseDto> {
    const existing = await this.assertCartItemOwnership(cartItemId, customerId);
    await this.ordersRepository.deleteCartItem(cartItemId);

    const remaining = await this.ordersRepository.countCartItems(
      existing.cartId,
    );
    if (remaining === 0)
      await this.ordersRepository.deleteCart(existing.cartId);

    return this.getCart(customerId);
  }

  async clearCart(customerId: string): Promise<void> {
    await this.ordersRepository.deleteCartByCustomerId(customerId);
  }

  private async assertCartItemOwnership(
    cartItemId: string,
    customerId: string,
  ): Promise<CartItemWithCart> {
    const existing = await this.ordersRepository.findCartItemForCustomer(
      cartItemId,
      customerId,
    );
    if (!existing) throw new NotFoundException('Cart item not found');
    return existing;
  }

  private assertValidOptionIds(
    menuItem: MenuItemResponseDto,
    optionIds: string[],
  ): void {
    const allOptionIds = new Set(
      menuItem.optionGroups.flatMap((group) =>
        group.options.map((option) => option.id),
      ),
    );
    const invalid = optionIds.find((id) => !allOptionIds.has(id));
    if (invalid) {
      throw new BadRequestException({
        code: 'COMMON_9000',
        message: 'Validation failed',
        details: [{ field: 'optionIds', issue: `unknown option ${invalid}` }],
      });
    }
  }

  // ─── Orders ──────────────────────────────────────────────────────────

  async createOrder(
    customerId: string,
    dto: CreateOrderDto,
  ): Promise<OrderResponseDto> {
    const restaurant = await this.restaurantsService.getById(dto.restaurantId);
    if (!restaurant.isOpen) {
      throw new UnprocessableEntityException({
        code: 'RESTAURANT_2002',
        message: 'Restaurant is closed',
      });
    }

    const address = await this.usersService.getAddressById(
      customerId,
      dto.deliveryAddressId,
    );
    const menu = await this.restaurantsService.getMenu(dto.restaurantId);
    const itemsById = flattenMenuItems(menu);
    const resolvedItems = dto.items.map((itemDto) =>
      this.resolveOrderItem(itemsById, itemDto),
    );

    const subtotal = resolvedItems.reduce(
      (sum, item) => sum + item.unitPrice * item.quantity,
      0,
    );
    const distanceMeters = haversineDistanceMeters(
      restaurant.lat,
      restaurant.lng,
      address.lat,
      address.lng,
    );
    const baseFee = this.configService.get<number>(
      'order.baseDeliveryFee',
      15000,
    );
    const perKmFee = this.configService.get<number>(
      'order.perKmDeliveryFee',
      3000,
    );
    const deliveryFee = baseFee + perKmFee * Math.ceil(distanceMeters / 1000);

    let discountAmount = 0;
    let appliedPromotionId: string | undefined;
    if (dto.promotionCode) {
      const promo = await this.promotionsService.validate(customerId, {
        code: dto.promotionCode,
        restaurantId: dto.restaurantId,
        subtotal: subtotal.toFixed(2),
      });
      discountAmount = Number(promo.discountAmount);
      appliedPromotionId = promo.id;
    }
    const totalAmount = subtotal + deliveryFee - discountAmount;

    const order = await this.ordersRepository.createOrder({
      customerId,
      restaurantId: dto.restaurantId,
      deliveryAddressId: dto.deliveryAddressId,
      note: dto.note,
      subtotal,
      deliveryFee,
      discountAmount,
      totalAmount,
      items: resolvedItems,
    });

    if (appliedPromotionId) {
      // Fire-and-forget: usage accounting must never block order creation.
      void this.promotionsService.recordUsage(
        appliedPromotionId,
        customerId,
        order.id,
        discountAmount,
      );
    }

    const response = toOrderResponseDto(order);
    this.ordersGateway.emitOrderCreated(dto.restaurantId, response);
    return response;
  }

  private resolveOrderItem(
    itemsById: Map<string, MenuItemResponseDto>,
    itemDto: CreateOrderItemDto,
  ): ResolvedOrderItem {
    const menuItem = itemsById.get(itemDto.menuItemId);
    if (!menuItem) {
      throw new UnprocessableEntityException({
        code: 'CART_3001',
        message: 'Cart contains items from another restaurant',
      });
    }
    if (!menuItem.isAvailable) {
      throw new UnprocessableEntityException({
        code: 'MENU_2010',
        message: 'Menu item unavailable',
      });
    }
    this.assertValidOptionIds(menuItem, itemDto.optionIds);

    const allOptions = menuItem.optionGroups.flatMap((group) => group.options);
    const options = itemDto.optionIds.map((id) => {
      const option = allOptions.find((o) => o.id === id)!;
      return {
        id: option.id,
        name: option.name,
        extraPrice: Number(option.extraPrice),
      };
    });
    const unitPrice =
      Number(menuItem.basePrice) +
      options.reduce((sum, o) => sum + o.extraPrice, 0);

    return {
      menuItemId: menuItem.id,
      name: menuItem.name,
      unitPrice,
      quantity: itemDto.quantity,
      note: itemDto.note,
      options,
    };
  }

  async listOrders(
    user: JwtPayload,
    query: OrderListQueryDto,
  ): Promise<PaginatedResult<OrderResponseDto>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const { skip, take } = paginate(page, limit);

    const where: Prisma.OrderWhereInput = this.scopeWhereForRole(user);
    if (query.status) where.status = query.status;

    const { rows, total } = await this.ordersRepository.findOrders(
      where,
      query.sort,
      skip,
      take,
    );
    return buildPaginatedResult(
      rows.map(toOrderListItemDto),
      total,
      page,
      limit,
    );
  }

  /** No access scoping — the `admin` feature is the only caller, guarded by RolesGuard at the route. */
  async listForAdmin(
    filter: AdminOrderFilter,
  ): Promise<PaginatedResult<OrderResponseDto>> {
    const page = filter.page ?? 1;
    const limit = filter.limit ?? 20;
    const { skip, take } = paginate(page, limit);

    const where: Prisma.OrderWhereInput = {};
    if (filter.status) where.status = filter.status;
    if (filter.customerId) where.customerId = filter.customerId;
    if (filter.restaurantId) where.restaurantId = filter.restaurantId;
    if (filter.driverId) where.driverId = filter.driverId;

    const { rows, total } = await this.ordersRepository.findOrders(
      where,
      filter.sort,
      skip,
      take,
    );
    return buildPaginatedResult(
      rows.map(toOrderListItemDto),
      total,
      page,
      limit,
    );
  }

  private scopeWhereForRole(user: JwtPayload): Prisma.OrderWhereInput {
    switch (user.role) {
      case Role.CUSTOMER:
        return { customerId: user.sub };
      case Role.VENDOR:
        return { restaurant: { ownerId: user.sub } };
      case Role.DRIVER:
        return { driverId: user.sub };
      default:
        return {};
    }
  }

  async getOrderById(user: JwtPayload, id: string): Promise<OrderResponseDto> {
    const order = await this.findOrderOrThrow(id);
    if (!hasOrderAccess(user, order)) {
      throw new ForbiddenException({
        code: 'AUTH_1003',
        message: 'Insufficient role permission',
      });
    }
    return toOrderResponseDto(order);
  }

  async updateStatus(
    user: JwtPayload,
    id: string,
    dto: UpdateOrderStatusDto,
  ): Promise<OrderResponseDto> {
    const order = await this.findOrderOrThrow(id);

    if (user.role === Role.VENDOR && order.restaurant.ownerId !== user.sub) {
      throw new ForbiddenException({
        code: 'AUTH_1003',
        message: 'Insufficient role permission',
      });
    }
    if (!canAdvance(user.role, order.status, dto.status)) {
      throw new UnprocessableEntityException({
        code: 'ORDER_3008',
        message: 'Invalid status transition',
      });
    }

    const updated = await this.ordersRepository.advanceStatus(
      id,
      dto.version,
      dto.status,
      user.sub,
      dto.note,
    );
    if (!updated) {
      const fresh = await this.ordersRepository.findOrderById(id);
      throw new ConflictException({
        code: 'ORDER_3009',
        message: 'Order was modified by another party, please retry',
        details: [
          {
            field: 'version',
            expected: dto.version,
            actual: fresh?.version ?? null,
          },
        ],
      });
    }

    const response = toOrderResponseDto(updated);
    this.ordersGateway.emitStatusChanged(response);
    if (dto.status === OrderStatus.READY_FOR_PICKUP) {
      this.eventEmitter.emit('order.ready_for_pickup', {
        orderId: response.id,
        restaurantId: response.restaurantId,
      });
    }
    return response;
  }

  /** No access check — only for other backend features via DI, never call from a controller. */
  async getOrderUnchecked(id: string): Promise<OrderResponseDto> {
    const order = await this.findOrderOrThrow(id);
    return toOrderResponseDto(order);
  }

  /** Unscoped, bounded lookup for cross-feature use (e.g. delivery matching) — never exposed via a route. */
  async listByStatus(status: OrderStatus): Promise<OrderResponseDto[]> {
    const orders = await this.ordersRepository.findManyByStatus(status);
    return orders.map(toOrderResponseDto);
  }

  /** Doesn't touch `version` — that field is scoped to the status-transition contract, not driver assignment. */
  async assignDriver(
    orderId: string,
    driverId: string,
  ): Promise<OrderResponseDto> {
    const updated = await this.ordersRepository.assignDriver(orderId, driverId);
    return toOrderResponseDto(updated);
  }

  async cancelOrder(
    user: JwtPayload,
    id: string,
    dto: CancelOrderDto,
  ): Promise<OrderResponseDto> {
    const order = await this.findOrderOrThrow(id);

    const canCancel =
      user.role === Role.ADMIN ||
      (user.role === Role.CUSTOMER && order.customerId === user.sub);
    if (!canCancel) {
      throw new ForbiddenException({
        code: 'AUTH_1003',
        message: 'Insufficient role permission',
      });
    }
    if (!CANCELLABLE_STATUSES.includes(order.status)) {
      throw new UnprocessableEntityException({
        code: 'ORDER_3008',
        message: 'Invalid status transition',
      });
    }

    const cancelled = await this.ordersRepository.cancelOrder(
      id,
      user.sub,
      dto.reason,
    );
    const response = toOrderResponseDto(cancelled);
    this.ordersGateway.emitCancelled(response, dto.reason, user.sub);
    return response;
  }

  private async findOrderOrThrow(id: string): Promise<OrderWithDetails> {
    const order = await this.ordersRepository.findOrderById(id);
    if (!order)
      throw new NotFoundException({
        code: 'ORDER_3005',
        message: 'Order not found',
      });
    return order;
  }
}
