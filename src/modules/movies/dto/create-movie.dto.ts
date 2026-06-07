import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDateString, IsInt, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateMovieDto {
  @ApiProperty({ description: 'TMDB id (unique)' })
  @Type(() => Number)
  @IsInt()
  tmdbId: number;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  overview?: string;

  @ApiPropertyOptional({ example: '2024-01-31' })
  @IsOptional()
  @IsDateString()
  releaseDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  posterPath?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  popularity?: number;

  @ApiPropertyOptional({ type: [Number], description: 'Genre ids to associate' })
  @IsOptional()
  @IsInt({ each: true })
  genreIds?: number[];
}

export class UpdateMovieDto extends PartialType(CreateMovieDto) {}
