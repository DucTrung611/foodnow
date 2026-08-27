import { Injectable, NotFoundException } from '@nestjs/common';
import { User } from '../../generated/prisma/client';
import { AddressResponseDto } from './dto/address-response.dto';
import { CreateAddressDto } from './dto/create-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { AddressRow, UsersRepository } from './users.repository';

export function toUserResponseDto(user: User): UserResponseDto {
  return {
    id: user.id,
    email: user.email,
    phone: user.phone,
    fullName: user.fullName,
    avatarUrl: user.avatarUrl,
    role: user.role,
    status: user.status,
    createdAt: user.createdAt,
  };
}

function toAddressResponseDto(row: AddressRow): AddressResponseDto {
  return {
    id: row.id,
    label: row.label,
    streetAddress: row.street_address,
    lat: row.lat,
    lng: row.lng,
    isDefault: row.is_default,
    createdAt: row.created_at,
  };
}

@Injectable()
export class UsersService {
  constructor(private readonly usersRepository: UsersRepository) {}

  async getProfile(userId: string): Promise<UserResponseDto> {
    const user = await this.usersRepository.findById(userId);
    if (!user) throw new NotFoundException('User not found');
    return toUserResponseDto(user);
  }

  async updateProfile(
    userId: string,
    dto: UpdateProfileDto,
  ): Promise<UserResponseDto> {
    const user = await this.usersRepository.updateProfile(userId, dto);
    return toUserResponseDto(user);
  }

  async listAddresses(userId: string): Promise<AddressResponseDto[]> {
    const rows = await this.usersRepository.listAddresses(userId);
    return rows.map(toAddressResponseDto);
  }

  async getAddressById(
    userId: string,
    addressId: string,
  ): Promise<AddressResponseDto> {
    const row = await this.usersRepository.findAddressById(addressId, userId);
    if (!row) throw new NotFoundException('Address not found');
    return toAddressResponseDto(row);
  }

  async createAddress(
    userId: string,
    dto: CreateAddressDto,
  ): Promise<AddressResponseDto> {
    if (dto.isDefault) {
      await this.usersRepository.clearDefaultAddress(userId);
    }
    const row = await this.usersRepository.createAddress(userId, {
      label: dto.label,
      streetAddress: dto.streetAddress,
      lat: dto.lat,
      lng: dto.lng,
      isDefault: dto.isDefault ?? false,
    });
    return toAddressResponseDto(row);
  }

  async updateAddress(
    userId: string,
    addressId: string,
    dto: UpdateAddressDto,
  ): Promise<AddressResponseDto> {
    const existing = await this.usersRepository.findAddressById(
      addressId,
      userId,
    );
    if (!existing) throw new NotFoundException('Address not found');

    if (dto.isDefault) {
      await this.usersRepository.clearDefaultAddress(userId, addressId);
    }
    const row = await this.usersRepository.updateAddress(
      addressId,
      userId,
      dto,
    );
    return toAddressResponseDto(row!);
  }

  async deleteAddress(userId: string, addressId: string): Promise<void> {
    const deleted = await this.usersRepository.deleteAddress(addressId, userId);
    if (!deleted) throw new NotFoundException('Address not found');
  }
}
