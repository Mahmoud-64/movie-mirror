import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { Movie } from './entities/movie.entity';
import { ListMoviesQueryDto, MovieSortBy, SortOrder } from './dto/list-movies-query.dto';
import { MovieResponseDto, PaginatedMoviesDto } from './dto/movie-response.dto';
import { MoviesCache } from './movies.cache';

const SORT_COLUMNS: Record<MovieSortBy, string> = {
  [MovieSortBy.POPULARITY]: 'movie.popularity',
  [MovieSortBy.RELEASE_DATE]: 'movie.releaseDate',
  [MovieSortBy.TITLE]: 'movie.title',
  [MovieSortBy.RATING]: 'movie.ratingSum / NULLIF(movie.ratingCount, 0)',
};

@Injectable()
export class MoviesService {
  constructor(
    @InjectRepository(Movie) private readonly movies: Repository<Movie>,
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
