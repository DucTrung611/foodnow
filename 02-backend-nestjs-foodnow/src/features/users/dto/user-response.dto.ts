import { Role } from '../../../shared/types/role.enum';

export class UserResponseDto {
  id: string;
  email: string;
  phone: string;
  fullName: string;
  avatarUrl: string | null;
  role: Role;
  status: string;
  createdAt: Date;
}
