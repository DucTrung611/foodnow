/* eslint-disable @typescript-eslint/unbound-method -- jest mock assertions (expect(mock.method).toHaveBeenCalledWith) are always false positives for this rule */
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { RedisService } from '../../../core/cache/redis.service';
import { UserStatus } from '../../../generated/prisma/enums';
import { Role } from '../../../shared/types/role.enum';
import { AuthService } from '../auth.service';
import { UsersRepository } from '../users.repository';

describe('AuthService', () => {
  let authService: AuthService;
  let usersRepository: jest.Mocked<UsersRepository>;
  let jwtService: jest.Mocked<JwtService>;
  let redisService: jest.Mocked<RedisService>;

  beforeEach(() => {
    usersRepository = {
      findByEmailOrPhone: jest.fn(),
      findByEmail: jest.fn(),
      findById: jest.fn(),
      createUser: jest.fn(),
    } as unknown as jest.Mocked<UsersRepository>;

    jwtService = {
      signAsync: jest.fn().mockResolvedValue('signed-token'),
      verifyAsync: jest.fn(),
    } as unknown as jest.Mocked<JwtService>;

    redisService = {
      set: jest.fn(),
      get: jest.fn(),
      del: jest.fn(),
    } as unknown as jest.Mocked<RedisService>;

    const configService = {
      get: jest.fn((key: string) => {
        const values: Record<string, string> = {
          'jwt.accessSecret': 'access-secret',
          'jwt.accessExpiresIn': '15m',
          'jwt.refreshSecret': 'refresh-secret',
          'jwt.refreshExpiresIn': '7d',
        };
        return values[key];
      }),
    } as unknown as ConfigService;

    authService = new AuthService(
      usersRepository,
      jwtService,
      configService,
      redisService,
    );
  });

  describe('register', () => {
    it('throws ConflictException with USER_1010 when email or phone already exists', async () => {
      usersRepository.findByEmailOrPhone.mockResolvedValue({
        id: 'existing-id',
      } as never);

      await expect(
        authService.register({
          email: 'a@test.com',
          phone: '0912345678',
          password: 'password123',
          fullName: 'A',
          role: Role.CUSTOMER,
        }),
      ).rejects.toMatchObject(
        new ConflictException({
          code: 'USER_1010',
          message: 'Email or phone already registered',
        }),
      );
    });

    it('creates a CUSTOMER with ACTIVE status and a VENDOR with PENDING status', async () => {
      usersRepository.findByEmailOrPhone.mockResolvedValue(null);
      usersRepository.createUser.mockImplementation((data) =>
        Promise.resolve({ ...data, id: 'new-id', avatarUrl: null } as never),
      );

      await authService.register({
        email: 'customer@test.com',
        phone: '0912345678',
        password: 'password123',
        fullName: 'Customer',
        role: Role.CUSTOMER,
      });
      expect(usersRepository.createUser).toHaveBeenCalledWith(
        expect.objectContaining({ status: UserStatus.ACTIVE }),
      );

      await authService.register({
        email: 'vendor@test.com',
        phone: '0987654321',
        password: 'password123',
        fullName: 'Vendor',
        role: Role.VENDOR,
      });
      expect(usersRepository.createUser).toHaveBeenCalledWith(
        expect.objectContaining({ status: UserStatus.PENDING }),
      );
    });
  });

  describe('login', () => {
    it('throws UnauthorizedException with AUTH_1002 when the user does not exist', async () => {
      usersRepository.findByEmail.mockResolvedValue(null);

      await expect(
        authService.login({ email: 'nobody@test.com', password: 'x' }),
      ).rejects.toMatchObject(
        new UnauthorizedException({
          code: 'AUTH_1002',
          message: 'Invalid credentials',
        }),
      );
    });

    it('throws UnauthorizedException with AUTH_1002 when the password is wrong', async () => {
      const passwordHash = await bcrypt.hash('correct-password', 10);
      usersRepository.findByEmail.mockResolvedValue({
        id: 'user-id',
        passwordHash,
        status: UserStatus.ACTIVE,
        role: Role.CUSTOMER,
      } as never);

      await expect(
        authService.login({ email: 'a@test.com', password: 'wrong-password' }),
      ).rejects.toMatchObject(
        new UnauthorizedException({
          code: 'AUTH_1002',
          message: 'Invalid credentials',
        }),
      );
    });

    it('throws UnauthorizedException with AUTH_1002 for a suspended account', async () => {
      const passwordHash = await bcrypt.hash('correct-password', 10);
      usersRepository.findByEmail.mockResolvedValue({
        id: 'user-id',
        passwordHash,
        status: UserStatus.SUSPENDED,
        role: Role.CUSTOMER,
      } as never);

      await expect(
        authService.login({
          email: 'a@test.com',
          password: 'correct-password',
        }),
      ).rejects.toMatchObject(
        new UnauthorizedException({
          code: 'AUTH_1002',
          message: 'Invalid credentials',
        }),
      );
    });

    it('issues a token pair and stores the refresh JTI in Redis on success', async () => {
      const passwordHash = await bcrypt.hash('correct-password', 10);
      usersRepository.findByEmail.mockResolvedValue({
        id: 'user-id',
        email: 'a@test.com',
        phone: '0912345678',
        fullName: 'A',
        avatarUrl: null,
        passwordHash,
        status: UserStatus.ACTIVE,
        role: Role.CUSTOMER,
        createdAt: new Date(),
      } as never);

      const result = await authService.login({
        email: 'a@test.com',
        password: 'correct-password',
      });

      expect(result.accessToken).toBe('signed-token');
      expect(result.refreshToken).toBe('signed-token');
      expect(redisService.set).toHaveBeenCalledWith(
        expect.stringMatching(/^refresh:/),
        'user-id',
        'EX',
        expect.any(Number),
      );
    });
  });

  describe('refresh', () => {
    const refreshPayload = { sub: 'user-id', role: Role.CUSTOMER, jti: 'jti-1' };

    it('throws AUTH_1001 when no refresh token is given', async () => {
      await expect(authService.refresh(undefined)).rejects.toMatchObject(
        new UnauthorizedException({
          code: 'AUTH_1001',
          message: 'Access token expired',
        }),
      );
    });

    it('throws AUTH_1001 when the stored JTI does not match (revoked/reused token)', async () => {
      jwtService.verifyAsync.mockResolvedValue(refreshPayload as never);
      redisService.get.mockResolvedValue(null);

      await expect(authService.refresh('token')).rejects.toMatchObject(
        new UnauthorizedException({
          code: 'AUTH_1001',
          message: 'Access token expired',
        }),
      );
    });

    it('throws AUTH_1001 when the user backing the token was suspended after the token was issued', async () => {
      jwtService.verifyAsync.mockResolvedValue(refreshPayload as never);
      redisService.get.mockResolvedValue('user-id');
      usersRepository.findById.mockResolvedValue({
        id: 'user-id',
        status: UserStatus.SUSPENDED,
      } as never);

      await expect(authService.refresh('token')).rejects.toMatchObject(
        new UnauthorizedException({
          code: 'AUTH_1001',
          message: 'Access token expired',
        }),
      );
    });

    // The frontend compares this against its currently-held user to detect
    // a cross-tab identity swap on the shared refresh cookie — it must
    // reflect whoever the token now actually belongs to, not be omitted.
    it('returns the current user alongside a fresh token pair', async () => {
      jwtService.verifyAsync.mockResolvedValue(refreshPayload as never);
      redisService.get.mockResolvedValue('user-id');
      usersRepository.findById.mockResolvedValue({
        id: 'user-id',
        email: 'a@test.com',
        phone: '0912345678',
        fullName: 'A',
        avatarUrl: null,
        status: UserStatus.ACTIVE,
        role: Role.CUSTOMER,
        createdAt: new Date(),
      } as never);

      const result = await authService.refresh('token');

      expect(result.accessToken).toBe('signed-token');
      expect(result.user).toMatchObject({ id: 'user-id', email: 'a@test.com' });
      expect(redisService.del).toHaveBeenCalledWith('refresh:jti-1');
    });
  });
});
