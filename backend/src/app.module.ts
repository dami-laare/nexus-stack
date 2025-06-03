import { Module, RequestMethod, VERSION_NEUTRAL } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { GlobalConfig } from 'src/libs/config/global.config';
import { GlobalConfigValidationSchema } from 'src/libs/config/config.validator';
import { LoggerModule } from 'nestjs-pino';
import { AuthModule } from './modules/auth/auth.module';
import { DatabaseModule } from './libs/database/database.module';
import { TeamModule } from './team/team.module';
import { RoleModule } from './role/role.module';

@Module({
  imports: [
    DatabaseModule,
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
    AuthModule,
    TeamModule,
    RoleModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
