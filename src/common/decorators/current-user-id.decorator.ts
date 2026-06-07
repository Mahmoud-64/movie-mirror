import { ExecutionContext, createParamDecorator } from '@nestjs/common';

export interface AuthUser {
  userId: string;
  role: string;
}

export function currentUserId(context: ExecutionContext): string {
  return context.switchToHttp().getRequest<{ user: AuthUser }>().user.userId;
}

export const CurrentUserId = createParamDecorator((_data: unknown, context: ExecutionContext) =>
  currentUserId(context),
);
