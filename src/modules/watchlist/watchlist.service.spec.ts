import { NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Movie } from '../movies/entities/movie.entity';
import { WatchlistItem } from './entities/watchlist-item.entity';
import { WatchlistService } from './watchlist.service';

describe('WatchlistService (shared collection behaviour)', () => {
  let insert: { insert: jest.Mock; values: jest.Mock; orIgnore: jest.Mock; execute: jest.Mock };
  let items: { createQueryBuilder: jest.Mock; delete: jest.Mock; find: jest.Mock };
  let movies: { existsBy: jest.Mock };
  let service: WatchlistService;

  beforeEach(() => {
    insert = {
      insert: jest.fn().mockReturnThis(),
      values: jest.fn().mockReturnThis(),
      orIgnore: jest.fn().mockReturnThis(),
      execute: jest.fn().mockResolvedValue(undefined),
    };
    items = {
      createQueryBuilder: jest.fn().mockReturnValue(insert),
      delete: jest.fn().mockResolvedValue({ affected: 1 }),
      find: jest.fn(),
    };
    movies = { existsBy: jest.fn().mockResolvedValue(true) };
    service = new WatchlistService(
      items as unknown as Repository<WatchlistItem>,
      movies as unknown as Repository<Movie>,
    );
  });

  it('adds idempotently after confirming the movie exists', async () => {
    await service.add('user-1', 'movie-1');
    expect(insert.values).toHaveBeenCalledWith({ userId: 'user-1', movieId: 'movie-1' });
    expect(insert.orIgnore).toHaveBeenCalled();
  });

  it('rejects adding an unknown movie', async () => {
    movies.existsBy.mockResolvedValue(false);
    await expect(service.add('user-1', 'missing')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('removes by user and movie', async () => {
    await service.remove('user-1', 'movie-1');
    expect(items.delete).toHaveBeenCalledWith({ userId: 'user-1', movieId: 'movie-1' });
  });

  it('lists the collected movies mapped to response DTOs', async () => {
    const movie = Object.assign(new Movie(), {
      id: 'movie-1',
      tmdbId: 1,
      title: 'Collected',
      ratingSum: 0,
      ratingCount: 0,
      genres: [{ id: 28, name: 'Action' }],
    });
    items.find.mockResolvedValue([{ userId: 'user-1', movieId: 'movie-1', movie }]);

    const result = await service.list('user-1');

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ id: 'movie-1', title: 'Collected' });
  });
});
