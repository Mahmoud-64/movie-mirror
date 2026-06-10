import { ListMoviesQueryDto, MovieSortBy, SortOrder } from './dto/list-movies-query.dto';
import { MoviesController } from './movies.controller';
import { MoviesService } from './movies.service';

describe('MoviesController', () => {
  let service: {
    list: jest.Mock;
    findById: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
    remove: jest.Mock;
  };
  let controller: MoviesController;

  beforeEach(() => {
    service = {
      list: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    };
    controller = new MoviesController(service as unknown as MoviesService);
  });

  it('delegates listing to the service', async () => {
    const query: ListMoviesQueryDto = {
      page: 1,
      limit: 20,
      sortBy: MovieSortBy.POPULARITY,
      order: SortOrder.DESC,
    };
    const page = { data: [], meta: { page: 1, limit: 20, total: 0, totalPages: 0 } };
    service.list.mockResolvedValue(page);

    await expect(controller.list(query)).resolves.toBe(page);
    expect(service.list).toHaveBeenCalledWith(query);
  });

  it('delegates detail lookup to the service', async () => {
    service.findById.mockResolvedValue({ id: 'uuid-1' });
    await expect(controller.findOne('uuid-1')).resolves.toMatchObject({ id: 'uuid-1' });
    expect(service.findById).toHaveBeenCalledWith('uuid-1');
  });

  it('delegates create, update and remove to the service', async () => {
    const dto = { tmdbId: 1, title: 'New' };
    service.create.mockResolvedValue({ id: 'uuid-1' });
    service.update.mockResolvedValue({ id: 'uuid-1' });
    service.remove.mockResolvedValue(undefined);

    await controller.create(dto);
    await controller.update('uuid-1', { title: 'Renamed' });
    await controller.remove('uuid-1');

    expect(service.create).toHaveBeenCalledWith(dto);
    expect(service.update).toHaveBeenCalledWith('uuid-1', { title: 'Renamed' });
    expect(service.remove).toHaveBeenCalledWith('uuid-1');
  });
});
