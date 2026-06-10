import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TmdbService } from './tmdb.service';

@Module({
  imports: [
    HttpModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        baseURL: config.getOrThrow<string>('TMDB_API_BASE_URL'),
        timeout: 10_000,
        headers: {
          Authorization: `Bearer ${config.getOrThrow<string>('TMDB_API_TOKEN')}`,
        },
      }),
    }),
  ],
  providers: [TmdbService],
  exports: [TmdbService],
})
export class TmdbModule {}
