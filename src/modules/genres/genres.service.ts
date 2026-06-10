import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Genre } from './entities/genre.entity';

@Injectable()
export class GenresService {
  constructor(@InjectRepository(Genre) private readonly genres: Repository<Genre>) {}

  list(): Promise<Genre[]> {
    return this.genres.find({ order: { name: 'ASC' } });
  }
}
