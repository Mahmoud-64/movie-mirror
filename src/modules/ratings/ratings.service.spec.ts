import { NotFoundException } from '@nestjs/common';
import { DataSource, EntityManager } from 'typeorm';
import { Movie } from '../movies/entities/movie.entity';
import { MoviesCache } from '../movies/movies.cache';
import { Rating } from './entities/rating.entity';
import { UsersService } from '../users/users.service';
import { RatingsService } from './ratings.service';

describe('RatingsService', () => {
  let manager: {
    findOne: jest.Mock;
    findOneOrFail: jest.Mock;
    save: jest.Mock;
    create: jest.Mock;
    createQueryBuilder: jest.Mock;
  };
  let update: { set: jest.Mock; where: jest.Mock; execute: jest.Mock };
  let users: { ensureExists: jest.Mock };
  let cache: { invalidate: jest.Mock };
  let service: RatingsService;

  const movie = (sum: number, count: number): Movie =>
    Object.assign(new Movie(), { id: 'movie-1', ratingSum: sum, ratingCount: count });

  beforeEach(() => {
    update = {
      set: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      execute: jest.fn().mockResolvedValue(undefined),
    };
    manager = {
      findOne: jest.fn(),
      findOneOrFail: jest.fn(),
      save: jest.fn().mockResolvedValue(undefined),
      create: jest.fn((_, input) => input),
      createQueryBuilder: jest.fn().mockReturnValue({ update: jest.fn().mockReturnValue(update) }),
    };
    const dataSource = {
      transaction: (cb: (m: EntityManager) => unknown) => cb(manager as unknown as EntityManager),
    } as unknown as DataSource;
    users = { ensureExists: jest.fn().mockResolvedValue(undefined) };
    cache = { invalidate: jest.fn().mockResolvedValue(undefined) };

    service = new RatingsService(
      dataSource,
      users as unknown as UsersService,
      cache as unknown as MoviesCache,
    );
  });

  it('adds a new rating: increments sum and count and returns the new average', async () => {
    manager.findOne
      .mockResolvedValueOnce(movie(0, 0)) // movie lookup
      .mockResolvedValueOnce(null); // no existing rating
    manager.findOneOrFail.mockResolvedValue(movie(8, 1));

    const result = await service.rate('movie-1', 'user-1', 8);

    expect(users.ensureExists).toHaveBeenCalledWith('user-1');
    expect(manager.create).toHaveBeenCalledWith(Rating, {
      userId: 'user-1',
      movieId: 'movie-1',
      value: 8,
    });
    expect(update.set).toHaveBeenCalledWith({
      ratingSum: expect.any(Function),
      ratingCount: expect.any(Function),
    });
    expect(result).toEqual({ movieId: 'movie-1', averageRating: 8, ratingCount: 1 });
    expect(cache.invalidate).toHaveBeenCalledWith('movie-1');
  });

  it('updates an existing rating: adjusts the sum by the delta and keeps the count', async () => {
    const existing = Object.assign(new Rating(), { userId: 'user-1', movieId: 'movie-1', value: 4 });
    manager.findOne.mockResolvedValueOnce(movie(10, 2)).mockResolvedValueOnce(existing);
    manager.findOneOrFail.mockResolvedValue(movie(15, 2));

    const result = await service.rate('movie-1', 'user-1', 9);

    expect(existing.value).toBe(9);
    expect(manager.create).not.toHaveBeenCalled();
    expect(result).toEqual({ movieId: 'movie-1', averageRating: 7.5, ratingCount: 2 });
  });

  it('throws NotFound when the movie does not exist', async () => {
    manager.findOne.mockResolvedValueOnce(null);
    await expect(service.rate('missing', 'user-1', 5)).rejects.toBeInstanceOf(NotFoundException);
    expect(cache.invalidate).not.toHaveBeenCalled();
  });
});
