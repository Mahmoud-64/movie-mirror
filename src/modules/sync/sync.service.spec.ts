import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SchedulerRegistry } from '@nestjs/schedule';
import { CronJob } from 'cron';
import { Repository } from 'typeorm';
import { Genre } from '../genres/entities/genre.entity';
import { Movie } from '../movies/entities/movie.entity';
import { TmdbService } from '../tmdb/tmdb.service';
import { TmdbMovieResult } from '../tmdb/tmdb.types';
import { MovieSyncSource } from './sync-source.interface';
import { SyncService } from './sync.service';

jest.mock('cron', () => ({
  CronJob: jest.fn().mockImplementation(() => ({ start: jest.fn(), stop: jest.fn() })),
}));

const movieResult = (id: number, genreIds: number[] = [28]): TmdbMovieResult => ({
  id,
  title: `Movie ${id}`,
  overview: 'overview',
  release_date: '2024-01-01',
  poster_path: `/poster-${id}.jpg`,
  popularity: 12.3,
  genre_ids: genreIds,
});

describe('SyncService', () => {
  let tmdb: { getGenres: jest.Mock };
  let source: MovieSyncSource & { fetchPage: jest.Mock };
  let movies: jest.Mocked<
    Pick<Repository<Movie>, 'count' | 'find' | 'findOne' | 'create' | 'save'>
  >;
  let genres: jest.Mocked<Pick<Repository<Genre>, 'upsert' | 'find'>>;
  let scheduler: { addCronJob: jest.Mock };
  let service: SyncService;

  const config = { get: (_: string, fallback: unknown) => fallback } as unknown as ConfigService;

  beforeEach(() => {
    tmdb = { getGenres: jest.fn() };
    source = { name: 'popular', fetchPage: jest.fn() };
    movies = {
      count: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn((input) => ({ ...input }) as Movie),
      save: jest.fn((movie) => Promise.resolve(movie as Movie)),
    } as never;
    genres = { upsert: jest.fn(), find: jest.fn().mockResolvedValue([]) } as never;
    scheduler = { addCronJob: jest.fn() };

    service = new SyncService(
      tmdb as unknown as TmdbService,
      source,
      movies as unknown as Repository<Movie>,
      genres as unknown as Repository<Genre>,
      scheduler as unknown as SchedulerRegistry,
      config,
    );
  });

  it('upserts the genre taxonomy', async () => {
    tmdb.getGenres.mockResolvedValue([{ id: 28, name: 'Action' }]);

    await expect(service.syncGenres()).resolves.toBe(1);
    expect(genres.upsert).toHaveBeenCalledWith([{ id: 28, name: 'Action' }], ['id']);
  });

  it('skips upsert when no genres are returned', async () => {
    tmdb.getGenres.mockResolvedValue([]);

    await expect(service.syncGenres()).resolves.toBe(0);
    expect(genres.upsert).not.toHaveBeenCalled();
  });

  it('creates a new movie and resolves its genres', async () => {
    genres.find.mockResolvedValue([{ id: 28, name: 'Action' } as Genre]);
    movies.findOne.mockResolvedValue(null);
    source.fetchPage.mockResolvedValue({ movies: [movieResult(1)], totalPages: 1 });

    const synced = await service.syncMovies();

    expect(synced).toBe(1);
    expect(movies.create).toHaveBeenCalledWith({ tmdbId: 1 });
    const saved = movies.save.mock.calls[0][0] as Movie;
    expect(saved.title).toBe('Movie 1');
    expect(saved.genres).toEqual([{ id: 28, name: 'Action' }]);
  });

  it('is idempotent: updates the existing movie instead of creating a duplicate', async () => {
    const existing = { id: 'uuid', tmdbId: 1, ratingSum: 18, ratingCount: 2 } as Movie;
    genres.find.mockResolvedValue([]);
    movies.findOne.mockResolvedValue(existing);
    source.fetchPage.mockResolvedValue({ movies: [movieResult(1, [])], totalPages: 1 });

    await service.syncMovies();

    expect(movies.create).not.toHaveBeenCalled();
    const saved = movies.save.mock.calls[0][0] as Movie;
    expect(saved.id).toBe('uuid');
    expect(saved.ratingSum).toBe(18);
    expect(saved.ratingCount).toBe(2);
  });

  it('never fetches more than the configured page budget', async () => {
    genres.find.mockResolvedValue([]);
    movies.findOne.mockResolvedValue(null);
    source.fetchPage.mockResolvedValue({ movies: [movieResult(1, [])], totalPages: 999 });

    await service.syncMovies();

    expect(source.fetchPage).toHaveBeenCalledTimes(5);
  });

  it('schedules a cron job and triggers an initial sync when the catalogue is empty', async () => {
    movies.count.mockResolvedValue(0);
    const syncAll = jest.spyOn(service, 'syncAll').mockResolvedValue();

    await service.onApplicationBootstrap();

    expect(scheduler.addCronJob).toHaveBeenCalledWith('tmdb-sync', expect.anything());
    expect(syncAll).toHaveBeenCalled();
  });

  it('does not run an initial sync when the catalogue is already populated', async () => {
    movies.count.mockResolvedValue(42);
    const syncAll = jest.spyOn(service, 'syncAll').mockResolvedValue();

    await service.onApplicationBootstrap();

    expect(scheduler.addCronJob).toHaveBeenCalled();
    expect(syncAll).not.toHaveBeenCalled();
  });

  it('runs syncAll when the scheduled cron job fires', async () => {
    movies.count.mockResolvedValue(10);
    const syncAll = jest.spyOn(service, 'syncAll').mockResolvedValue();
    await service.onApplicationBootstrap();

    const cronCallback = (CronJob as unknown as jest.Mock).mock.calls.at(-1)![1] as () => void;
    cronCallback();

    expect(syncAll).toHaveBeenCalled();
  });

  it('logs when the initial or scheduled sync fails', async () => {
    const error = jest.spyOn(Logger.prototype, 'error').mockImplementation();
    movies.count.mockResolvedValue(0);
    jest.spyOn(service, 'syncAll').mockRejectedValue(new Error('boom'));

    await service.onApplicationBootstrap();
    const cronCallback = (CronJob as unknown as jest.Mock).mock.calls.at(-1)![1] as () => void;
    cronCallback();
    await new Promise((resolve) => setImmediate(resolve));

    expect(error).toHaveBeenCalledWith('Initial sync failed', expect.any(Error));
    expect(error).toHaveBeenCalledWith('Scheduled sync failed', expect.any(Error));
  });

  it('normalises missing optional fields and drops unknown genres', async () => {
    genres.find.mockResolvedValue([{ id: 28, name: 'Action' } as Genre]);
    movies.findOne.mockResolvedValue(null);
    source.fetchPage.mockResolvedValue({
      movies: [
        {
          id: 7,
          title: 'Sparse',
          overview: '',
          release_date: '',
          poster_path: null,
          popularity: undefined as never,
          genre_ids: [28, 999],
        },
      ],
      totalPages: 1,
    });

    await service.syncMovies();

    const saved = movies.save.mock.calls[0][0] as Movie;
    expect(saved.overview).toBeNull();
    expect(saved.releaseDate).toBeNull();
    expect(saved.popularity).toBe(0);
    expect(saved.genres).toEqual([{ id: 28, name: 'Action' }]);
  });
});
