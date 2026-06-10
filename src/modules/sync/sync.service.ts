import { Inject, Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SchedulerRegistry } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { CronJob } from 'cron';
import { Repository } from 'typeorm';
import { Genre } from '../genres/entities/genre.entity';
import { Movie } from '../movies/entities/movie.entity';
import { TmdbService } from '../tmdb/tmdb.service';
import { TmdbMovieResult } from '../tmdb/tmdb.types';
import { MOVIE_SYNC_SOURCE, MovieSyncSource } from './sync-source.interface';

@Injectable()
export class SyncService implements OnApplicationBootstrap {
  private readonly logger = new Logger(SyncService.name);
  private readonly maxPages: number;
  private readonly cron: string;

  constructor(
    private readonly tmdb: TmdbService,
    @Inject(MOVIE_SYNC_SOURCE) private readonly source: MovieSyncSource,
    @InjectRepository(Movie) private readonly movies: Repository<Movie>,
    @InjectRepository(Genre) private readonly genres: Repository<Genre>,
    private readonly scheduler: SchedulerRegistry,
    config: ConfigService,
  ) {
    this.maxPages = config.get<number>('TMDB_SYNC_PAGES', 5);
    this.cron = config.get<string>('TMDB_SYNC_CRON', '0 3 * * *');
  }

  async onApplicationBootstrap(): Promise<void> {
    this.schedule();
    if ((await this.movies.count()) === 0) {
      this.logger.log('Catalogue is empty; running initial sync');
      void this.syncAll().catch((error) => this.logger.error('Initial sync failed', error));
    }
  }

  private schedule(): void {
    const job = new CronJob(this.cron, () => {
      void this.syncAll().catch((error) => this.logger.error('Scheduled sync failed', error));
    });
    this.scheduler.addCronJob('tmdb-sync', job as never);
    job.start();
  }

  async syncAll(): Promise<void> {
    await this.syncGenres();
    await this.syncMovies();
  }

  async syncGenres(): Promise<number> {
    const genres = await this.tmdb.getGenres();
    if (genres.length > 0) {
      await this.genres.upsert(genres, ['id']);
    }
    this.logger.log(`Synced ${genres.length} genres`);
    return genres.length;
  }

  async syncMovies(): Promise<number> {
    const genreMap = new Map((await this.genres.find()).map((genre) => [genre.id, genre]));
    const first = await this.source.fetchPage(1);
    const pages = Math.min(this.maxPages, first.totalPages);

    let synced = 0;
    for (let page = 1; page <= pages; page++) {
      const { movies } = page === 1 ? first : await this.source.fetchPage(page);
      for (const result of movies) {
        await this.upsertMovie(result, genreMap);
        synced++;
      }
    }
    this.logger.log(`Synced ${synced} movies from "${this.source.name}"`);
    return synced;
  }

  private async upsertMovie(result: TmdbMovieResult, genreMap: Map<number, Genre>): Promise<void> {
    const movie =
      (await this.movies.findOne({ where: { tmdbId: result.id } })) ??
      this.movies.create({ tmdbId: result.id });
    movie.title = result.title;
    movie.overview = result.overview || null;
    movie.releaseDate = result.release_date || null;
    movie.posterPath = result.poster_path;
    movie.popularity = result.popularity ?? 0;
    movie.genres = result.genre_ids
      .map((id) => genreMap.get(id))
      .filter((genre): genre is Genre => genre !== undefined);
    await this.movies.save(movie);
  }
}
