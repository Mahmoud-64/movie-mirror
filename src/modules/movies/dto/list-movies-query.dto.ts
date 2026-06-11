import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export enum MovieSortBy {
  POPULARITY = 'popularity',
  RELEASE_DATE = 'releaseDate',
  RATING = 'rating',
  TITLE = 'title',
}

export enum SortOrder {
  ASC = 'asc',
  DESC = 'desc',
}

export class ListMoviesQueryDto {
  @ApiPropertyOptional({ type: Number, minimum: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;

  @ApiPropertyOptional({ type: Number, minimum: 1, maximum: 100, default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit = 20;

  @ApiPropertyOptional({ description: 'Case-insensitive title search' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Comma-separated genre ids; matches movies in any of them',
    example: '28,53',
  })
  @IsOptional()
  @Transform(({ value }) =>
    typeof value === 'string'
      ? value
          .split(',')
          .map((part) => Number.parseInt(part.trim(), 10))
          .filter((id) => Number.isInteger(id))
      : value,
  )
  @IsInt({ each: true })
  genres?: number[];

  @ApiPropertyOptional({ enum: MovieSortBy, default: MovieSortBy.POPULARITY })
  @IsOptional()
  @IsEnum(MovieSortBy)
  sortBy: MovieSortBy = MovieSortBy.POPULARITY;

  @ApiPropertyOptional({ enum: SortOrder, default: SortOrder.DESC })
  @IsOptional()
  @IsEnum(SortOrder)
  order: SortOrder = SortOrder.DESC;
}
