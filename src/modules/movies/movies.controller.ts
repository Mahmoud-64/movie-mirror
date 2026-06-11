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
import { ApiBearerAuth, ApiCreatedResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { UserRole } from '../users/entities/user.entity';
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
  // DEMO ONLY: regular users may manage movies. Restore @Roles(UserRole.ADMIN) before production.
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.USER, UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiCreatedResponse({ type: MovieResponseDto })
  create(@Body() body: CreateMovieDto): Promise<MovieResponseDto> {
    return this.movies.create(body);
  }

  @Patch(':id')
  // DEMO ONLY: regular users may manage movies. Restore @Roles(UserRole.ADMIN) before production.
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.USER, UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOkResponse({ type: MovieResponseDto })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: UpdateMovieDto,
  ): Promise<MovieResponseDto> {
    return this.movies.update(id, body);
  }

  @Delete(':id')
  // DEMO ONLY: regular users may manage movies. Restore @Roles(UserRole.ADMIN) before production.
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.USER, UserRole.ADMIN)
  @ApiBearerAuth()
  @HttpCode(204)
  remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.movies.remove(id);
  }
}
