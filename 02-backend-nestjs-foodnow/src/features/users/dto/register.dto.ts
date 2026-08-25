import { IsEmail, IsIn, IsString, Matches, MinLength } from 'class-validator';
import { Role } from '../../../shared/types/role.enum';

const SELF_REGISTERABLE_ROLES = [Role.CUSTOMER, Role.VENDOR, Role.DRIVER];

export class RegisterDto {
  @IsEmail()
  email: string;

  @Matches(/^(0|\+84)[0-9]{9,10}$/)
  phone: string;

  @IsString()
  @MinLength(8)
  password: string;

  @IsString()
  fullName: string;

  @IsIn(SELF_REGISTERABLE_ROLES)
  role: Role;
}
