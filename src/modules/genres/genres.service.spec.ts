import { Repository } from 'typeorm';
import { Genre } from './entities/genre.entity';
import { GenresService } from './genres.service';
import { GenresController } from './genres.controller';

describe('Genres', () => {
  it('lists genres ordered by name', async () => {
    const repo = { find: jest.fn().mockResolvedValue([{ id: 28, name: 'Action' }]) };
    const service = new GenresService(repo as unknown as Repository<Genre>);

    await expect(service.list()).resolves.toEqual([{ id: 28, name: 'Action' }]);
    expect(repo.find).toHaveBeenCalledWith({ order: { name: 'ASC' } });
  });

  it('controller delegates to the service', async () => {
    const service = { list: jest.fn().mockResolvedValue([]) };
    const controller = new GenresController(service as unknown as GenresService);
    await expect(controller.list()).resolves.toEqual([]);
  });
});
