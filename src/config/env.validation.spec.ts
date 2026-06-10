import { validateEnv } from './env.validation';

const base = {
  DATABASE_URL: 'postgres://user:pass@localhost:5432/db',
  REDIS_URL: 'redis://localhost:6379',
  TMDB_API_TOKEN: 'token',
  JWT_SECRET: 'a-sufficiently-long-secret',
};

describe('validateEnv', () => {
  it('applies defaults for optional values', () => {
    const env = validateEnv(base);
    expect(env.PORT).toBe(8080);
    expect(env.NODE_ENV).toBe('development');
    expect(env.TMDB_SYNC_PAGES).toBe(5);
  });

  it('coerces numeric strings', () => {
    expect(validateEnv({ ...base, PORT: '3000' }).PORT).toBe(3000);
  });

  it('throws when required values are missing', () => {
    expect(() => validateEnv({})).toThrow(/Invalid environment/);
  });

  it('throws when the JWT secret is too short', () => {
    expect(() => validateEnv({ ...base, JWT_SECRET: 'short' })).toThrow();
  });
});
