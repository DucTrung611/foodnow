import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../core/database/prisma.service';
import { Prisma } from '../../generated/prisma/client';
import { OrderStatus } from '../../generated/prisma/enums';
import { generateOrderCode } from './utils/order-code.util';
import { ResolvedOrderItem } from './types/orders.types';

export type CartWithItems = Prisma.CartGetPayload<{ include: { items: true } }>;
export type CartItemWithCart = Prisma.CartItemGetPayload<{
  include: { cart: true };
}>;

const ORDER_LIST_INCLUDE = {
  items: { include: { options: true } },
} satisfies Prisma.OrderInclude;

const ORDER_DETAIL_INCLUDE = {
  items: { include: { options: true } },
  statusHistory: { orderBy: { createdAt: 'asc' } },
  restaurant: true,
} satisfies Prisma.OrderInclude;

export type OrderWithItems = Prisma.OrderGetPayload<{
  include: typeof ORDER_LIST_INCLUDE;
}>;
export type OrderWithDetails = Prisma.OrderGetPayload<{
  include: typeof ORDER_DETAIL_INCLUDE;
}>;

const MAX_ORDER_CODE_ATTEMPTS = 5;

function sortToOrderBy(
  sort: string | undefined,
): Prisma.OrderOrderByWithRelationInput {
  switch (sort) {
    case 'placedAt':
      return { placedAt: 'asc' };
    case '-totalAmount':
      return { totalAmount: 'desc' };
    case 'totalAmount':
      return { totalAmount: 'asc' };
    default:
      return { placedAt: 'desc' };
  }
}

@Injectable()
export class OrdersRepository {
  constructor(private readonly prisma: PrismaService) {}

  // ─── Cart ──────────────────────────────────────────────────────────────

  findCartByCustomerId(customerId: string): Promise<CartWithItems | null> {
    return this.prisma.cart.findUnique({
      where: { customerId },
      include: { items: true },
    });
  }

  createCart(customerId: string, restaurantId: string) {
    return this.prisma.cart.create({ data: { customerId, restaurantId } });
  }

  createCartItem(
    cartId: string,
    item: {
      menuItemId: string;
      quantity: number;
      selectedOptions: string[];
      note?: string;
    },
  ) {
    return this.prisma.cartItem.create({
      data: {
        cartId,
        menuItemId: item.menuItemId,
        quantity: item.quantity,
        selectedOptions: item.selectedOptions,
        note: item.note,
      },
    });
  }

  findCartItemForCustomer(
    cartItemId: string,
    customerId: string,
  ): Promise<CartItemWithCart | null> {
    return this.prisma.cartItem.findFirst({
      where: { id: cartItemId, cart: { customerId } },
      include: { cart: true },
    });
  }

  updateCartItem(
    cartItemId: string,
    data: { quantity?: number; note?: string },
  ) {
    return this.prisma.cartItem.update({ where: { id: cartItemId }, data });
  }

  deleteCartItem(cartItemId: string): Promise<void> {
    return this.prisma.cartItem
      .delete({ where: { id: cartItemId } })
      .then(() => undefined);
  }

  countCartItems(cartId: string): Promise<number> {
    return this.prisma.cartItem.count({ where: { cartId } });
  }

  async deleteCartByCustomerId(customerId: string): Promise<void> {
    await this.prisma.$transaction([
      this.prisma.cartItem.deleteMany({ where: { cart: { customerId } } }),
      this.prisma.cart.deleteMany({ where: { customerId } }),
    ]);
  }

  async deleteCart(cartId: string): Promise<void> {
    await this.prisma.$transaction([
      this.prisma.cartItem.deleteMany({ where: { cartId } }),
      this.prisma.cart.delete({ where: { id: cartId } }),
    ]);
  }

  // ─── Orders ────────────────────────────────────────────────────────────

