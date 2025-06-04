import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
  VERSION_NEUTRAL,
} from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { GlobalConfig } from 'src/libs/config/global.config';
import { GlobalConfigValidationSchema } from 'src/libs/config/config.validator';
import { LoggerModule } from 'nestjs-pino';
import { AuthModule } from './modules/auth/auth.module';
import { DatabaseModule } from './libs/database/database.module';
import { ICacheModule } from './libs/cache/cache.module';
import { TeamModule } from './modules/team/team.module';
import { RoleModule } from './modules/role/role.module';
import { UsersModule } from './modules/users/users.module';
import { RequestContextModule } from './libs/utils/services/request-context';
import { JwtModule } from '@nestjs/jwt';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import { GlobalExceptionFilter } from './libs/exceptions/exception.filter';
import { IValidationPipe } from './libs/pipes/validation.pipe';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { RequestInterceptor } from './libs/interceptors/request.interceptor';
import { RequestMiddleware } from './libs/middleware/request.middleware';
import { EventEmitterInterceptor } from './libs/interceptors/event-emitter.interceptor';

@Module({
  imports: [
    DatabaseModule,
    ICacheModule,
    RequestContextModule,
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 10,
      },
    ]),
    ConfigModule.forRoot({
      isGlobal: true,
      load: [GlobalConfig],
      validationSchema: GlobalConfigValidationSchema,
    }),
    JwtModule.registerAsync({
      useFactory: (config: ConfigService) => ({
        secret: config.get('jwt.secret'),
        signOptions: { expiresIn: config.get('jwt.expiresIn') },
      }),
      global: true,
      inject: [ConfigService],
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
    UsersModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter,
    },
    {
      provide: APP_PIPE,
      useClass: IValidationPipe,
    },
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    { provide: APP_INTERCEPTOR, useClass: RequestInterceptor },
    {
      provide: APP_INTERCEPTOR,
      useClass: EventEmitterInterceptor,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestMiddleware).exclude('v1/health').forRoutes('*');
  }
}
