import { ExecutionContext } from '@nestjs/common';
import { currentUserId } from './current-user-id.decorator';

const contextWith = (user: unknown): ExecutionContext =>
  ({ switchToHttp: () => ({ getRequest: () => ({ user }) }) }) as unknown as ExecutionContext;

describe('currentUserId', () => {
  it('returns the user id placed on the request by the JWT strategy', () => {
    expect(currentUserId(contextWith({ userId: 'user-1', role: 'user' }))).toBe('user-1');
  });
});
