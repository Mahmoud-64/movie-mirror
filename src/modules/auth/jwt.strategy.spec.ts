import { ConfigService } from '@nestjs/config';
import { JwtStrategy } from './jwt.strategy';

describe('JwtStrategy', () => {
  const strategy = new JwtStrategy({ getOrThrow: () => 'test-secret' } as unknown as ConfigService);

  it('maps the JWT payload to the request user', () => {
    expect(strategy.validate({ sub: 'user-1', role: 'admin' })).toEqual({
      userId: 'user-1',
      role: 'admin',
    });
  });
});
