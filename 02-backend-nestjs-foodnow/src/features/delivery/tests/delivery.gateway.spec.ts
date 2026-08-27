/* eslint-disable @typescript-eslint/unbound-method -- jest mock assertions (expect(mock.method).toHaveBeenCalledWith) are always false positives for this rule */
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Role } from '../../../shared/types/role.enum';
import { AddressResponseDto } from '../../users/dto/address-response.dto';
import { UsersService } from '../../users/users.service';
import { OrderResponseDto } from '../../orders/dto/order-response.dto';
import { OrdersService } from '../../orders/orders.service';
import { DeliveryGateway } from '../delivery.gateway';
import { DeliveryRepository } from '../delivery.repository';

function makeClient(
  overrides: Partial<{ auth: Record<string, unknown> }> = {},
) {
  return {
    id: 'socket-1',
    handshake: { auth: overrides.auth ?? {} },
    data: {} as { user?: { sub: string; role: Role } },
    disconnect: jest.fn(),
  };
}

describe('DeliveryGateway', () => {
  let gateway: DeliveryGateway;
  let repository: jest.Mocked<DeliveryRepository>;
  let ordersService: jest.Mocked<OrdersService>;
  let usersService: jest.Mocked<UsersService>;
  let jwtService: jest.Mocked<JwtService>;
  let configService: jest.Mocked<ConfigService>;
  let server: { to: jest.Mock };
  let emit: jest.Mock;

  beforeEach(() => {
    repository = {
      findByOrderId: jest.fn(),
      createLocation: jest.fn(),
    } as unknown as jest.Mocked<DeliveryRepository>;
    ordersService = {
      getOrderUnchecked: jest.fn(),
    } as unknown as jest.Mocked<OrdersService>;
    usersService = {
      getAddressById: jest.fn(),
    } as unknown as jest.Mocked<UsersService>;
    jwtService = {
      verifyAsync: jest.fn(),
    } as unknown as jest.Mocked<JwtService>;
    configService = {
      get: jest.fn((key: string, def?: number) => {
        if (key === 'delivery.averageSpeedKmh') return 30;
        return def ?? 'secret';
      }),
    } as unknown as jest.Mocked<ConfigService>;

    gateway = new DeliveryGateway(
      repository,
      ordersService,
      usersService,
      configService,
      jwtService,
    );

    emit = jest.fn();
    server = { to: jest.fn().mockReturnValue({ emit }) };
    gateway.server = server as never;
  });

  describe('handleConnection', () => {
    it('disconnects a client with no token', async () => {
      const client = makeClient();
      await gateway.handleConnection(client as never);
      expect(client.disconnect).toHaveBeenCalledWith(true);
    });

    it('disconnects a client with an invalid token', async () => {
      jwtService.verifyAsync.mockRejectedValue(new Error('bad token'));
      const client = makeClient({ auth: { token: 'bad' } });
      await gateway.handleConnection(client as never);
      expect(client.disconnect).toHaveBeenCalledWith(true);
    });

    it('attaches the decoded payload for a valid token', async () => {
      const payload = { sub: 'driver-1', role: Role.DRIVER };
      jwtService.verifyAsync.mockResolvedValue(payload);
      const client = makeClient({ auth: { token: 'good' } });
      await gateway.handleConnection(client as never);
      expect(client.disconnect).not.toHaveBeenCalled();
      expect(client.data.user).toEqual(payload);
    });
  });

  describe('driver:location_update', () => {
    it('does nothing without an authenticated user', async () => {
      const client = makeClient();
      await gateway.handleLocationUpdate(client as never, {
        lat: 21.02,
        lng: 105.84,
      });
      expect(repository.createLocation).not.toHaveBeenCalled();
    });

    it('does nothing when lat/lng are missing', async () => {
      const client = makeClient();
      client.data.user = { sub: 'driver-1', role: Role.DRIVER };
      await gateway.handleLocationUpdate(client as never, {});
      expect(repository.createLocation).not.toHaveBeenCalled();
    });

    it('persists the location without broadcasting when no orderId is given', async () => {
      const client = makeClient();
      client.data.user = { sub: 'driver-1', role: Role.DRIVER };

      await gateway.handleLocationUpdate(client as never, {
        lat: 21.02,
        lng: 105.84,
      });

      expect(repository.createLocation).toHaveBeenCalledWith('driver-1', {
        lat: 21.02,
        lng: 105.84,
        deliveryId: undefined,
      });
      expect(emit).not.toHaveBeenCalled();
    });

    it('resolves the delivery id, persists, and broadcasts delivery:location', async () => {
      const client = makeClient();
      client.data.user = { sub: 'driver-1', role: Role.DRIVER };
      repository.findByOrderId.mockResolvedValue({ id: 'delivery-1' } as never);
      ordersService.getOrderUnchecked.mockResolvedValue({
        customerId: 'customer-1',
        deliveryAddressId: 'address-1',
      } as OrderResponseDto);
      usersService.getAddressById.mockResolvedValue({
        lat: 21.03,
        lng: 105.85,
      } as AddressResponseDto);

      await gateway.handleLocationUpdate(client as never, {
        lat: 21.02,
        lng: 105.84,
        orderId: 'order-1',
      });

      expect(repository.createLocation).toHaveBeenCalledWith('driver-1', {
        lat: 21.02,
        lng: 105.84,
        deliveryId: 'delivery-1',
      });
      expect(server.to).toHaveBeenCalledWith('order:order-1');
      expect(emit).toHaveBeenCalledWith(
        'delivery:location',
        expect.objectContaining({
          orderId: 'order-1',
          lat: 21.02,
          lng: 105.84,
        }),
      );
    });

    it('swallows a broadcast failure without throwing', async () => {
      const client = makeClient();
      client.data.user = { sub: 'driver-1', role: Role.DRIVER };
      repository.findByOrderId.mockResolvedValue(null);
      ordersService.getOrderUnchecked.mockRejectedValue(new Error('not found'));

      await expect(
        gateway.handleLocationUpdate(client as never, {
          lat: 21.02,
          lng: 105.84,
          orderId: 'order-1',
        }),
      ).resolves.toBeUndefined();
      expect(emit).not.toHaveBeenCalled();
    });
  });

  describe('emit methods', () => {
    it('emitDeliveryAssigned targets the order room', () => {
      gateway.emitDeliveryAssigned('order-1', {
        deliveryId: 'delivery-1',
        driver: { id: 'driver-1', fullName: 'Driver One', phone: '0900000000' },
      });
      expect(server.to).toHaveBeenCalledWith('order:order-1');
      expect(emit).toHaveBeenCalledWith(
        'delivery:assigned',
        expect.any(Object),
      );
    });

    it('emitNewOffer targets the driver room', () => {
      gateway.emitNewOffer('driver-1', {
        orderId: 'order-1',
        distanceMeters: 1200,
        estimatedEarning: '18000.00',
        expiresAt: '2026-08-24T10:31:00.000Z',
      });
      expect(server.to).toHaveBeenCalledWith('driver:driver-1');
      expect(emit).toHaveBeenCalledWith('driver:new_offer', expect.any(Object));
    });
  });
});
