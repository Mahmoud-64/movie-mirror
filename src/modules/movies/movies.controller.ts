import { Controller, Get, Param, ParseUUIDPipe, Query } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
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
}
