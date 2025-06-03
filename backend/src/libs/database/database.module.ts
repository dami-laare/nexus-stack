import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { join } from 'path';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      useFactory: (config: ConfigService) => {
        return {
          ...(config.get('typeorm') as any),
          type: 'postgres',
          entities: [join(__dirname, 'entities', '*{.ts,.js}')],
          synchronize: false,
          namingStrategy: new SnakeNamingStrategy(),
          ssl:
            process.env.DB_USE_SSL === 'true'
              ? {
                  rejectUnauthorized: false,
                }
              : false,
        };
      },
      inject: [ConfigService],
    }),
  ],
})
export class DatabaseModule {}
