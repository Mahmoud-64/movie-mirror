import { Body, Controller, HttpCode, Param, ParseUUIDPipe, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUserId } from '../../common/decorators/current-user-id.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RateMovieDto, RatingResponseDto } from './dto/rate-movie.dto';
import { RatingsService } from './ratings.service';

@ApiTags('ratings')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
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
