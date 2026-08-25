import { Role } from '../../../shared/types/role.enum';

export class UserEntity {
  id: string;
  email: string;
  phone: string;
  passwordHash: string;
  fullName: string;
  avatarUrl: string | null;
  role: Role;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}
