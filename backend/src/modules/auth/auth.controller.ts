import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Res,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import {
  ForgotPasswordRequest,
  LoginRequest,
  ResetPasswordRequest,
  VerifyResetPasswordOtpRequest,
} from './dto/request.dto';
import { Response } from 'express';
import { AuthGuard } from 'src/libs/guards/auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(
    @Body() payload: LoginRequest,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.authService.login(payload, res);
  }

  @Post('logout')
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.OK)
  logout(@Res({ passthrough: true }) res: Response) {
    return this.authService.logout(res);
  }

  @Post('refresh')
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.OK)
  refresh(@Res({ passthrough: true }) res: Response) {
    return this.authService.refreshToken(res);
  }

  @Post('password/forgot')
  @HttpCode(HttpStatus.OK)
  initiateResetPassword(@Body() payload: ForgotPasswordRequest) {
    return this.authService.initiateResetPassword(payload);
  }

  @Post('password/forgot/otp')
  @HttpCode(HttpStatus.OK)
  validateInitiateResetPasswordOtp(
    @Body() payload: VerifyResetPasswordOtpRequest,
  ) {
    return this.authService.initiateResetPassword(payload);
  }

  @Post('password/reset')
  @HttpCode(HttpStatus.OK)
  resetPassword(@Body() payload: ResetPasswordRequest) {
    return this.authService.resetPassword(payload);
  }
}
