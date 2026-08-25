import type { Role, User } from '@/shared/types';

export type LoginPayload = {
  email: string;
  password: string;
};

export type LoginResponse = {
  accessToken: string;
  user: User;
};

export type RegisterPayload = {
  email: string;
  phone: string;
  password: string;
  fullName: string;
  role: Extract<Role, 'CUSTOMER' | 'VENDOR' | 'DRIVER'>;
};

export type UpdateProfilePayload = {
  fullName?: string;
  avatarUrl?: string;
};

export type Address = {
  id: string;
  label: string;
  streetAddress: string;
  lat: number;
  lng: number;
  isDefault: boolean;
  createdAt: string;
};

export type CreateAddressPayload = {
  label: string;
  streetAddress: string;
  lat: number;
  lng: number;
  isDefault?: boolean;
};
