import { plainToInstance } from 'class-transformer';
import { ListMoviesQueryDto, MovieSortBy, SortOrder } from './list-movies-query.dto';

const parse = (raw: Record<string, unknown>): ListMoviesQueryDto =>
  plainToInstance(ListMoviesQueryDto, raw, { enableImplicitConversion: false });

describe('ListMoviesQueryDto', () => {
  it('coerces numeric query strings', () => {
    const dto = parse({ page: '2', limit: '10' });
    expect(dto.page).toBe(2);
    expect(dto.limit).toBe(10);
  });

  it('parses a comma-separated genres string into integer ids and drops invalid parts', () => {
    const dto = parse({ genres: '28, 53, abc' });
    expect(dto.genres).toEqual([28, 53]);
  });

  it('leaves an already-parsed genres array untouched', () => {
    const dto = parse({ genres: [12] });
    expect(dto.genres).toEqual([12]);
  });

  it('keeps sort defaults when omitted', () => {
    const dto = parse({});
    expect(dto.sortBy).toBe(MovieSortBy.POPULARITY);
    expect(dto.order).toBe(SortOrder.DESC);
  });
});
