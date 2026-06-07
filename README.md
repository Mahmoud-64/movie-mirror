# TMDB Catalogue Service

A NestJS backend that syncs a movie catalogue from [TMDB](https://developer.themoviedb.org/docs)
into PostgreSQL and serves it through a cached, documented REST API. It supports
listing, search, pagination, genre filtering, movie ratings (with surfaced
averages), watchlist/favourites, and admin CRUD.

## Prerequisites
- Docker & Docker Compose
- A TMDB API read access token ([create one here](https://www.themoviedb.org/settings/api))

## Quick start
```bash
cp .env.example .env          # set TMDB_API_TOKEN and JWT_SECRET
docker compose up --build     # Compose v2; on older setups use: docker-compose up --build
```
The API is then available at **http://localhost:8080** and the interactive
OpenAPI docs at **http://localhost:8080/api/docs**.

## Local development
```bash
npm install
npm run start:dev
npm run test:cov      # unit tests with coverage gate (>= 85%)
```

## Architecture
- **NestJS** feature modules: `movies`, `genres`, `ratings`, `watchlist`, `auth`, `tmdb`, `sync`.
- **PostgreSQL** (TypeORM, schema synced from entities) is the source of truth.
- **Redis** caches read-heavy endpoints; writes invalidate affected keys.
- **Sync** ingests TMDB data idempotently on a schedule; the upstream API is
  never on the request path, so reads stay available during outages.

See [`specs/001-tmdb-service`](./specs/001-tmdb-service) for the full
specification, implementation plan and task breakdown.

## Project structure
```
src/
  config/    validated environment configuration
  common/    filters, interceptors, pipes, decorators
  database/  datasource and schema sync
  modules/   feature modules (controller / service / repository)
  health/    health check
test/        end-to-end tests
```

## API overview
| Method | Path | Description |
|--------|------|-------------|
| GET | `/movies` | List with pagination, search, genre filter, sort; includes average rating |
| GET | `/movies/:id` | Movie detail |
| POST/PATCH/DELETE | `/movies` | Admin CRUD |
| GET | `/genres` | List genres |
| POST | `/movies/:id/ratings` | Rate a movie (1–10) |
| GET/POST/DELETE | `/watchlist`, `/favourites` | Manage personal lists |
| GET | `/health` | Health check |

## License
MIT
