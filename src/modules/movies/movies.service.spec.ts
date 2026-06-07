import { NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
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
  let repo: { createQueryBuilder: jest.Mock; findOne: jest.Mock };
  let service: MoviesService;
  const passthroughCache = {
    list: (_: string, factory: () => unknown) => factory(),
    detail: (_: string, factory: () => unknown) => factory(),
  } as unknown as MoviesCache;

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
    repo = { createQueryBuilder: jest.fn().mockReturnValue(qb), findOne: jest.fn() };
    service = new MoviesService(repo as unknown as Repository<Movie>, passthroughCache);
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
    expect(qb.orderBy).toHaveBeenCalledWith('movie.ratingSum / NULLIF(movie.ratingCount, 0)', 'ASC');
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
});
