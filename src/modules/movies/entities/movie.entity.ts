import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinTable,
  ManyToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Genre } from '../../genres/entities/genre.entity';

@Entity('movies')
export class Movie {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index({ unique: true })
  @Column({ name: 'tmdb_id' })
  tmdbId: number;

  @Index()
  @Column()
  title: string;

  @Column({ type: 'text', nullable: true })
  overview: string | null;

  @Column({ name: 'release_date', type: 'date', nullable: true })
  releaseDate: string | null;

  @Column({ name: 'poster_path', type: 'varchar', nullable: true })
  posterPath: string | null;

  @Column({ type: 'double precision', default: 0 })
  popularity: number;

  @Column({ name: 'rating_sum', type: 'int', default: 0 })
  ratingSum: number;

  @Column({ name: 'rating_count', type: 'int', default: 0 })
  ratingCount: number;

  @ManyToMany(() => Genre, (genre) => genre.movies, { cascade: false })
  @JoinTable({
    name: 'movie_genres',
    joinColumn: { name: 'movie_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'genre_id', referencedColumnName: 'id' },
  })
  genres: Genre[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  get averageRating(): number {
    return this.ratingCount > 0 ? this.ratingSum / this.ratingCount : 0;
  }
}
