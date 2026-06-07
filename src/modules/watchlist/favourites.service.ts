import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Movie } from '../movies/entities/movie.entity';
import { Favourite } from './entities/favourite.entity';
import { MovieCollectionService } from './movie-collection.service';

@Injectable()
export class FavouritesService extends MovieCollectionService<Favourite> {
  constructor(
    @InjectRepository(Favourite) items: Repository<Favourite>,
    @InjectRepository(Movie) movies: Repository<Movie>,
  ) {
    super(items, movies);
  }
}
