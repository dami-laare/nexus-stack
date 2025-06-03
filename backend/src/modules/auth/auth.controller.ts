import { Body, Controller, Post, Res, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginRequest } from './dto/request.dto';
import { Response } from 'express';
import { AuthGuard } from 'src/libs/guards/auth.guard';

@Controller()
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  login(
    @Body() payload: LoginRequest,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.authService.login(payload, res);
  }

  @Post('logout')
  @UseGuards(AuthGuard)
  logout(@Res({ passthrough: true }) res: Response) {
    return this.authService.logout(res);
  }
}
