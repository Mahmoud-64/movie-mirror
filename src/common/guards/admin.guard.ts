import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AdminGuard implements CanActivate {
  private readonly adminKey: string;

  constructor(config: ConfigService) {
    this.adminKey = config.getOrThrow<string>('ADMIN_API_KEY');
  }

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<{ headers: Record<string, unknown> }>();
    if (request.headers['x-admin-token'] !== this.adminKey) {
      throw new ForbiddenException('Admin access required');
    }
    return true;
  }
}
