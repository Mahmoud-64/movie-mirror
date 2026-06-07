import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Movie } from '../movies/entities/movie.entity';
import { Favourite } from './entities/favourite.entity';
import { WatchlistItem } from './entities/watchlist-item.entity';
import { FavouritesController } from './favourites.controller';
import { FavouritesService } from './favourites.service';
import { WatchlistController } from './watchlist.controller';
import { WatchlistService } from './watchlist.service';

@Module({
  imports: [TypeOrmModule.forFeature([WatchlistItem, Favourite, Movie])],
  controllers: [WatchlistController, FavouritesController],
  providers: [WatchlistService, FavouritesService],
})
export class WatchlistModule {}
