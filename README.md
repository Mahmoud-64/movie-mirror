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
npm run test:e2e      # end-to-end tests (needs postgres + redis running)
```

## Architecture
- **NestJS** feature modules: `auth`, `movies`, `genres`, `ratings`, `watchlist`, `tmdb`, `sync`.
- **PostgreSQL** (TypeORM, schema synced from entities) is the source of truth.
- **Redis** caches read-heavy endpoints; writes invalidate affected keys.
- **Sync** ingests TMDB data idempotently on a schedule; the upstream API is
  never on the request path, so reads stay available during outages.
- **Security**: helmet, request rate limiting (throttler), and JWT auth. Personal
  endpoints require a bearer token; admin endpoints require the `admin` role.

## Authentication
```bash
# register (returns { accessToken }) then send it as a bearer token
curl -X POST localhost:8080/auth/register -H 'Content-Type: application/json' \
  -d '{"email":"me@example.com","password":"password123"}'
curl localhost:8080/watchlist -H 'Authorization: Bearer <accessToken>'
```

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
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/auth/register`, `/auth/login` | public | Obtain a JWT access token |
| GET | `/movies` | public | List with pagination, search, genre filter, sort; includes average rating |
| GET | `/movies/:id` | public | Movie detail |
| POST/PATCH/DELETE | `/movies` | admin | Movie CRUD |
| GET | `/genres` | public | List genres (ids for filtering) |
| POST | `/movies/:id/ratings` | user | Rate a movie (1–10); average recomputes |
| GET/POST/DELETE | `/watchlist`, `/favourites` | user | Manage personal lists |
| GET | `/health` | public | Health check |

Full request/response schemas are documented in Swagger at `/api/docs`.

## License
MIT
