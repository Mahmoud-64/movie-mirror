import { ApiProperty } from '@nestjs/swagger';
import { Movie } from '../entities/movie.entity';

export class GenreDto {
  @ApiProperty() id: number;
  @ApiProperty() name: string;
}

export class MovieResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() tmdbId: number;
  @ApiProperty() title: string;
  @ApiProperty({ nullable: true }) overview: string | null;
  @ApiProperty({ nullable: true }) releaseDate: string | null;
  @ApiProperty({ nullable: true }) posterPath: string | null;
  @ApiProperty() popularity: number;
  @ApiProperty({ description: 'Mean user rating (0 when unrated)' }) averageRating: number;
  @ApiProperty() ratingCount: number;
  @ApiProperty({ type: [GenreDto] }) genres: GenreDto[];

  static fromEntity(movie: Movie): MovieResponseDto {
    return {
      id: movie.id,
      tmdbId: movie.tmdbId,
      title: movie.title,
      overview: movie.overview,
      releaseDate: movie.releaseDate,
      posterPath: movie.posterPath,
      popularity: movie.popularity,
      averageRating: Number(movie.averageRating.toFixed(2)),
      ratingCount: movie.ratingCount,
      genres: (movie.genres ?? []).map((genre) => ({ id: genre.id, name: genre.name })),
    };
  }
}

export class PageMetaDto {
  @ApiProperty() page: number;
  @ApiProperty() limit: number;
  @ApiProperty() total: number;
  @ApiProperty() totalPages: number;
}

export class PaginatedMoviesDto {
  @ApiProperty({ type: [MovieResponseDto] }) data: MovieResponseDto[];
  @ApiProperty() meta: PageMetaDto;
}
