import {
  Injectable,
  CanActivate,
  ExecutionContext,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UsuarioRepository } from '../repositories/usuario.repository';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

@Injectable()
export class LocalUserGuard implements CanActivate {
  private readonly logger = new Logger(LocalUserGuard.name);

  constructor(
    private readonly reflector: Reflector,
    private readonly usuarioRepository: UsuarioRepository,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Verifica se a rota é pública
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<any>();
    const keycloakUser = request.user; // Dados validados pelo AuthGuard

    if (!keycloakUser || !keycloakUser.sub) {
      this.logger.warn('Keycloak user não encontrado no request');
      return false;
    }

    try {
      // 1. Busca usuário no banco local
      let userAuth: any = await this.usuarioRepository.findByPublicId(
        keycloakUser.sub,
      );

      // 2. Se não existir, cria automaticamente
      if (!userAuth) {
        this.logger.log(
          `Criando novo usuário: ${keycloakUser.preferred_username}`,
        );
        userAuth = await this.usuarioRepository.create({
          public_id: keycloakUser.sub,
          preferred_username: keycloakUser.preferred_username,
          nome: keycloakUser.name,
          email: keycloakUser.email,
          cpf: keycloakUser.cpf,
          cod_empresa: keycloakUser.cod_empresa,
          ativo: 'S',
        });
      }

      // 3. Atualiza dados se mudaram no Keycloak
      if (
        userAuth.email !== keycloakUser.email ||
        userAuth.nome !== keycloakUser.name
      ) {
        this.logger.log(`Atualizando dados do usuário: ${userAuth.id}`);
        await this.usuarioRepository.update(userAuth.id, {
          email: keycloakUser.email,
          nome: keycloakUser.name,
          cod_empresa: keycloakUser.cod_empresa,
        });
      }

      // 4. Injeta no request (com roles do Keycloak)
      request.userAuth = {
        ...userAuth,
        roles: keycloakUser.realm_access?.roles || [],
      };

      return true;
    } catch (error: any) {
      this.logger.error(
        `Erro ao processar usuário local: ${error.message}`,
        error.stack,
      );
      return false;
    }
  }
}
