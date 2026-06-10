import { Movie } from './movie.entity';

describe('Movie.averageRating', () => {
  const build = (sum: number, count: number): Movie => {
    const movie = new Movie();
    movie.ratingSum = sum;
    movie.ratingCount = count;
    return movie;
  };

  it('returns 0 when there are no ratings', () => {
    expect(build(0, 0).averageRating).toBe(0);
  });

  it('computes the mean of submitted ratings', () => {
    expect(build(24, 3).averageRating).toBe(8);
  });

  it('supports fractional averages', () => {
    expect(build(7, 2).averageRating).toBe(3.5);
  });
});
