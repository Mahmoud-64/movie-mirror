import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '../../modules/users/entities/user.entity';
import { RolesGuard } from './roles.guard';

const context = (user: unknown): ExecutionContext =>
  ({
    switchToHttp: () => ({ getRequest: () => ({ user }) }),
    getHandler: () => undefined,
    getClass: () => undefined,
  }) as unknown as ExecutionContext;

describe('RolesGuard', () => {
  const guardWith = (required: UserRole[] | undefined) => {
    const reflector = {
      getAllAndOverride: jest.fn().mockReturnValue(required),
    } as unknown as Reflector;
    return new RolesGuard(reflector);
  };

  it('allows the route when no roles are required', () => {
    expect(guardWith(undefined).canActivate(context(undefined))).toBe(true);
  });

  it('allows a user holding the required role', () => {
    expect(guardWith([UserRole.ADMIN]).canActivate(context({ userId: 'u', role: 'admin' }))).toBe(
      true,
    );
  });

  it('forbids a user without the required role', () => {
    expect(() =>
      guardWith([UserRole.ADMIN]).canActivate(context({ userId: 'u', role: 'user' })),
    ).toThrow(ForbiddenException);
  });
});
