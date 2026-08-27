/* eslint-disable @typescript-eslint/unbound-method -- jest mock assertions (expect(mock.method).toHaveBeenCalledWith) are always false positives for this rule */
import { OrderStatus } from '../../../generated/prisma/enums';
import { Role } from '../../../shared/types/role.enum';
import { OrdersController } from '../orders.controller';
import { OrdersService } from '../orders.service';

describe('OrdersController', () => {
  let controller: OrdersController;
  let service: jest.Mocked<OrdersService>;
  const customer = { sub: 'customer-1', role: Role.CUSTOMER };
  const vendor = { sub: 'owner-1', role: Role.VENDOR };

  beforeEach(() => {
    service = {
      createOrder: jest.fn(),
      listOrders: jest.fn(),
      getOrderById: jest.fn(),
      updateStatus: jest.fn(),
      cancelOrder: jest.fn(),
    } as unknown as jest.Mocked<OrdersService>;

    controller = new OrdersController(service);
  });

  it('createOrder delegates with the caller id and dto', async () => {
    const dto = { restaurantId: 'r1', deliveryAddressId: 'a1', items: [] };
    await controller.createOrder(customer, dto);
    expect(service.createOrder).toHaveBeenCalledWith('customer-1', dto);
  });

  it('listOrders delegates with the full caller payload (role scoping needs the role)', async () => {
    const query = { page: 1 };
    await controller.listOrders(customer, query);
    expect(service.listOrders).toHaveBeenCalledWith(customer, query);
  });

  it('getOrderById delegates with the full caller payload and order id', async () => {
    await controller.getOrderById(vendor, 'order-1');
    expect(service.getOrderById).toHaveBeenCalledWith(vendor, 'order-1');
  });

  it('updateStatus delegates with the full caller payload, order id, and dto', async () => {
    const dto = { status: OrderStatus.CONFIRMED, version: 0 };
    await controller.updateStatus(vendor, 'order-1', dto);
    expect(service.updateStatus).toHaveBeenCalledWith(vendor, 'order-1', dto);
  });

  it('cancelOrder delegates with the full caller payload, order id, and dto', async () => {
    const dto = { reason: 'changed my mind' };
    await controller.cancelOrder(customer, 'order-1', dto);
    expect(service.cancelOrder).toHaveBeenCalledWith(customer, 'order-1', dto);
  });
});
