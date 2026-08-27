/* eslint-disable @typescript-eslint/unbound-method -- jest mock assertions (expect(mock.method).toHaveBeenCalledWith) are always false positives for this rule */
import { UserStatus } from '../../../generated/prisma/enums';
import { OrdersService } from '../../orders/orders.service';
import { UsersService } from '../../users/users.service';
import { AdminService } from '../admin.service';

describe('AdminService', () => {
  let service: AdminService;
  let usersService: jest.Mocked<UsersService>;
  let ordersService: jest.Mocked<OrdersService>;

  beforeEach(() => {
    usersService = {
      updateStatus: jest.fn(),
      listUsers: jest.fn(),
    } as unknown as jest.Mocked<UsersService>;
    ordersService = {
      listForAdmin: jest.fn(),
    } as unknown as jest.Mocked<OrdersService>;

    service = new AdminService(usersService, ordersService);
  });

  it('updateUserStatus delegates to UsersService.updateStatus', async () => {
    await service.updateUserStatus('user-1', { status: UserStatus.SUSPENDED });
    expect(usersService.updateStatus).toHaveBeenCalledWith(
      'user-1',
      UserStatus.SUSPENDED,
    );
  });

  it('listOrders delegates to OrdersService.listForAdmin', async () => {
    const query = { status: undefined, driverId: 'driver-1' };
    await service.listOrders(query);
    expect(ordersService.listForAdmin).toHaveBeenCalledWith(query);
  });

  it('listUsers delegates to UsersService.listUsers', async () => {
    const query = { status: UserStatus.PENDING, role: undefined };
    await service.listUsers(query);
    expect(usersService.listUsers).toHaveBeenCalledWith(query);
  });
});
