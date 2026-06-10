import { RatingsController } from './ratings.controller';
import { RatingsService } from './ratings.service';

describe('RatingsController', () => {
  it('delegates to the ratings service with movie, user and value', async () => {
    const service = {
      rate: jest.fn().mockResolvedValue({ movieId: 'm1', averageRating: 7, ratingCount: 3 }),
    };
    const controller = new RatingsController(service as unknown as RatingsService);

    const result = await controller.rate('m1', 'u1', { value: 7 });

    expect(service.rate).toHaveBeenCalledWith('m1', 'u1', 7);
    expect(result).toMatchObject({ movieId: 'm1', averageRating: 7 });
  });
});
