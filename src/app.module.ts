import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { HealthController } from './health/health.controller';
import { validateEnv } from './config/env.validation';
import { DatabaseModule } from './database/database.module';
import { LoggingModule } from './common/logging/logging.module';
import { RedisCacheModule } from './common/cache/redis-cache.module';
import { TmdbModule } from './modules/tmdb/tmdb.module';
import { SyncModule } from './modules/sync/sync.module';
import { MoviesModule } from './modules/movies/movies.module';
import { GenresModule } from './modules/genres/genres.module';
import { RatingsModule } from './modules/ratings/ratings.module';
import { WatchlistModule } from './modules/watchlist/watchlist.module';
import { AuthModule } from './modules/auth/auth.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnv,
    }),
    ScheduleModule.forRoot(),
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 100 }]),
    LoggingModule,
    RedisCacheModule,
    DatabaseModule,
    TmdbModule,
    SyncModule,
    MoviesModule,
    GenresModule,
    RatingsModule,
    WatchlistModule,
    AuthModule,
  ],
  controllers: [HealthController],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
