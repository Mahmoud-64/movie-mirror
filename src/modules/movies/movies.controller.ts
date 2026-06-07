import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiCreatedResponse, ApiHeader, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { AdminGuard } from '../../common/guards/admin.guard';
import { CreateMovieDto, UpdateMovieDto } from './dto/create-movie.dto';
import { ListMoviesQueryDto } from './dto/list-movies-query.dto';
import { MovieResponseDto, PaginatedMoviesDto } from './dto/movie-response.dto';
import { MoviesService } from './movies.service';

@ApiTags('movies')
@Controller('movies')
export class MoviesController {
  constructor(private readonly movies: MoviesService) {}

  @Get()
  @ApiOkResponse({ type: PaginatedMoviesDto })
  list(@Query() query: ListMoviesQueryDto): Promise<PaginatedMoviesDto> {
    return this.movies.list(query);
  }

  @Get(':id')
  @ApiOkResponse({ type: MovieResponseDto })
  findOne(@Param('id', ParseUUIDPipe) id: string): Promise<MovieResponseDto> {
    return this.movies.findById(id);
  }

  @Post()
  @UseGuards(AdminGuard)
  @ApiHeader({ name: 'x-admin-token', description: 'Admin API key', required: true })
  @ApiCreatedResponse({ type: MovieResponseDto })
  create(@Body() body: CreateMovieDto): Promise<MovieResponseDto> {
    return this.movies.create(body);
  }

  @Patch(':id')
  @UseGuards(AdminGuard)
  @ApiHeader({ name: 'x-admin-token', description: 'Admin API key', required: true })
  @ApiOkResponse({ type: MovieResponseDto })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: UpdateMovieDto,
  ): Promise<MovieResponseDto> {
    return this.movies.update(id, body);
  }

  @Delete(':id')
  @UseGuards(AdminGuard)
  @ApiHeader({ name: 'x-admin-token', description: 'Admin API key', required: true })
  @HttpCode(204)
  remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.movies.remove(id);
  }
}
