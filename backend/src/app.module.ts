import { Module, RequestMethod, VERSION_NEUTRAL } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { GlobalConfig } from 'libs/config/global.config';
import { GlobalConfigValidationSchema } from 'libs/config/config.validator';
import { LoggerModule } from 'nestjs-pino';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [GlobalConfig],
      validationSchema: GlobalConfigValidationSchema,
    }),
    LoggerModule.forRoot({
      pinoHttp: {
        transport: {
          target: 'pino-pretty',
          options: {
            singleLine: true,
          },
        },
      },
      exclude: [
        {
          method: RequestMethod.GET,
          path: '/health',
        },
        {
          method: RequestMethod.GET,
          path: '*/health',
          version: VERSION_NEUTRAL,
        },
      ],
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
