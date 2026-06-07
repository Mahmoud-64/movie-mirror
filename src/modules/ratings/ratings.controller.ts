import { Body, Controller, HttpCode, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { ApiHeader, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUserId } from '../../common/decorators/current-user-id.decorator';
import { RateMovieDto, RatingResponseDto } from './dto/rate-movie.dto';
import { RatingsService } from './ratings.service';

@ApiTags('ratings')
@ApiHeader({ name: 'x-user-id', description: 'Rating user id (uuid)', required: true })
@Controller('movies/:movieId/ratings')
export class RatingsController {
  constructor(private readonly ratings: RatingsService) {}

  @Post()
  @HttpCode(200)
  @ApiOkResponse({ type: RatingResponseDto })
  rate(
    @Param('movieId', ParseUUIDPipe) movieId: string,
    @CurrentUserId() userId: string,
    @Body() body: RateMovieDto,
  ): Promise<RatingResponseDto> {
    return this.ratings.rate(movieId, userId, body.value);
  }
}
