import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as bcrypt from 'bcryptjs';
import * as request from 'supertest';
import { DataSource } from 'typeorm';
import { AppModule } from '../src/app.module';
import { Genre } from '../src/modules/genres/entities/genre.entity';
import { Movie } from '../src/modules/movies/entities/movie.entity';
import { SyncService } from '../src/modules/sync/sync.service';
import { UsersService } from '../src/modules/users/users.service';
import { UserRole } from '../src/modules/users/entities/user.entity';

describe('TMDB service (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let movieId: string;
  let userToken: string;
  let adminToken: string;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(SyncService)
      .useValue({ onApplicationBootstrap: jest.fn(), syncAll: jest.fn() })
      .compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();

    dataSource = app.get(DataSource);
    await dataSource.query(
      'TRUNCATE TABLE ratings, watchlist_items, favourites, movie_genres, movies, genres, users RESTART IDENTITY CASCADE',
    );

    const genre = await dataSource.getRepository(Genre).save({ id: 28, name: 'Action' });
    const movie = await dataSource.getRepository(Movie).save({
      tmdbId: 101,
      title: 'Seeded Movie',
      popularity: 9,
      ratingSum: 0,
      ratingCount: 0,
      genres: [genre],
    });
    movieId = movie.id;

    const users = app.get(UsersService);
    await users.createUser(
      'admin@example.com',
      await bcrypt.hash('password123', 10),
      UserRole.ADMIN,
    );
  });

  afterAll(async () => {
    await app?.close();
  });

  const http = () => request(app.getHttpServer());

  it('serves the public movie list with average ratings', async () => {
    const res = await http().get('/movies').expect(200);
    expect(res.body.meta.total).toBeGreaterThanOrEqual(1);
    expect(res.body.data[0]).toHaveProperty('averageRating');
  });

  it('registers a user and issues a token', async () => {
    const res = await http()
      .post('/auth/register')
      .send({ email: 'user@example.com', password: 'password123' })
      .expect(201);
    userToken = res.body.accessToken;
    expect(userToken).toBeDefined();

    const login = await http()
      .post('/auth/login')
      .send({ email: 'admin@example.com', password: 'password123' })
      .expect(200);
    adminToken = login.body.accessToken;
  });

  it('rejects watchlist access without a token', () =>
    http().post('/watchlist').send({ movieId }).expect(401));

  it('adds to the watchlist and lists it with a token', async () => {
    await http()
      .post('/watchlist')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ movieId })
      .expect(204);
    const res = await http()
      .get('/watchlist')
      .set('Authorization', `Bearer ${userToken}`)
      .expect(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].id).toBe(movieId);
  });

  it('rates a movie and reflects the average in the listing', async () => {
    await http()
      .post(`/movies/${movieId}/ratings`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ value: 8 })
      .expect(200);
    const res = await http().get(`/movies/${movieId}`).expect(200);
    expect(res.body.averageRating).toBe(8);
    expect(res.body.ratingCount).toBe(1);
  });

  it('requires auth for movie writes and lets any authenticated user manage movies (demo)', async () => {
    await http().post('/movies').send({ tmdbId: 555, title: 'No token' }).expect(401);

    const asUser = await http()
      .post('/movies')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ tmdbId: 555, title: 'By user' })
      .expect(201);
    await http()
      .delete(`/movies/${asUser.body.id}`)
      .set('Authorization', `Bearer ${userToken}`)
      .expect(204);

    const asAdmin = await http()
      .post('/movies')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ tmdbId: 556, title: 'By admin' })
      .expect(201);
    await http()
      .delete(`/movies/${asAdmin.body.id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(204);
  });
});
