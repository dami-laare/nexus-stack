import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { AuthHelpers } from 'src/libs/utils/helpers/auth.helpers';

@Module({
  controllers: [AuthController],
  providers: [AuthService, AuthHelpers],
})
export class AuthModule {}
