import { HttpService } from '@nestjs/axios';
import { ServiceUnavailableException } from '@nestjs/common';
import { of, throwError } from 'rxjs';
import { TmdbService } from './tmdb.service';

describe('TmdbService', () => {
  let http: { get: jest.Mock };
  let service: TmdbService;

  beforeEach(() => {
    http = { get: jest.fn() };
    service = new TmdbService(http as unknown as HttpService);
  });

  it('returns the genre list from the API payload', async () => {
    http.get.mockReturnValue(of({ data: { genres: [{ id: 28, name: 'Action' }] } }));

    await expect(service.getGenres()).resolves.toEqual([{ id: 28, name: 'Action' }]);
    expect(http.get).toHaveBeenCalledWith('/genre/movie/list', { params: { language: 'en' } });
  });

  it('returns a popular movies page', async () => {
    const page = { page: 1, results: [], total_pages: 10, total_results: 0 };
    http.get.mockReturnValue(of({ data: page }));

    await expect(service.getPopularMovies(1)).resolves.toEqual(page);
    expect(http.get).toHaveBeenCalledWith('/movie/popular', { params: { page: 1 } });
  });

  it('maps upstream failures to a ServiceUnavailableException', async () => {
    http.get.mockReturnValue(throwError(() => new Error('network down')));

    await expect(service.getGenres()).rejects.toBeInstanceOf(ServiceUnavailableException);
  });
});
