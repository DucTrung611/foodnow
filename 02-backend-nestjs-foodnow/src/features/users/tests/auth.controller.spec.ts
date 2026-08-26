/* eslint-disable @typescript-eslint/unbound-method -- jest mock assertions (expect(mock.method).toHaveBeenCalledWith) are always false positives for this rule */
import { ConfigService } from '@nestjs/config';
import type { Request, Response } from 'express';
import { AuthController } from '../auth.controller';
import { AuthService } from '../auth.service';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: jest.Mocked<AuthService>;
  let configService: jest.Mocked<ConfigService>;
  let res: jest.Mocked<Response>;

  beforeEach(() => {
    authService = {
      register: jest.fn(),
      login: jest.fn(),
      refresh: jest.fn(),
      logout: jest.fn(),
    } as unknown as jest.Mocked<AuthService>;

    configService = {
      get: jest.fn().mockReturnValue('development'),
    } as unknown as jest.Mocked<ConfigService>;

    res = {
      cookie: jest.fn(),
      clearCookie: jest.fn(),
    } as unknown as jest.Mocked<Response>;

    controller = new AuthController(authService, configService);
  });

  describe('login', () => {
    // API_SPEC.md documents refreshToken in the login response body, but the
    // real contract (see features/users/context.md) is httpOnly-cookie-only —
    // this is the one thing that must never regress.
    it('never returns the refresh token in the response body', async () => {
      authService.login.mockResolvedValue({
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        user: { id: 'user-1' } as never,
      });

      const result = await controller.login(
        { email: 'a@test.com', password: 'pw' },
        res,
      );

      expect(result).toEqual({
        accessToken: 'access-token',
        user: { id: 'user-1' },
      });
      expect(result).not.toHaveProperty('refreshToken');
    });

    it('sets the refresh token as an httpOnly cookie', async () => {
      authService.login.mockResolvedValue({
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        user: { id: 'user-1' } as never,
      });

      await controller.login({ email: 'a@test.com', password: 'pw' }, res);

      expect(res.cookie).toHaveBeenCalledWith(
        'refreshToken',
        'refresh-token',
        expect.objectContaining({ httpOnly: true, sameSite: 'lax' }),
      );
    });
  });

  describe('refresh', () => {
    it('reads the refresh token from the cookie, not the body, and rotates it', async () => {
      authService.refresh.mockResolvedValue({
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
      });
      const req = {
        cookies: { refreshToken: 'old-refresh-token' },
      } as unknown as Request;

      const result = await controller.refresh(req, res);

      expect(authService.refresh).toHaveBeenCalledWith('old-refresh-token');
      expect(result).toEqual({ accessToken: 'new-access-token' });
      expect(res.cookie).toHaveBeenCalledWith(
        'refreshToken',
        'new-refresh-token',
        expect.any(Object),
      );
    });

    it('passes undefined to the service when no refresh cookie is present', async () => {
      authService.refresh.mockResolvedValue({
        accessToken: 'x',
        refreshToken: 'y',
      });
      const req = { cookies: {} } as unknown as Request;

      await controller.refresh(req, res);

      expect(authService.refresh).toHaveBeenCalledWith(undefined);
    });
  });

  describe('logout', () => {
    it('revokes the refresh token and clears the cookie', async () => {
      authService.logout.mockResolvedValue(undefined);
      const req = { cookies: { refreshToken: 'token' } } as unknown as Request;

      await controller.logout(req, res);

      expect(authService.logout).toHaveBeenCalledWith('token');
      expect(res.clearCookie).toHaveBeenCalledWith('refreshToken');
    });
  });
});
