import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { GenreDto } from '../movies/dto/movie-response.dto';
import { GenresService } from './genres.service';

@ApiTags('genres')
@Controller('genres')
export class GenresController {
  constructor(private readonly genres: GenresService) {}

  @Get()
  @ApiOkResponse({ type: [GenreDto] })
  list(): Promise<GenreDto[]> {
    return this.genres.list();
  }
}
