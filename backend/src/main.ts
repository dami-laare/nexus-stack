import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { NestExpressApplication } from '@nestjs/platform-express';
import { Logger } from 'nestjs-pino';
import {
  ClassSerializerInterceptor,
  Logger as NestLogger,
  VersioningType,
} from '@nestjs/common';
import * as cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    cors: true,
  });
  app.use(cookieParser());

  const config = app.get(ConfigService);

  const port = config.get('server.port');

  app.useLogger(app.get(Logger));

  const logger = new NestLogger();

  app.enableShutdownHooks();

  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  app.useGlobalInterceptors(
    new ClassSerializerInterceptor(app.get(Reflector), {
      strategy: 'excludeAll',
      excludeExtraneousValues: true,
      enableImplicitConversion: true,
    }),
  );

  app.enableCors();

  await app.listen(port, () => {
    logger.log(`NEXUS STACK BACKEND SERVER LISTENING ON PORT ---> ${port}`);
  });
}
bootstrap();
