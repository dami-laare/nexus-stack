import { Global, Logger, Module } from '@nestjs/common';
import { CacheService } from './cache.service';
import { CacheModule } from '@nestjs/cache-manager';
import { createKeyv } from '@keyv/redis';
import { CacheableMemory } from 'cacheable';
import { ConfigService } from '@nestjs/config';

@Global()
@Module({
  providers: [CacheService, Logger],
  exports: [CacheService],
  imports: [
    CacheModule.registerAsync({
      useFactory: async (config: ConfigService) => {
        const ttl = config.get<number>('cache.ttl') ?? 60000;
        const redisUrl = config.get<string>('cache.url');

        if (redisUrl) {
          return {
            stores: [createKeyv(redisUrl)],
          };
        }

        // In-memory cache only
        return {
          store: new CacheableMemory({
            ttl,
            lruSize: 5000,
          }),
        };
      },
      inject: [ConfigService],
    }),
  ],
})
export class ICacheModule {}
