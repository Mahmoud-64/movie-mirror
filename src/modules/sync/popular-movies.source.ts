import { Injectable } from '@nestjs/common';
import { TmdbService } from '../tmdb/tmdb.service';
import { MovieSyncPage, MovieSyncSource } from './sync-source.interface';

@Injectable()
export class PopularMoviesSource implements MovieSyncSource {
  readonly name = 'popular';

  constructor(private readonly tmdb: TmdbService) {}

  async fetchPage(page: number): Promise<MovieSyncPage> {
    const data = await this.tmdb.getPopularMovies(page);
    return { movies: data.results, totalPages: data.total_pages };
  }
}
