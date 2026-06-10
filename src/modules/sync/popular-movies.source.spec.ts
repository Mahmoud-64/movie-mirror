import { TmdbService } from '../tmdb/tmdb.service';
import { PopularMoviesSource } from './popular-movies.source';

describe('PopularMoviesSource', () => {
  it('maps a TMDB page into a MovieSyncPage', async () => {
    const tmdb = {
      getPopularMovies: jest.fn().mockResolvedValue({
        page: 2,
        results: [{ id: 1 }],
        total_pages: 7,
        total_results: 140,
      }),
    };
    const source = new PopularMoviesSource(tmdb as unknown as TmdbService);

    const result = await source.fetchPage(2);

    expect(source.name).toBe('popular');
    expect(tmdb.getPopularMovies).toHaveBeenCalledWith(2);
    expect(result).toEqual({ movies: [{ id: 1 }], totalPages: 7 });
  });
});
