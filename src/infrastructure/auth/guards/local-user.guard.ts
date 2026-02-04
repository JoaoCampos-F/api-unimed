import {
  Injectable,
  CanActivate,
  ExecutionContext,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UsuarioRepository } from '../repositories/usuario.repository';
import { ColaboradorRepository } from '../../repositories/colaborador.repository';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { UserAuth } from '../types/user-auth.type';
interface DadosBasicosColaborador {
  cod_empresa: number;
  codcoligada: number;
  codfilial: number;
}

@Injectable()
export class LocalUserGuard implements CanActivate {
  private readonly logger = new Logger(LocalUserGuard.name);

  constructor(
    private readonly reflector: Reflector,
    private readonly usuarioRepository: UsuarioRepository,
    private readonly colaboradorRepository: ColaboradorRepository,
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
      let userAuth: UserAuth | null =
        await this.usuarioRepository.findByPublicId(keycloakUser.sub);

      if (!userAuth) {
        this.logger.log(
          `Criando novo usuário: ${keycloakUser.preferred_username}`,
        );

        if (!keycloakUser.cpf) {
          throw new Error(
            `CPF não encontrado no token do Keycloak para o usuário ${keycloakUser.preferred_username}.`,
          );
        }

        let dadosColaborador: DadosBasicosColaborador | null = null;

        dadosColaborador =
          await this.colaboradorRepository.buscarDadosBasicosPorCpf(
            keycloakUser.cpf,
          );

        if (dadosColaborador == null) {
          throw new Error(
            `Colaborador com CPF ${keycloakUser.cpf} não encontrado no sistema.`,
          );
        }

        userAuth = await this.usuarioRepository.create({
          public_id: keycloakUser.sub,
          preferred_username: keycloakUser.preferred_username,
          nome: keycloakUser.name,
          email: keycloakUser.email,
          cpf: keycloakUser.cpf,
          cod_empresa: dadosColaborador?.cod_empresa,
          codcoligada: dadosColaborador?.codcoligada,
          codfilial: dadosColaborador?.codfilial,
          ativo: 'S',
        });
      }

      // 3. Atualiza dados se mudaram no Keycloak
      if (
        userAuth.email !== keycloakUser.email ||
        userAuth.nome !== keycloakUser.name
      ) {
        this.logger.log(`Atualizando dados do usuário: ${userAuth.id}`);

        // 3.1. Busca dados atualizados do colaborador
        let dadosColaborador: DadosBasicosColaborador | null = null;
        if (keycloakUser.cpf) {
          dadosColaborador =
            await this.colaboradorRepository.buscarDadosBasicosPorCpf(
              keycloakUser.cpf,
            );
        }

        await this.usuarioRepository.update(userAuth.id, {
          email: keycloakUser.email,
          nome: keycloakUser.name,
          cod_empresa: dadosColaborador?.cod_empresa,
          codcoligada: dadosColaborador?.codcoligada,
          codfilial: dadosColaborador?.codfilial,
        });
      }

      // 4. Injeta no request (com roles do Keycloak)
      // Prioriza roles do client específico (api-planos-saude)
      let roles: string[] = [];

      // Opção 1: resource_access['api-planos-saude'].roles (roles do client específico) - PRIORIDADE
      if (keycloakUser.resource_access?.['api-planos-saude']?.roles) {
        roles = keycloakUser.resource_access['api-planos-saude'].roles;
      }
      // Opção 2: realm_access.roles (roles globais do realm) - FALLBACK
      else if (keycloakUser.realm_access?.roles) {
        roles = keycloakUser.realm_access.roles;
      }

      const normalizedRoles = roles.map((role) => role.toUpperCase());

      // 🔥 NOVO: Extrai permissões do Authorization Services (se houver RPT)
      let permissions: any = null;
      if (keycloakUser.authorization?.permissions) {
        permissions = keycloakUser.authorization.permissions;
      } else {
        this.logger.warn(
          '⚠️ Token não contém permissões do Authorization Services. Certifique-se de que o frontend está solicitando um RPT.',
        );
      }

      request.userAuth = {
        ...userAuth,
        roles: normalizedRoles,
        permissions, // 🔥 NOVO: Adiciona permissões ao userAuth
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
