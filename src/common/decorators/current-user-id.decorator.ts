import { ExecutionContext, UnauthorizedException, createParamDecorator } from '@nestjs/common';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function extractUserId(context: ExecutionContext): string {
  const request = context.switchToHttp().getRequest<{ headers: Record<string, unknown> }>();
  const id = request.headers['x-user-id'];
  if (typeof id !== 'string' || !UUID_PATTERN.test(id)) {
    throw new UnauthorizedException('A valid X-User-Id header (uuid) is required');
  }
  return id;
}

export const CurrentUserId = createParamDecorator((_data: unknown, context: ExecutionContext) =>
  extractUserId(context),
);
