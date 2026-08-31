/* eslint-disable @typescript-eslint/unbound-method -- jest mock assertions (expect(mock.method).toHaveBeenCalledWith) are always false positives for this rule */
import { UserStatus } from '../../../generated/prisma/enums';
import { AdminController } from '../admin.controller';
import { AdminService } from '../admin.service';

describe('AdminController', () => {
  let controller: AdminController;
  let service: jest.Mocked<AdminService>;

  beforeEach(() => {
    service = {
      updateUserStatus: jest.fn(),
      listOrders: jest.fn(),
      listUsers: jest.fn(),
      listRestaurants: jest.fn(),
    } as unknown as jest.Mocked<AdminService>;

    controller = new AdminController(service);
  });

  it('updateUserStatus delegates the id and dto to the service', async () => {
    await controller.updateUserStatus('user-1', { status: UserStatus.ACTIVE });
    expect(service.updateUserStatus).toHaveBeenCalledWith('user-1', {
      status: UserStatus.ACTIVE,
    });
  });

  it('listOrders delegates the query to the service', async () => {
    const query = { status: undefined, restaurantId: 'restaurant-1' };
    await controller.listOrders(query);
    expect(service.listOrders).toHaveBeenCalledWith(query);
  });

  it('listUsers delegates the query to the service', async () => {
    const query = { status: UserStatus.PENDING, role: undefined };
    await controller.listUsers(query);
    expect(service.listUsers).toHaveBeenCalledWith(query);
  });

  it('listRestaurants delegates the query to the service', async () => {
    const query = { search: 'Phở' };
    await controller.listRestaurants(query);
    expect(service.listRestaurants).toHaveBeenCalledWith(query);
  });
});
