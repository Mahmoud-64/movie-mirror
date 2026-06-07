import { CacheModule } from '@nestjs/cache-manager';
import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { redisStore } from 'cache-manager-redis-yet';

@Global()
@Module({
  imports: [
    CacheModule.registerAsync({
      isGlobal: true,
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (config: ConfigService) => ({
        store: await redisStore({ url: config.getOrThrow<string>('REDIS_URL') }),
        ttl: config.get<number>('CACHE_TTL_SECONDS', 60) * 1000,
      }),
    }),
  ],
})
export class RedisCacheModule {}