  async createOrder(data: {
    customerId: string;
    restaurantId: string;
    deliveryAddressId: string;
    note?: string;
    subtotal: number;
    deliveryFee: number;
    discountAmount: number;
    totalAmount: number;
    items: ResolvedOrderItem[];
  }): Promise<OrderWithDetails> {
    for (let attempt = 0; attempt < MAX_ORDER_CODE_ATTEMPTS; attempt++) {
      const orderCode = generateOrderCode();
      try {
        return await this.prisma.$transaction(async (tx) => {
          const order = await tx.order.create({
            data: {
              orderCode,
              customerId: data.customerId,
              restaurantId: data.restaurantId,
              deliveryAddressId: data.deliveryAddressId,
              status: OrderStatus.PENDING,
              subtotal: data.subtotal,
              deliveryFee: data.deliveryFee,
              discountAmount: data.discountAmount,
              totalAmount: data.totalAmount,
              version: 0,
              items: {
                create: data.items.map((item) => ({
                  menuItemId: item.menuItemId,
                  itemNameSnapshot: item.name,
                  itemPriceSnapshot: item.unitPrice,
                  quantity: item.quantity,
                  subtotal: item.unitPrice * item.quantity,
                  note: item.note,
                  options: {
                    create: item.options.map((option) => ({
                      optionNameSnapshot: option.name,
                      optionPriceSnapshot: option.extraPrice,
                    })),
                  },
                })),
              },
            },
            include: ORDER_DETAIL_INCLUDE,
          });

          await tx.orderStatusHistory.create({
            data: {
              orderId: order.id,
              status: OrderStatus.PENDING,
              changedBy: data.customerId,
              note: data.note,
            },
          });

          await tx.cartItem.deleteMany({
            where: { cart: { customerId: data.customerId } },
          });
          await tx.cart.deleteMany({ where: { customerId: data.customerId } });

          return order;
        });
      } catch (error) {
        const isDuplicateOrderCode =
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === 'P2002';
        if (isDuplicateOrderCode && attempt < MAX_ORDER_CODE_ATTEMPTS - 1)
          continue;
        throw error;
      }
    }
    throw new Error('Failed to generate a unique order code');
  }

  async findOrders(
    where: Prisma.OrderWhereInput,
    sort: string | undefined,
    skip: number,
    take: number,
  ): Promise<{ rows: OrderWithItems[]; total: number }> {
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.order.findMany({
        where,
        include: ORDER_LIST_INCLUDE,
        orderBy: sortToOrderBy(sort),
        skip,
        take,
      }),
      this.prisma.order.count({ where }),
    ]);
    return { rows, total };
  }

  findOrderById(id: string): Promise<OrderWithDetails | null> {
    return this.prisma.order.findUnique({
      where: { id },
      include: ORDER_DETAIL_INCLUDE,
    });
  }

  async advanceStatus(
    id: string,
    expectedVersion: number,
    newStatus: OrderStatus,
    changedBy: string,
    note?: string,
  ): Promise<OrderWithDetails | null> {
    return this.prisma.$transaction(async (tx) => {
      const result = await tx.order.updateMany({
        where: { id, version: expectedVersion },
        data: { status: newStatus, version: { increment: 1 } },
      });
      if (result.count === 0) return null;

      await tx.orderStatusHistory.create({
        data: { orderId: id, status: newStatus, changedBy, note },
      });
      return tx.order.findUnique({
        where: { id },
        include: ORDER_DETAIL_INCLUDE,
      });
    });
  }

  async cancelOrder(
    id: string,
    changedBy: string,
    reason: string,
  ): Promise<OrderWithDetails> {
    return this.prisma.$transaction(async (tx) => {
      await tx.order.update({
        where: { id },
        data: { status: OrderStatus.CANCELLED, version: { increment: 1 } },
      });
      await tx.orderStatusHistory.create({
        data: {
          orderId: id,
          status: OrderStatus.CANCELLED,
          changedBy,
          note: reason,
        },
      });
      return tx.order.findUniqueOrThrow({
        where: { id },
        include: ORDER_DETAIL_INCLUDE,
      });
    });
  }

  findManyByStatus(
    status: OrderStatus,
    take = 100,
  ): Promise<OrderWithDetails[]> {
    return this.prisma.order.findMany({
      where: { status },
      include: ORDER_DETAIL_INCLUDE,
      orderBy: { placedAt: 'asc' },
      take,
    });
  }

  assignDriver(orderId: string, driverId: string): Promise<OrderWithDetails> {
    return this.prisma.order.update({
      where: { id: orderId },
      data: { driverId },
      include: ORDER_DETAIL_INCLUDE,
    });
  }
}
