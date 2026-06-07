import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Genre } from '../genres/entities/genre.entity';
import { Movie } from './entities/movie.entity';
import { MoviesCache } from './movies.cache';
import { MoviesController } from './movies.controller';
import { MoviesService } from './movies.service';

@Module({
  imports: [TypeOrmModule.forFeature([Movie, Genre])],
  controllers: [MoviesController],
  providers: [MoviesService, MoviesCache],
  exports: [MoviesService, MoviesCache],
})
export class MoviesModule {}
