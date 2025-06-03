import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { isIn, isJSON } from 'class-validator';
import { NodeEnv } from '../types/common.types';

export class CacheUtil {
  private static service = 'nexus-stack';

  static ONE_HOUR = 60 * 60;
  static ONE_DAY = 60 * 60 * 24;
  static TEN_MINUTES = 60 * 10;

  public static getCacheKey(key: string, env: NodeEnv = 'development'): string {
    return `${env}:${CacheUtil.service}:${key?.trim()}`;
  }
}

@Injectable()
export class CacheService implements OnModuleDestroy {
  constructor(
    private readonly config: ConfigService,
    @Inject(CACHE_MANAGER) private redis: Cache,
    private readonly logger: Logger,
  ) {}

  onModuleDestroy() {
    this.redis.disconnect();
  }

  async get<T = any>(key: string): Promise<T> {
    const cacheKey = CacheUtil.getCacheKey(
      key,
      this.config.get<NodeEnv>('server.env'),
    );
    let data: any = await this.redis.get(cacheKey);
    if (data && isJSON(data)) {
      data = JSON.parse(data);
    }
    return data;
  }

  /**
   *
   * @param key The key to be used to cache the value
   * @param value The value to be cached
   * @param ttl TTL in milliseconds
   */
  async set(
    key: string,
    value:
      | Record<string, unknown>
      | Record<string, unknown>[]
      | string
      | number
      | any,
    ttl?: number,
  ): Promise<any> {
    const cacheKey = CacheUtil.getCacheKey(
      key,
      this.config.get<NodeEnv>('server.env'),
    );

    const data = isIn(typeof value, ['object']) ? JSON.stringify(value) : value;

    await this.redis.set(
      cacheKey,
      data,
      ttl || (this.config.get('cache.ttl') as number),
    );
  }

  async delete(key: string): Promise<any> {
    const cacheKey = CacheUtil.getCacheKey(
      key,
      this.config.get<NodeEnv>('server.env'),
    );
    this.logger.log('deleting key for: %s ', cacheKey);
    await this.redis.del(cacheKey);
  }

  async deleteMany(keys: string[]): Promise<void> {
    keys.forEach((key) => {
      this.delete(key);
    });
  }
}
