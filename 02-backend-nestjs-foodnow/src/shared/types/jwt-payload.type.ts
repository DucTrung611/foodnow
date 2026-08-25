import { Role } from './role.enum';

export type JwtPayload = {
  sub: string;
  role: Role;
};
