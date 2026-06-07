import { Repository } from 'typeorm';
import { Movie } from '../movies/entities/movie.entity';
import { Favourite } from './entities/favourite.entity';
import { FavouritesService } from './favourites.service';

describe('FavouritesService', () => {
  it('reuses the shared collection behaviour for removal', async () => {
    const items = { delete: jest.fn().mockResolvedValue({ affected: 1 }) };
    const service = new FavouritesService(
      items as unknown as Repository<Favourite>,
      {} as unknown as Repository<Movie>,
    );

    await service.remove('user-1', 'movie-1');

    expect(items.delete).toHaveBeenCalledWith({ userId: 'user-1', movieId: 'movie-1' });
  });
});
