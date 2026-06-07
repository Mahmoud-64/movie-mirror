import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, EntityManager } from 'typeorm';
import { Movie } from '../movies/entities/movie.entity';
import { MoviesCache } from '../movies/movies.cache';
import { UsersService } from '../users/users.service';
import { Rating } from './entities/rating.entity';
import { RatingResponseDto } from './dto/rate-movie.dto';

@Injectable()
export class RatingsService {
  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
    private readonly users: UsersService,
    private readonly cache: MoviesCache,
  ) {}

  async rate(movieId: string, userId: string, value: number): Promise<RatingResponseDto> {
    await this.users.ensureExists(userId);

    const movie = await this.dataSource.transaction((manager) =>
      this.applyRating(manager, movieId, userId, value),
    );

    await this.cache.invalidate(movieId);
    return {
      movieId,
      averageRating: Number(movie.averageRating.toFixed(2)),
      ratingCount: movie.ratingCount,
    };
  }

  private async applyRating(
    manager: EntityManager,
    movieId: string,
    userId: string,
    value: number,
  ): Promise<Movie> {
    const movie = await manager.findOne(Movie, { where: { id: movieId } });
    if (!movie) {
      throw new NotFoundException(`Movie ${movieId} not found`);
    }

    const existing = await manager.findOne(Rating, { where: { userId, movieId } });
    const sumDelta = existing ? value - existing.value : value;
    const countDelta = existing ? 0 : 1;

    if (existing) {
      existing.value = value;
      await manager.save(existing);
    } else {
      await manager.save(manager.create(Rating, { userId, movieId, value }));
    }

    await manager
      .createQueryBuilder()
      .update(Movie)
      .set({
        ratingSum: () => `rating_sum + (${sumDelta})`,
        ratingCount: () => `rating_count + (${countDelta})`,
      })
      .where('id = :id', { id: movieId })
      .execute();

    return manager.findOneOrFail(Movie, { where: { id: movieId } });
  }
}
