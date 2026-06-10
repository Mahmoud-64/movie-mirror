import { FavouritesController } from './favourites.controller';
import { FavouritesService } from './favourites.service';
import { WatchlistController } from './watchlist.controller';
import { WatchlistService } from './watchlist.service';

describe('Collection controllers', () => {
  it('watchlist controller delegates list/add/remove', async () => {
    const service = {
      list: jest.fn().mockResolvedValue([]),
      add: jest.fn().mockResolvedValue(undefined),
      remove: jest.fn().mockResolvedValue(undefined),
    };
    const controller = new WatchlistController(service as unknown as WatchlistService);

    await controller.list('user-1');
    await controller.add('user-1', { movieId: 'movie-1' });
    await controller.remove('user-1', 'movie-1');

    expect(service.list).toHaveBeenCalledWith('user-1');
    expect(service.add).toHaveBeenCalledWith('user-1', 'movie-1');
    expect(service.remove).toHaveBeenCalledWith('user-1', 'movie-1');
  });

  it('favourites controller delegates list/add/remove', async () => {
    const service = {
      list: jest.fn().mockResolvedValue([]),
      add: jest.fn().mockResolvedValue(undefined),
      remove: jest.fn().mockResolvedValue(undefined),
    };
    const controller = new FavouritesController(service as unknown as FavouritesService);

    await controller.list('user-2');
    await controller.add('user-2', { movieId: 'movie-2' });
    await controller.remove('user-2', 'movie-2');

    expect(service.add).toHaveBeenCalledWith('user-2', 'movie-2');
    expect(service.remove).toHaveBeenCalledWith('user-2', 'movie-2');
  });
});
