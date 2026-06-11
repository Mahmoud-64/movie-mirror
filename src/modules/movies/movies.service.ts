import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository, SelectQueryBuilder } from 'typeorm';
import { Genre } from '../genres/entities/genre.entity';
import { Movie } from './entities/movie.entity';
import { CreateMovieDto, UpdateMovieDto } from './dto/create-movie.dto';
import { ListMoviesQueryDto, MovieSortBy, SortOrder } from './dto/list-movies-query.dto';
import { MovieResponseDto, PaginatedMoviesDto } from './dto/movie-response.dto';
import { MoviesCache } from './movies.cache';

const RATING_ALIAS = 'avg_rating';
const RATING_EXPRESSION =
  'COALESCE(CAST(movie.ratingSum AS numeric) / NULLIF(movie.ratingCount, 0), 0)';

const SORT_COLUMNS: Record<MovieSortBy, string> = {
  [MovieSortBy.POPULARITY]: 'movie.popularity',
  [MovieSortBy.RELEASE_DATE]: 'movie.releaseDate',
  [MovieSortBy.TITLE]: 'movie.title',
  [MovieSortBy.RATING]: RATING_ALIAS,
};

@Injectable()
export class MoviesService {
  constructor(
    @InjectRepository(Movie) private readonly movies: Repository<Movie>,
    @InjectRepository(Genre) private readonly genres: Repository<Genre>,
    private readonly cache: MoviesCache,
  ) {}

  async list(query: ListMoviesQueryDto): Promise<PaginatedMoviesDto> {
    return this.cache.list(this.cacheKey(query), async () => {
      const [movies, total] = await this.buildQuery(query).getManyAndCount();
      return {
        data: movies.map(MovieResponseDto.fromEntity),
        meta: {
          page: query.page,
          limit: query.limit,
          total,
          totalPages: Math.ceil(total / query.limit),
        },
      };
    });
  }

  async findById(id: string): Promise<MovieResponseDto> {
    return this.cache.detail(id, async () => {
      const movie = await this.movies.findOne({ where: { id }, relations: { genres: true } });
      if (!movie) {
        throw new NotFoundException(`Movie ${id} not found`);
      }
      return MovieResponseDto.fromEntity(movie);
    });
  }

  async create(dto: CreateMovieDto): Promise<MovieResponseDto> {
    if (await this.movies.existsBy({ tmdbId: dto.tmdbId })) {
      throw new ConflictException(`Movie with tmdbId ${dto.tmdbId} already exists`);
    }
    const movie = this.movies.create({
      tmdbId: dto.tmdbId,
      title: dto.title,
      overview: dto.overview ?? null,
      releaseDate: dto.releaseDate ?? null,
      posterPath: dto.posterPath ?? null,
      popularity: dto.popularity ?? 0,
      genres: await this.resolveGenres(dto.genreIds),
    });
    const saved = await this.movies.save(movie);
    await this.cache.invalidate();
    return MovieResponseDto.fromEntity(saved);
  }

  async update(id: string, dto: UpdateMovieDto): Promise<MovieResponseDto> {
    const movie = await this.movies.findOne({ where: { id }, relations: { genres: true } });
    if (!movie) {
      throw new NotFoundException(`Movie ${id} not found`);
    }
    if (dto.title !== undefined) movie.title = dto.title;
    if (dto.overview !== undefined) movie.overview = dto.overview ?? null;
    if (dto.releaseDate !== undefined) movie.releaseDate = dto.releaseDate ?? null;
    if (dto.posterPath !== undefined) movie.posterPath = dto.posterPath ?? null;
    if (dto.popularity !== undefined) movie.popularity = dto.popularity;
    if (dto.genreIds !== undefined) movie.genres = await this.resolveGenres(dto.genreIds);

    const saved = await this.movies.save(movie);
    await this.cache.invalidate(id);
    return MovieResponseDto.fromEntity(saved);
  }

  async remove(id: string): Promise<void> {
    const result = await this.movies.delete(id);
    if (!result.affected) {
      throw new NotFoundException(`Movie ${id} not found`);
    }
    await this.cache.invalidate(id);
  }

  private async resolveGenres(ids?: number[]): Promise<Genre[]> {
    if (!ids?.length) {
      return [];
    }
    return this.genres.findBy({ id: In(ids) });
  }

  private buildQuery(query: ListMoviesQueryDto): SelectQueryBuilder<Movie> {
    const qb = this.movies.createQueryBuilder('movie').leftJoinAndSelect('movie.genres', 'genre');

    if (query.search) {
      qb.andWhere('movie.title ILIKE :search', { search: `%${query.search}%` });
    }

    if (query.genres?.length) {
      qb.andWhere(
        'movie.id IN (SELECT mg.movie_id FROM movie_genres mg WHERE mg.genre_id IN (:...genreIds))',
        { genreIds: query.genres },
      );
    }

    if (query.sortBy === MovieSortBy.RATING) {
      qb.addSelect(RATING_EXPRESSION, RATING_ALIAS);
    }

    return qb
      .orderBy(SORT_COLUMNS[query.sortBy], query.order === SortOrder.ASC ? 'ASC' : 'DESC')
      .skip((query.page - 1) * query.limit)
      .take(query.limit);
  }

  private cacheKey(query: ListMoviesQueryDto): string {
    return JSON.stringify({
      page: query.page,
      limit: query.limit,
      search: query.search ?? '',
      genres: [...(query.genres ?? [])].sort((a, b) => a - b),
      sortBy: query.sortBy,
      order: query.order,
    });
  }
}
