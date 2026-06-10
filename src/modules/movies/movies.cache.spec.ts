import { ConfigService } from '@nestjs/config';
import { Cache } from 'cache-manager';
import { MoviesCache } from './movies.cache';

describe('MoviesCache', () => {
  let store: Map<string, unknown>;
  let cache: jest.Mocked<Pick<Cache, 'get' | 'set' | 'del'>>;
  let moviesCache: MoviesCache;

  beforeEach(() => {
    store = new Map();
    cache = {
      get: jest.fn((key: string) => Promise.resolve(store.get(key) ?? null)),
      set: jest.fn((key: string, value: unknown) => {
        store.set(key, value);
        return Promise.resolve();
      }),
      del: jest.fn((key: string) => {
        store.delete(key);
        return Promise.resolve();
      }),
    } as never;
    moviesCache = new MoviesCache(
      cache as unknown as Cache,
      {
        get: (_: string, fallback: unknown) => fallback,
      } as unknown as ConfigService,
    );
  });

  it('caches the factory result and serves the second call from cache', async () => {
    const factory = jest.fn().mockResolvedValue('value');

    await moviesCache.list('key', factory);
    await moviesCache.list('key', factory);

    expect(factory).toHaveBeenCalledTimes(1);
  });

  it('invalidation bumps the generation so list caches miss', async () => {
    const factory = jest.fn().mockResolvedValue('value');
    await moviesCache.list('key', factory);

    await moviesCache.invalidate();
    await moviesCache.list('key', factory);

    expect(factory).toHaveBeenCalledTimes(2);
  });

  it('invalidation deletes the targeted detail entry', async () => {
    const factory = jest.fn().mockResolvedValue('detail');
    await moviesCache.detail('movie-1', factory);

    await moviesCache.invalidate('movie-1');
    await moviesCache.detail('movie-1', factory);

    expect(factory).toHaveBeenCalledTimes(2);
    expect(cache.del).toHaveBeenCalledWith('movies:detail:movie-1');
  });
});
