import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Movie } from '../movies/entities/movie.entity';
import { WatchlistItem } from './entities/watchlist-item.entity';
import { MovieCollectionService } from './movie-collection.service';

@Injectable()
export class WatchlistService extends MovieCollectionService<WatchlistItem> {
  constructor(
    @InjectRepository(WatchlistItem) items: Repository<WatchlistItem>,
    @InjectRepository(Movie) movies: Repository<Movie>,
  ) {
    super(items, movies);
  }
}
