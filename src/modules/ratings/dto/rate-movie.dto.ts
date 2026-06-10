import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, Max, Min } from 'class-validator';

export class RateMovieDto {
  @ApiProperty({ minimum: 1, maximum: 10, description: 'Rating from 1 to 10' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(10)
  value: number;
}

export class RatingResponseDto {
  @ApiProperty() movieId: string;
  @ApiProperty() averageRating: number;
  @ApiProperty() ratingCount: number;
}
