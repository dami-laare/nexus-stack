import {
  Controller,
  Get,
  SerializeOptions,
  VERSION_NEUTRAL,
} from '@nestjs/common';
import { AppService } from './app.service';

@Controller({ version: VERSION_NEUTRAL })
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('health')
  @SerializeOptions({ strategy: 'exposeAll' })
  health() {
    return this.appService.health();
  }
}
