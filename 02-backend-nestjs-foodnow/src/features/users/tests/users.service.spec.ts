/* eslint-disable @typescript-eslint/unbound-method -- jest mock assertions (expect(mock.method).toHaveBeenCalledWith) are always false positives for this rule */
import { Role, UserStatus } from '../../../generated/prisma/enums';
import { UsersService } from '../users.service';
import { AddressRow, UsersRepository } from '../users.repository';

describe('UsersService', () => {
  let usersService: UsersService;
  let usersRepository: jest.Mocked<UsersRepository>;

  beforeEach(() => {
    usersRepository = {
      findById: jest.fn(),
      updateProfile: jest.fn(),
      listAddresses: jest.fn(),
      findAddressById: jest.fn(),
      createAddress: jest.fn(),
      updateAddress: jest.fn(),
      clearDefaultAddress: jest.fn(),
      deleteAddress: jest.fn(),
    } as unknown as jest.Mocked<UsersRepository>;

    usersService = new UsersService(usersRepository);
  });

  describe('getProfile', () => {
    it('throws NotFoundException when the user does not exist', async () => {
      usersRepository.findById.mockResolvedValue(null);

      await expect(usersService.getProfile('missing-id')).rejects.toThrow(
        'User not found',
      );
    });

    it('maps the user to a response DTO without leaking passwordHash', async () => {
      usersRepository.findById.mockResolvedValue({
        id: 'user-1',
        email: 'a@test.com',
        phone: '0912345678',
        fullName: 'A',
        avatarUrl: null,
        role: Role.CUSTOMER,
        status: UserStatus.ACTIVE,
        createdAt: new Date('2026-01-01'),
        passwordHash: 'super-secret-hash',
      } as never);

      const result = await usersService.getProfile('user-1');

      expect(result).toEqual({
        id: 'user-1',
        email: 'a@test.com',
        phone: '0912345678',
        fullName: 'A',
        avatarUrl: null,
        role: Role.CUSTOMER,
        status: UserStatus.ACTIVE,
        createdAt: new Date('2026-01-01'),
      });
      expect(result).not.toHaveProperty('passwordHash');
    });
  });

  describe('updateProfile', () => {
    it('delegates to the repository and returns the mapped result', async () => {
      usersRepository.updateProfile.mockResolvedValue({
        id: 'user-1',
        email: 'a@test.com',
        phone: '0912345678',
        fullName: 'New Name',
        avatarUrl: 'https://example.com/avatar.png',
        role: Role.CUSTOMER,
        status: UserStatus.ACTIVE,
        createdAt: new Date('2026-01-01'),
        passwordHash: 'hash',
      } as never);

      const result = await usersService.updateProfile('user-1', {
        fullName: 'New Name',
      });

      expect(usersRepository.updateProfile).toHaveBeenCalledWith('user-1', {
        fullName: 'New Name',
      });
      expect(result.fullName).toBe('New Name');
    });
  });

  describe('listAddresses', () => {
    it('maps snake_case repository rows to camelCase response DTOs', async () => {
      const row: AddressRow = {
        id: 'addr-1',
        user_id: 'user-1',
        label: 'Home',
        street_address: '123 Main St',
        is_default: true,
        created_at: new Date('2026-01-01'),
        lat: 21.0245,
        lng: 105.8412,
      };
      usersRepository.listAddresses.mockResolvedValue([row]);

      const result = await usersService.listAddresses('user-1');

      expect(result).toEqual([
        {
          id: 'addr-1',
          label: 'Home',
          streetAddress: '123 Main St',
          lat: 21.0245,
          lng: 105.8412,
          isDefault: true,
          createdAt: row.created_at,
        },
      ]);
    });
  });

  describe('createAddress', () => {
    const dtoBase = {
      label: 'Home',
      streetAddress: '123 Main St',
      lat: 21.0245,
      lng: 105.8412,
    };

    const fakeRow: AddressRow = {
      id: 'addr-1',
      user_id: 'user-1',
      label: 'Home',
      street_address: '123 Main St',
      is_default: true,
      created_at: new Date('2026-01-01'),
      lat: 21.0245,
      lng: 105.8412,
    };

    it('clears the previous default before inserting when isDefault is true', async () => {
      usersRepository.createAddress.mockResolvedValue(fakeRow);

      await usersService.createAddress('user-1', {
        ...dtoBase,
        isDefault: true,
      });

      expect(usersRepository.clearDefaultAddress).toHaveBeenCalledWith(
        'user-1',
      );
      expect(usersRepository.createAddress).toHaveBeenCalledWith('user-1', {
        label: 'Home',
        streetAddress: '123 Main St',
        lat: 21.0245,
        lng: 105.8412,
        isDefault: true,
      });
    });

    it('does not touch existing defaults when isDefault is omitted, and defaults it to false', async () => {
      usersRepository.createAddress.mockResolvedValue({
        ...fakeRow,
        is_default: false,
      });

      await usersService.createAddress('user-1', dtoBase);

      expect(usersRepository.clearDefaultAddress).not.toHaveBeenCalled();
      expect(usersRepository.createAddress).toHaveBeenCalledWith('user-1', {
        ...dtoBase,
        isDefault: false,
      });
    });
  });

  describe('updateAddress', () => {
    const existingRow: AddressRow = {
      id: 'addr-1',
      user_id: 'user-1',
      label: 'Home',
      street_address: '123 Main St',
      is_default: false,
      created_at: new Date('2026-01-01'),
      lat: 21.0245,
      lng: 105.8412,
    };

    it('throws NotFoundException when the address does not belong to the user', async () => {
      usersRepository.findAddressById.mockResolvedValue(null);

      await expect(
        usersService.updateAddress('user-1', 'addr-1', { label: 'Work' }),
      ).rejects.toThrow('Address not found');
      expect(usersRepository.findAddressById).toHaveBeenCalledWith(
        'addr-1',
        'user-1',
      );
      expect(usersRepository.updateAddress).not.toHaveBeenCalled();
    });

    it('clears other defaults, excluding this address, when setting isDefault', async () => {
      usersRepository.findAddressById.mockResolvedValue(existingRow);
      usersRepository.updateAddress.mockResolvedValue({
        ...existingRow,
        is_default: true,
      });

      await usersService.updateAddress('user-1', 'addr-1', {
        isDefault: true,
      });

      // Excludes addr-1 itself — clearing without the exclusion would wipe
      // the isDefault flag this same call is about to set.
      expect(usersRepository.clearDefaultAddress).toHaveBeenCalledWith(
        'user-1',
        'addr-1',
      );
    });

    it('does not clear defaults when isDefault is not part of the update', async () => {
      usersRepository.findAddressById.mockResolvedValue(existingRow);
      usersRepository.updateAddress.mockResolvedValue(existingRow);

      await usersService.updateAddress('user-1', 'addr-1', {
        label: 'Work',
      });

      expect(usersRepository.clearDefaultAddress).not.toHaveBeenCalled();
    });
  });

  describe('deleteAddress', () => {
    it('throws NotFoundException when nothing was deleted (wrong owner or missing id)', async () => {
      usersRepository.deleteAddress.mockResolvedValue(false);

      await expect(
        usersService.deleteAddress('user-1', 'addr-1'),
      ).rejects.toThrow('Address not found');
      expect(usersRepository.deleteAddress).toHaveBeenCalledWith(
        'addr-1',
        'user-1',
      );
    });

    it('resolves without error when the address was deleted', async () => {
      usersRepository.deleteAddress.mockResolvedValue(true);

      await expect(
        usersService.deleteAddress('user-1', 'addr-1'),
      ).resolves.toBeUndefined();
    });
  });
});
