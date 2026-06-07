import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { HealthController } from './health/health.controller';
import { validateEnv } from './config/env.validation';
import { DatabaseModule } from './database/database.module';
import { TmdbModule } from './modules/tmdb/tmdb.module';
import { SyncModule } from './modules/sync/sync.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnv,
    }),
    ScheduleModule.forRoot(),
    DatabaseModule,
    TmdbModule,
    SyncModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
