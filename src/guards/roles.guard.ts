import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ExceptionFactory } from '../common/exceptions/exception-factory';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.get<string[]>(
      ROLES_KEY,
      context.getHandler(),
    );

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context
      .switchToHttp()
      .getRequest<{ user?: { role?: string } }>();

    const user = request.user;

    if (!user) ExceptionFactory.forbidden('Utilisateur non authentifié');
    if (!user.role)
      ExceptionFactory.forbidden('Utilisateur sans rôles définis');

    const hasRole = requiredRoles.includes(user.role);

    if (!hasRole) ExceptionFactory.forbidden(`Accès refusé : rôle insuffisant`);

    return true;
  }
}
