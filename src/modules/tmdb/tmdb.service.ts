import { HttpService } from '@nestjs/axios';
import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { catchError, firstValueFrom, map, retry, timeout } from 'rxjs';
import { TmdbGenre, TmdbGenreListResponse, TmdbMoviePage } from './tmdb.types';

@Injectable()
export class TmdbService {
  private readonly timeoutMs = 10_000;
  private readonly retryCount = 2;

  constructor(private readonly http: HttpService) {}

  async getGenres(): Promise<TmdbGenre[]> {
    const data = await this.request<TmdbGenreListResponse>('/genre/movie/list', {
      language: 'en',
    });
    return data.genres;
  }

  async getPopularMovies(page: number): Promise<TmdbMoviePage> {
    return this.request<TmdbMoviePage>('/movie/popular', { page });
  }

  private async request<T>(path: string, params: Record<string, unknown>): Promise<T> {
    return firstValueFrom(
      this.http.get<T>(path, { params }).pipe(
        timeout(this.timeoutMs),
        retry({ count: this.retryCount, delay: 1_000 }),
        map((response) => response.data),
        catchError(() => {
          throw new ServiceUnavailableException(`TMDB request to ${path} failed`);
        }),
      ),
    );
  }
}
