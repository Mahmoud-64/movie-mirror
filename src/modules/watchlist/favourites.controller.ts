import { Body, Controller, Delete, Get, HttpCode, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { ApiHeader, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUserId } from '../../common/decorators/current-user-id.decorator';
import { MovieResponseDto } from '../movies/dto/movie-response.dto';
import { AddToCollectionDto } from './dto/add-to-collection.dto';
import { FavouritesService } from './favourites.service';

@ApiTags('favourites')
@ApiHeader({ name: 'x-user-id', description: 'User id (uuid)', required: true })
@Controller('favourites')
export class FavouritesController {
  constructor(private readonly favourites: FavouritesService) {}

  @Get()
  @ApiOkResponse({ type: [MovieResponseDto] })
  list(@CurrentUserId() userId: string): Promise<MovieResponseDto[]> {
    return this.favourites.list(userId);
  }

  @Post()
  @HttpCode(204)
  add(@CurrentUserId() userId: string, @Body() body: AddToCollectionDto): Promise<void> {
    return this.favourites.add(userId, body.movieId);
  }

  @Delete(':movieId')
  @HttpCode(204)
  remove(
    @CurrentUserId() userId: string,
    @Param('movieId', ParseUUIDPipe) movieId: string,
  ): Promise<void> {
    return this.favourites.remove(userId, movieId);
  }
}
