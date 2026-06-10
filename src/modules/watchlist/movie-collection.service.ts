import { NotFoundException } from '@nestjs/common';
import { ObjectLiteral, Repository } from 'typeorm';
import { MovieResponseDto } from '../movies/dto/movie-response.dto';
import { Movie } from '../movies/entities/movie.entity';

export interface MovieCollectionItem extends ObjectLiteral {
  userId: string;
  movieId: string;
  movie?: Movie;
}

/**
 * Shared add/remove/list behaviour for per-user movie collections
 * (watchlist, favourites). Adds are idempotent on the (user, movie) pair.
 */
export abstract class MovieCollectionService<T extends MovieCollectionItem> {
  protected constructor(
    private readonly items: Repository<T>,
    private readonly movies: Repository<Movie>,
  ) {}

  async add(userId: string, movieId: string): Promise<void> {
    if (!(await this.movies.existsBy({ id: movieId }))) {
      throw new NotFoundException(`Movie ${movieId} not found`);
    }
    await this.items
      .createQueryBuilder()
      .insert()
      .values({ userId, movieId } as never)
      .orIgnore()
      .execute();
  }

  async remove(userId: string, movieId: string): Promise<void> {
    await this.items.delete({ userId, movieId } as never);
  }

  async list(userId: string): Promise<MovieResponseDto[]> {
    const rows = await this.items.find({
      where: { userId } as never,
      relations: { movie: { genres: true } } as never,
      order: { createdAt: 'DESC' } as never,
    });
    return rows
      .map((row) => row.movie)
      .filter((movie): movie is Movie => Boolean(movie))
      .map(MovieResponseDto.fromEntity);
  }
}
