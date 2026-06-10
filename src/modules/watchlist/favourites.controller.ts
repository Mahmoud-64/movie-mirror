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
import { FavouritesService } from './favourites.service';

@ApiTags('favourites')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
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
