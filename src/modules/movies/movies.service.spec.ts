import { ConflictException, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Genre } from '../genres/entities/genre.entity';
import { Movie } from './entities/movie.entity';
import { ListMoviesQueryDto, MovieSortBy, SortOrder } from './dto/list-movies-query.dto';
import { MoviesCache } from './movies.cache';
import { MoviesService } from './movies.service';

const buildMovie = (overrides: Partial<Movie> = {}): Movie => {
  const movie = new Movie();
  Object.assign(movie, {
    id: 'uuid-1',
    tmdbId: 1,
    title: 'Movie 1',
    overview: 'overview',
    releaseDate: '2024-01-01',
    posterPath: '/p.jpg',
    popularity: 10,
    ratingSum: 17,
    ratingCount: 2,
    genres: [{ id: 28, name: 'Action' }],
    ...overrides,
  });
  return movie;
};

describe('MoviesService', () => {
  let qb: Record<string, jest.Mock>;
  let repo: {
    createQueryBuilder: jest.Mock;
    findOne: jest.Mock;
    existsBy: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
    delete: jest.Mock;
  };
  let genres: { findBy: jest.Mock };
  let cache: { list: jest.Mock; detail: jest.Mock; invalidate: jest.Mock };
  let service: MoviesService;

  const query = (overrides: Partial<ListMoviesQueryDto> = {}): ListMoviesQueryDto => ({
    page: 1,
    limit: 20,
    sortBy: MovieSortBy.POPULARITY,
    order: SortOrder.DESC,
    ...overrides,
  });

  beforeEach(() => {
    qb = {
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getManyAndCount: jest.fn().mockResolvedValue([[buildMovie()], 1]),
    };
    repo = {
      createQueryBuilder: jest.fn().mockReturnValue(qb),
      findOne: jest.fn(),
      existsBy: jest.fn(),
      create: jest.fn((input) => Object.assign(new Movie(), input)),
      save: jest.fn((movie) => Promise.resolve(movie)),
      delete: jest.fn(),
    };
    genres = { findBy: jest.fn().mockResolvedValue([]) };
    cache = {
      list: jest.fn((_: string, factory: () => unknown) => factory()),
      detail: jest.fn((_: string, factory: () => unknown) => factory()),
      invalidate: jest.fn().mockResolvedValue(undefined),
    };
    service = new MoviesService(
      repo as unknown as Repository<Movie>,
      genres as unknown as Repository<Genre>,
      cache as unknown as MoviesCache,
    );
  });

  it('maps entities and computes pagination metadata', async () => {
    qb.getManyAndCount.mockResolvedValue([[buildMovie()], 41]);

    const result = await service.list(query({ limit: 20 }));

    expect(result.meta).toEqual({ page: 1, limit: 20, total: 41, totalPages: 3 });
    expect(result.data[0]).toMatchObject({
      title: 'Movie 1',
      averageRating: 8.5,
      ratingCount: 2,
      genres: [{ id: 28, name: 'Action' }],
    });
  });

  it('applies a case-insensitive title search filter', async () => {
    await service.list(query({ search: 'matrix' }));
    expect(qb.andWhere).toHaveBeenCalledWith('movie.title ILIKE :search', { search: '%matrix%' });
  });

  it('filters by genre ids via a join-table subquery', async () => {
    await service.list(query({ genres: [28, 53] }));
    expect(qb.andWhere).toHaveBeenCalledWith(expect.stringContaining('movie_genres'), {
      genreIds: [28, 53],
    });
  });

  it('orders by the rating expression when sorting by rating', async () => {
    await service.list(query({ sortBy: MovieSortBy.RATING, order: SortOrder.ASC }));
    expect(qb.orderBy).toHaveBeenCalledWith(
      'movie.ratingSum / NULLIF(movie.ratingCount, 0)',
      'ASC',
    );
  });

  it('paginates with skip/take derived from page and limit', async () => {
    await service.list(query({ page: 3, limit: 10 }));
    expect(qb.skip).toHaveBeenCalledWith(20);
    expect(qb.take).toHaveBeenCalledWith(10);
  });

  it('returns a single movie by id', async () => {
    repo.findOne.mockResolvedValue(buildMovie());
    await expect(service.findById('uuid-1')).resolves.toMatchObject({ id: 'uuid-1' });
  });

  it('throws NotFound when the movie does not exist', async () => {
    repo.findOne.mockResolvedValue(null);
    await expect(service.findById('missing')).rejects.toBeInstanceOf(NotFoundException);
  });

  describe('create', () => {
    it('persists a new movie with resolved genres and busts the cache', async () => {
      repo.existsBy.mockResolvedValue(false);
      genres.findBy.mockResolvedValue([{ id: 28, name: 'Action' }]);

      const result = await service.create({ tmdbId: 99, title: 'New', genreIds: [28] });

      expect(repo.save).toHaveBeenCalled();
      expect(result).toMatchObject({
        tmdbId: 99,
        title: 'New',
        genres: [{ id: 28, name: 'Action' }],
      });
      expect(cache.invalidate).toHaveBeenCalledWith();
    });

    it('rejects a duplicate tmdbId with a conflict', async () => {
      repo.existsBy.mockResolvedValue(true);
      await expect(service.create({ tmdbId: 1, title: 'Dup' })).rejects.toBeInstanceOf(
        ConflictException,
      );
    });
  });

  describe('update', () => {
    it('applies provided fields and invalidates the movie cache', async () => {
      repo.findOne.mockResolvedValue(buildMovie());
      const result = await service.update('uuid-1', { title: 'Renamed' });
      expect(result.title).toBe('Renamed');
      expect(cache.invalidate).toHaveBeenCalledWith('uuid-1');
    });

    it('updates every optional field including genres', async () => {
      repo.findOne.mockResolvedValue(buildMovie());
      genres.findBy.mockResolvedValue([{ id: 12, name: 'Adventure' }]);

      const result = await service.update('uuid-1', {
        title: 'T',
        overview: 'O',
        releaseDate: '2020-01-01',
        posterPath: '/x',
        popularity: 5,
        genreIds: [12],
      });

      expect(result).toMatchObject({
        title: 'T',
        overview: 'O',
        releaseDate: '2020-01-01',
        posterPath: '/x',
        popularity: 5,
        genres: [{ id: 12, name: 'Adventure' }],
      });
    });

    it('clears genres when an empty list is provided', async () => {
      repo.findOne.mockResolvedValue(buildMovie());
      const result = await service.update('uuid-1', { genreIds: [] });
      expect(result.genres).toEqual([]);
    });

    it('throws NotFound when updating a missing movie', async () => {
      repo.findOne.mockResolvedValue(null);
      await expect(service.update('missing', { title: 'x' })).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe('remove', () => {
    it('deletes and invalidates the cache', async () => {
      repo.delete.mockResolvedValue({ affected: 1 });
      await service.remove('uuid-1');
      expect(cache.invalidate).toHaveBeenCalledWith('uuid-1');
    });

    it('throws NotFound when nothing was deleted', async () => {
      repo.delete.mockResolvedValue({ affected: 0 });
      await expect(service.remove('missing')).rejects.toBeInstanceOf(NotFoundException);
    });
  });
});
