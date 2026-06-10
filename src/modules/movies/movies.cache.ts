import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cache } from 'cache-manager';

const GENERATION_KEY = 'movies:generation';
const GENERATION_TTL_MS = 24 * 60 * 60 * 1000;

@Injectable()
export class MoviesCache {
  private readonly ttlMs: number;

  constructor(
    @Inject(CACHE_MANAGER) private readonly cache: Cache,
    config: ConfigService,
  ) {
    this.ttlMs = config.get<number>('CACHE_TTL_SECONDS', 60) * 1000;
  }

  async list<T>(queryKey: string, factory: () => Promise<T>): Promise<T> {
    const generation = await this.generation();
    return this.remember(`movies:list:g${generation}:${queryKey}`, factory);
  }

  async detail<T>(id: string, factory: () => Promise<T>): Promise<T> {
    return this.remember(`movies:detail:${id}`, factory);
  }

  async invalidate(id?: string): Promise<void> {
    const generation = await this.generation();
    await this.cache.set(GENERATION_KEY, generation + 1, GENERATION_TTL_MS);
    if (id) {
      await this.cache.del(`movies:detail:${id}`);
    }
  }

  private async remember<T>(key: string, factory: () => Promise<T>): Promise<T> {
    const cached = await this.cache.get<T>(key);
    if (cached !== undefined && cached !== null) {
      return cached;
    }
    const value = await factory();
    await this.cache.set(key, value, this.ttlMs);
    return value;
  }

  private async generation(): Promise<number> {
    return (await this.cache.get<number>(GENERATION_KEY)) ?? 0;
  }
}
