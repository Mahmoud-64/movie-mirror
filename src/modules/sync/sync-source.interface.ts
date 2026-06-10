import { TmdbMovieResult } from '../tmdb/tmdb.types';

export const MOVIE_SYNC_SOURCE = Symbol('MOVIE_SYNC_SOURCE');

export interface MovieSyncPage {
  movies: TmdbMovieResult[];
  totalPages: number;
}

export interface MovieSyncSource {
  readonly name: string;
  fetchPage(page: number): Promise<MovieSyncPage>;
}
