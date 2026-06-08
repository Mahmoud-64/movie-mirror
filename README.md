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

| Method            | Path                            | Auth   | Description                                                               |
| ----------------- | ------------------------------- | ------ | ------------------------------------------------------------------------- |
| POST              | `/auth/register`, `/auth/login` | public | Obtain a JWT access token                                                 |
| GET               | `/movies`                       | public | List with pagination, search, genre filter, sort; includes average rating |
| GET               | `/movies/:id`                   | public | Movie detail                                                              |
| POST/PATCH/DELETE | `/movies`                       | admin  | Movie CRUD                                                                |
| GET               | `/genres`                       | public | List genres (ids for filtering)                                           |
| POST              | `/movies/:id/ratings`           | user   | Rate a movie (1–10); average recomputes                                   |
| GET/POST/DELETE   | `/watchlist`, `/favourites`     | user   | Manage personal lists                                                     |
| GET               | `/health`                       | public | Health check                                                              |

Full request/response schemas are documented in Swagger at `/api/docs`.

## Contributing

### Branching model

A GitFlow with a promotion path `feature → dev → staging → main`:

- **`main`** — production; tagged releases only. Advances solely by merges from `staging`.
- **`staging`** — pre-production / QA validation, deployed to the staging environment. Receives merges from `dev`.
- **`dev`** — integration branch where features land.
- **feature branches** — branch off `dev`, named by type: `feat/<slug>`, `fix/<slug>`, `chore/<slug>`, `docs/<slug>`.

```bash
git switch dev && git pull
git switch -c feat/watchlist-pagination
# …work, commit…
git push -u origin feat/watchlist-pagination   # then open a PR into dev
```

Work is promoted up the chain; never commit directly to `staging` or `main`:

```bash
# 1. promote integrated work to staging for QA
git switch staging && git merge --no-ff dev && git push

# 2. cut a release: promote validated staging to main and tag
git switch main && git merge --no-ff staging
git tag -a v1.2.0 -m "v1.2.0" && git push --follow-tags
```

### Commit messages

Follow [Conventional Commits](https://www.conventionalcommits.org): `type(scope): summary`.

- **Types**: `feat`, `fix`, `chore`, `docs`, `test`, `refactor`, `perf`, `build`, `ci`.
- Keep commits small and scoped; write the summary in the imperative ("add", not "added").
- Breaking changes: add `!` (`feat!: …`) or a `BREAKING CHANGE:` footer.

```
feat(ratings): return average rating in the movie list
fix(cache): invalidate movie detail after an update
```

### Before you push

Quality is enforced automatically on commit (husky + lint-staged run ESLint + Prettier
on staged files), and editors format on save via `.vscode/settings.json`. Still run the
full checks locally before opening a PR:

```bash
npm run lint        # eslint --fix
npm run test:cov    # unit tests, coverage gate >= 85%
npm run test:e2e    # end-to-end (needs postgres + redis)
npm run build
```

### Pull requests

- One focused change per PR; target `dev`.
- Include tests for new behaviour and keep coverage at or above 85%.
- Ensure the branch is rebased on the latest `dev` and all checks pass before requesting review.

## License

MIT
