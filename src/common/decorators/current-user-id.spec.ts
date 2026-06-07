import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { extractUserId } from './current-user-id.decorator';

const contextWith = (headers: Record<string, unknown>): ExecutionContext =>
  ({ switchToHttp: () => ({ getRequest: () => ({ headers }) }) }) as unknown as ExecutionContext;

describe('extractUserId', () => {
  const uuid = '11111111-2222-3333-4444-555555555555';

  it('returns the user id from a valid X-User-Id header', () => {
    expect(extractUserId(contextWith({ 'x-user-id': uuid }))).toBe(uuid);
  });

  it('rejects a missing header', () => {
    expect(() => extractUserId(contextWith({}))).toThrow(UnauthorizedException);
  });

  it('rejects a non-uuid header', () => {
    expect(() => extractUserId(contextWith({ 'x-user-id': 'not-a-uuid' }))).toThrow(
      UnauthorizedException,
    );
  });
});
