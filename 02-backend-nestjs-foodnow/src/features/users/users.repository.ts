import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../core/database/prisma.service';
import { Prisma, User } from '../../generated/prisma/client';
import { Role, UserStatus } from '../../generated/prisma/enums';

export type AddressRow = {
  id: string;
  user_id: string;
  label: string;
  street_address: string;
  is_default: boolean;
  created_at: Date;
  lat: number;
  lng: number;
};

const ADDRESS_COLUMNS = Prisma.sql`
  id, user_id, label, street_address, is_default, created_at,
  ST_Y(location::geometry) AS lat, ST_X(location::geometry) AS lng
`;

@Injectable()
export class UsersRepository {
  constructor(private readonly prisma: PrismaService) {}

  findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { email } });
  }

  findByEmailOrPhone(email: string, phone: string): Promise<User | null> {
    return this.prisma.user.findFirst({
      where: { OR: [{ email }, { phone }] },
    });
  }

  findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { id } });
  }

  createUser(data: {
    email: string;
    phone: string;
    passwordHash: string;
    fullName: string;
    role: Role;
    status: UserStatus;
  }): Promise<User> {
    return this.prisma.user.create({ data });
  }

  updateProfile(
    id: string,
    data: { fullName?: string; avatarUrl?: string },
  ): Promise<User> {
    return this.prisma.user.update({ where: { id }, data });
  }

  updateStatus(id: string, status: UserStatus): Promise<User> {
    return this.prisma.user.update({ where: { id }, data: { status } });
  }

  async findMany(
    where: Prisma.UserWhereInput,
    skip: number,
    take: number,
  ): Promise<{ rows: User[]; total: number }> {
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      this.prisma.user.count({ where }),
    ]);
    return { rows, total };
  }

  listAddresses(userId: string): Promise<AddressRow[]> {
    return this.prisma.$queryRaw<AddressRow[]>`
      SELECT ${ADDRESS_COLUMNS}
      FROM addresses
      WHERE user_id = ${userId}
      ORDER BY is_default DESC, created_at DESC
    `;
  }

  async findAddressById(
    id: string,
    userId: string,
  ): Promise<AddressRow | null> {
    const rows = await this.prisma.$queryRaw<AddressRow[]>`
      SELECT ${ADDRESS_COLUMNS}
      FROM addresses
      WHERE id = ${id} AND user_id = ${userId}
    `;
    return rows[0] ?? null;
  }

  async createAddress(
    userId: string,
    dto: {
      label: string;
      streetAddress: string;
      lat: number;
      lng: number;
      isDefault: boolean;
    },
  ): Promise<AddressRow> {
    const rows = await this.prisma.$queryRaw<AddressRow[]>`
      INSERT INTO addresses (id, user_id, label, street_address, location, is_default, created_at, updated_at)
      VALUES (
        gen_random_uuid(), ${userId}, ${dto.label}, ${dto.streetAddress},
        ST_SetSRID(ST_MakePoint(${dto.lng}, ${dto.lat}), 4326)::geography,
        ${dto.isDefault}, now(), now()
      )
      RETURNING ${ADDRESS_COLUMNS}
    `;
    return rows[0];
  }

  async updateAddress(
    id: string,
    userId: string,
    dto: {
      label?: string;
      streetAddress?: string;
      lat?: number;
      lng?: number;
      isDefault?: boolean;
    },
  ): Promise<AddressRow | null> {
    const sets: Prisma.Sql[] = [];
    if (dto.label !== undefined) sets.push(Prisma.sql`label = ${dto.label}`);
    if (dto.streetAddress !== undefined) {
      sets.push(Prisma.sql`street_address = ${dto.streetAddress}`);
    }
    if (dto.isDefault !== undefined) {
      sets.push(Prisma.sql`is_default = ${dto.isDefault}`);
    }
    if (dto.lat !== undefined && dto.lng !== undefined) {
      sets.push(
        Prisma.sql`location = ST_SetSRID(ST_MakePoint(${dto.lng}, ${dto.lat}), 4326)::geography`,
      );
    }
    if (sets.length === 0) {
      return this.findAddressById(id, userId);
    }
    sets.push(Prisma.sql`updated_at = now()`);

    const rows = await this.prisma.$queryRaw<AddressRow[]>(Prisma.sql`
      UPDATE addresses
      SET ${Prisma.join(sets, ', ')}
      WHERE id = ${id} AND user_id = ${userId}
      RETURNING ${ADDRESS_COLUMNS}
    `);
    return rows[0] ?? null;
  }

  async clearDefaultAddress(userId: string, excludeId?: string): Promise<void> {
    if (excludeId) {
      await this.prisma.$executeRaw`
        UPDATE addresses SET is_default = false, updated_at = now()
        WHERE user_id = ${userId} AND id != ${excludeId}
      `;
    } else {
      await this.prisma.$executeRaw`
        UPDATE addresses SET is_default = false, updated_at = now()
        WHERE user_id = ${userId}
      `;
    }
  }

  async deleteAddress(id: string, userId: string): Promise<boolean> {
    const result = await this.prisma.$executeRaw`
      DELETE FROM addresses WHERE id = ${id} AND user_id = ${userId}
    `;
    return result > 0;
  }
}
