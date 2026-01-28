import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // Verifica se a rota é pública
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles) {
      return true; // Sem @Roles() = permite qualquer usuário autenticado
    }

    const request = context.switchToHttp().getRequest();
    const userRoles = request.userAuth?.roles || [];

    const hasRole = requiredRoles.some((role) =>
      userRoles.includes(role.toLocaleUpperCase()),
    );

    if (!hasRole) {
      // this.logger.warn(
      //   `Acesso negado - Usuário: ${request.userAuth?.preferred_username || 'desconhecido'} | ` +
      //     `Roles do usuário: [${userRoles.join(', ')}] | ` +
      //     `Roles necessárias: [${requiredRoles.join(', ')}]`,
      // );
      throw new ForbiddenException(
        `Acesso negado. Roles necessárias: ${requiredRoles.join(', ')}`,
      );
    }

    // this.logger.debug(
    //   `Acesso autorizado - Usuário: ${request.userAuth?.preferred_username} | Role: ${userRoles.find((r) => requiredRoles.includes(r))}`,
    // );

    return true;
  }
}
