import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AdminGuard } from './admin.guard';

const contextWith = (headers: Record<string, unknown>): ExecutionContext =>
  ({ switchToHttp: () => ({ getRequest: () => ({ headers }) }) }) as unknown as ExecutionContext;

describe('AdminGuard', () => {
  const guard = new AdminGuard({ getOrThrow: () => 'secret-key' } as unknown as ConfigService);

  it('allows requests carrying the matching admin token', () => {
    expect(guard.canActivate(contextWith({ 'x-admin-token': 'secret-key' }))).toBe(true);
  });

  it('forbids requests with a wrong or missing token', () => {
    expect(() => guard.canActivate(contextWith({ 'x-admin-token': 'nope' }))).toThrow(
      ForbiddenException,
    );
    expect(() => guard.canActivate(contextWith({}))).toThrow(ForbiddenException);
  });
});
