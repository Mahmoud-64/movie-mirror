import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUserId } from '../../common/decorators/current-user-id.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { MovieResponseDto } from '../movies/dto/movie-response.dto';
import { AddToCollectionDto } from './dto/add-to-collection.dto';
import { WatchlistService } from './watchlist.service';

@ApiTags('watchlist')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('watchlist')
export class WatchlistController {
  constructor(private readonly watchlist: WatchlistService) {}

  @Get()
  @ApiOkResponse({ type: [MovieResponseDto] })
  list(@CurrentUserId() userId: string): Promise<MovieResponseDto[]> {
    return this.watchlist.list(userId);
  }

  @Post()
  @HttpCode(204)
  add(@CurrentUserId() userId: string, @Body() body: AddToCollectionDto): Promise<void> {
    return this.watchlist.add(userId, body.movieId);
  }

  @Delete(':movieId')
  @HttpCode(204)
  remove(
    @CurrentUserId() userId: string,
    @Param('movieId', ParseUUIDPipe) movieId: string,
  ): Promise<void> {
    return this.watchlist.remove(userId, movieId);
  }
}
