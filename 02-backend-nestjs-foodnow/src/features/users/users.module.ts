import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UsersController } from './users.controller';
import { UsersRepository } from './users.repository';
import { UsersService } from './users.service';

@Module({
  controllers: [AuthController, UsersController],
  providers: [UsersService, AuthService, UsersRepository],
  exports: [UsersService],
})
export class UsersModule {}
