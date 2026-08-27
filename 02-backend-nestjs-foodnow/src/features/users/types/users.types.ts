import { Role, UserStatus } from '../../../generated/prisma/enums';

/** Unscoped filter for `UsersService.listUsers` — access control is the caller's job. */
export type AdminUserFilter = {
  page?: number;
  limit?: number;
  status?: UserStatus;
  role?: Role;
  search?: string;
};
