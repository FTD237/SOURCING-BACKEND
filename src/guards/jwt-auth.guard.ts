import {
  ExecutionContext,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  private readonly logger = new Logger(JwtAuthGuard.name);

  handleRequest(err: any, user: any, info: any, context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    this.logger.debug(
      `${request.method} ${request.url} → err=${err}, user=${JSON.stringify(user)}, info=${info}`,
    );
    if (err || !user) {
      throw err || new UnauthorizedException(info?.message || 'Unauthorized');
    }
    return user;
  }
}
