/* eslint-disable @typescript-eslint/unbound-method -- jest mock assertions (expect(mock.method).toHaveBeenCalledWith) are always false positives for this rule */
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Role } from '../../../shared/types/role.enum';
import { OrdersGateway } from '../orders.gateway';
import { OrderWithDetails, OrdersRepository } from '../orders.repository';

function makeClient(
  overrides: Partial<{ auth: Record<string, unknown> }> = {},
) {
  return {
    id: 'socket-1',
    handshake: { auth: overrides.auth ?? {} },
    data: {} as { user?: { sub: string; role: Role } },
    disconnect: jest.fn(),
    join: jest.fn(),
  };
}

describe('OrdersGateway', () => {
  let gateway: OrdersGateway;
  let repository: jest.Mocked<OrdersRepository>;
  let jwtService: jest.Mocked<JwtService>;
  let configService: jest.Mocked<ConfigService>;
  let server: { to: jest.Mock };
  let emit: jest.Mock;

  beforeEach(() => {
    repository = {
      findOrderById: jest.fn(),
    } as unknown as jest.Mocked<OrdersRepository>;
    jwtService = {
      verifyAsync: jest.fn(),
    } as unknown as jest.Mocked<JwtService>;
    configService = {
      get: jest.fn().mockReturnValue('secret'),
    } as unknown as jest.Mocked<ConfigService>;

    gateway = new OrdersGateway(repository, jwtService, configService);

    emit = jest.fn();
    server = { to: jest.fn().mockReturnValue({ emit }) };
    gateway.server = server as never;
  });

  describe('handleConnection', () => {
    it('disconnects a client with no token', async () => {
      const client = makeClient();

      await gateway.handleConnection(client as never);

      expect(client.disconnect).toHaveBeenCalledWith(true);
      expect(jwtService.verifyAsync).not.toHaveBeenCalled();
    });

    it('disconnects a client with an invalid token', async () => {
      jwtService.verifyAsync.mockRejectedValue(new Error('bad token'));
      const client = makeClient({ auth: { token: 'bad' } });

      await gateway.handleConnection(client as never);

      expect(client.disconnect).toHaveBeenCalledWith(true);
    });

    it('attaches the decoded payload to the socket for a valid token', async () => {
      const payload = { sub: 'customer-1', role: Role.CUSTOMER };
      jwtService.verifyAsync.mockResolvedValue(payload);
      const client = makeClient({ auth: { token: 'good' } });

      await gateway.handleConnection(client as never);

      expect(client.disconnect).not.toHaveBeenCalled();
      expect(client.data.user).toEqual(payload);
    });
  });

  describe('order:subscribe', () => {
    const order = {
      id: 'order-1',
      customerId: 'customer-1',
      driverId: null,
      restaurant: { ownerId: 'owner-1' },
    } as unknown as OrderWithDetails;

    it('does nothing when the socket has no authenticated user', async () => {
      const client = makeClient();

      await gateway.handleSubscribe(client as never, { orderId: 'order-1' });

      expect(repository.findOrderById).not.toHaveBeenCalled();
      expect(client.join).not.toHaveBeenCalled();
    });

    it('does nothing when the body has no orderId', async () => {
      const client = makeClient();
      client.data.user = { sub: 'customer-1', role: Role.CUSTOMER };

      await gateway.handleSubscribe(client as never, {});

      expect(client.join).not.toHaveBeenCalled();
    });

    it('does nothing when the order does not exist', async () => {
      repository.findOrderById.mockResolvedValue(null);
      const client = makeClient();
      client.data.user = { sub: 'customer-1', role: Role.CUSTOMER };

      await gateway.handleSubscribe(client as never, { orderId: 'order-1' });

      expect(client.join).not.toHaveBeenCalled();
    });

    it('does nothing when the caller has no access to the order', async () => {
      repository.findOrderById.mockResolvedValue(order);
      const client = makeClient();
      client.data.user = { sub: 'stranger', role: Role.CUSTOMER };

      await gateway.handleSubscribe(client as never, { orderId: 'order-1' });

      expect(client.join).not.toHaveBeenCalled();
    });

    it('joins the order room when the caller has access', async () => {
      repository.findOrderById.mockResolvedValue(order);
      const client = makeClient();
      client.data.user = { sub: 'customer-1', role: Role.CUSTOMER };

      await gateway.handleSubscribe(client as never, { orderId: 'order-1' });

      expect(client.join).toHaveBeenCalledWith('order:order-1');
    });
  });

  describe('emit methods', () => {
    const order = {
      id: 'order-1',
      orderCode: 'FN-260824-0001',
      status: 'CONFIRMED',
      version: 1,
      totalAmount: '73000.00',
      items: [{}, {}],
    } as never;

    it('emitOrderCreated targets the restaurant room', () => {
      gateway.emitOrderCreated('restaurant-1', order);

      expect(server.to).toHaveBeenCalledWith('restaurant:restaurant-1');
      expect(emit).toHaveBeenCalledWith('order:created', {
        orderId: 'order-1',
        orderCode: 'FN-260824-0001',
        totalAmount: '73000.00',
        itemCount: 2,
      });
    });

    it('emitStatusChanged targets the order room', () => {
      gateway.emitStatusChanged(order);

      expect(server.to).toHaveBeenCalledWith('order:order-1');
      expect(emit).toHaveBeenCalledWith(
        'order:status_changed',
        expect.objectContaining({
          orderId: 'order-1',
          status: 'CONFIRMED',
          version: 1,
        }),
      );
    });

    it('emitCancelled targets the order room', () => {
      gateway.emitCancelled(order, 'changed my mind', 'customer-1');

      expect(server.to).toHaveBeenCalledWith('order:order-1');
      expect(emit).toHaveBeenCalledWith('order:cancelled', {
        orderId: 'order-1',
        reason: 'changed my mind',
        cancelledBy: 'customer-1',
      });
    });
  });
});
