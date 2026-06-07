import { ListMoviesQueryDto, MovieSortBy, SortOrder } from './dto/list-movies-query.dto';
import { MoviesController } from './movies.controller';
import { MoviesService } from './movies.service';

describe('MoviesController', () => {
  let service: { list: jest.Mock; findById: jest.Mock };
  let controller: MoviesController;

  beforeEach(() => {
    service = { list: jest.fn(), findById: jest.fn() };
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
});
