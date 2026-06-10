import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Genre } from '../genres/entities/genre.entity';
import { Movie } from '../movies/entities/movie.entity';
import { TmdbModule } from '../tmdb/tmdb.module';
import { PopularMoviesSource } from './popular-movies.source';
import { MOVIE_SYNC_SOURCE } from './sync-source.interface';
import { SyncService } from './sync.service';

@Module({
  imports: [TmdbModule, TypeOrmModule.forFeature([Movie, Genre])],
  providers: [SyncService, { provide: MOVIE_SYNC_SOURCE, useClass: PopularMoviesSource }],
  exports: [SyncService],
})
export class SyncModule {}
