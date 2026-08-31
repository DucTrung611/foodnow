import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';
import type { StringValue } from 'ms';
import { RedisService } from '../../core/cache/redis.service';
import { UserStatus } from '../../generated/prisma/enums';
import { JwtPayload } from '../../shared/types/jwt-payload.type';
import { Role } from '../../shared/types/role.enum';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { toUserResponseDto } from './users.service';
import { UsersRepository } from './users.repository';

const REFRESH_KEY_PREFIX = 'refresh:';
const PASSWORD_HASH_ROUNDS = 10;

type RefreshTokenPayload = JwtPayload & { jti: string };

function asDuration(value: string): StringValue {
  return value as StringValue;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly redisService: RedisService,
  ) {}

  async register(dto: RegisterDto): Promise<UserResponseDto> {
    const existing = await this.usersRepository.findByEmailOrPhone(
      dto.email,
      dto.phone,
    );
    if (existing) {
      throw new ConflictException({
        code: 'USER_1010',
        message: 'Email or phone already registered',
      });
    }

    const passwordHash = await bcrypt.hash(dto.password, PASSWORD_HASH_ROUNDS);
    const status =
      dto.role === Role.CUSTOMER ? UserStatus.ACTIVE : UserStatus.PENDING;
    const user = await this.usersRepository.createUser({
      email: dto.email,
      phone: dto.phone,
      passwordHash,
      fullName: dto.fullName,
      role: dto.role,
      status,
    });
    return toUserResponseDto(user);
  }

  async login(dto: LoginDto): Promise<{
    accessToken: string;
    refreshToken: string;
    user: UserResponseDto;
  }> {
    const user = await this.usersRepository.findByEmail(dto.email);
    const passwordValid = user
      ? await bcrypt.compare(dto.password, user.passwordHash)
      : false;

    if (!user || !passwordValid || user.status === UserStatus.SUSPENDED) {
      throw new UnauthorizedException({
        code: 'AUTH_1002',
        message: 'Invalid credentials',
      });
    }

    const { accessToken, refreshToken } = await this.issueTokens(
      user.id,
      user.role,
    );
    return { accessToken, refreshToken, user: toUserResponseDto(user) };
  }

  /**
   * Also returns `user` (not just tokens) — the refresh_token cookie is
   * browser-wide, not per-tab, so a *different* tab logging in as a
   * different account silently rewrites this cookie too. Without `user`
   * here, a tab's next silent refresh would swap the token it holds in
   * memory to a different identity while its UI kept showing the old one
   * (UX-AUDIT-REPORT.md §0 "shared refresh token" — this is what the
   * frontend now checks to detect and react to that instead of silently
   * drifting).
   */
  async refresh(refreshToken: string | undefined): Promise<{
    accessToken: string;
    refreshToken: string;
    user: UserResponseDto;
  }> {
    if (!refreshToken) {
      throw new UnauthorizedException({
        code: 'AUTH_1001',
        message: 'Access token expired',
      });
    }

    let payload: RefreshTokenPayload;
    try {
      payload = await this.jwtService.verifyAsync<RefreshTokenPayload>(
        refreshToken,
        { secret: this.configService.get<string>('jwt.refreshSecret') },
      );
    } catch {
      throw new UnauthorizedException({
        code: 'AUTH_1001',
        message: 'Access token expired',
      });
    }

    const stored = await this.redisService.get(
      `${REFRESH_KEY_PREFIX}${payload.jti}`,
    );
    if (!stored || stored !== payload.sub) {
      throw new UnauthorizedException({
        code: 'AUTH_1001',
        message: 'Access token expired',
      });
    }

    const user = await this.usersRepository.findById(payload.sub);
    if (!user || user.status === UserStatus.SUSPENDED) {
      throw new UnauthorizedException({
        code: 'AUTH_1001',
        message: 'Access token expired',
      });
    }

    await this.redisService.del(`${REFRESH_KEY_PREFIX}${payload.jti}`);
    const tokens = await this.issueTokens(payload.sub, payload.role);
    return { ...tokens, user: toUserResponseDto(user) };
  }

  async logout(refreshToken: string | undefined): Promise<void> {
    if (!refreshToken) return;
    try {
      const payload = await this.jwtService.verifyAsync<RefreshTokenPayload>(
        refreshToken,
        { secret: this.configService.get<string>('jwt.refreshSecret') },
      );
      await this.redisService.del(`${REFRESH_KEY_PREFIX}${payload.jti}`);
    } catch {
      return;
    }
  }

  private async issueTokens(
    userId: string,
    role: Role,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const payload: JwtPayload = { sub: userId, role };

    const accessExpiresIn =
      this.configService.get<string>('jwt.accessExpiresIn') ?? '15m';
    const accessToken = await this.jwtService.signAsync(payload, {
      secret: this.configService.get<string>('jwt.accessSecret'),
      expiresIn: asDuration(accessExpiresIn),
    });

    const jti = randomUUID();
    const refreshExpiresIn =
      this.configService.get<string>('jwt.refreshExpiresIn') ?? '7d';
    const refreshToken = await this.jwtService.signAsync(
      { ...payload, jti },
      {
        secret: this.configService.get<string>('jwt.refreshSecret'),
        expiresIn: asDuration(refreshExpiresIn),
      },
    );

    await this.redisService.set(
      `${REFRESH_KEY_PREFIX}${jti}`,
      userId,
      'EX',
      this.parseExpiresInSeconds(refreshExpiresIn),
    );

    return { accessToken, refreshToken };
  }

  private parseExpiresInSeconds(expiresIn: string): number {
    const match = /^(\d+)([smhd])$/.exec(expiresIn);
    if (!match) return 7 * 24 * 60 * 60;
    const value = Number(match[1]);
    const unit = match[2];
    const unitSeconds = { s: 1, m: 60, h: 3600, d: 86400 }[unit] ?? 1;
    return value * unitSeconds;
  }
}
