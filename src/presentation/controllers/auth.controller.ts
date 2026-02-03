import { Controller, Get, Logger } from '@nestjs/common';
import { AuthUser } from 'src/infrastructure/auth/decorators/auth-user.decorator';
import type { UserAuth } from 'src/infrastructure/auth/types/user-auth.type';
import { ColaboradorRepository } from 'src/infrastructure/repositories/colaborador.repository';

@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(private readonly colaboradorRepository: ColaboradorRepository) {}

  /**
   * GET /auth/usuarios
   * Retorna permissões e roles do usuário autenticado
   * Prioridade 1: Permissões do Authorization Services (RPT)
   * Prioridade 2: Fallback para RBAC hardcoded
   */
  @Get('usuarios')
  async buscarPermissoes(@AuthUser() user: UserAuth) {
    // 🔥 Prioridade 1: Usar permissões do Authorization Services (se houver RPT)
    if (user.permissions && user.permissions.length > 0) {
      this.logger.log(
        `✅ Usando permissões do Keycloak Authorization Services (${user.permissions.length} recursos)`,
      );

      // Formatar permissões do Keycloak para o formato esperado pelo frontend
      const formattedPermissions: { [key: string]: string[] } = {};

      user.permissions.forEach((perm) => {
        const resourceName = perm.rsname || perm.rsid || 'unknown';
        formattedPermissions[resourceName] = perm.scopes || [];
      });

      return {
        permissions: formattedPermissions,
        roles: user.roles,
        rolesSystem: ['ADMIN', 'DP', 'COLABORADOR'],
        source: 'keycloak-authorization-services', // 🔥 Indica de onde vieram as permissões
      };
    }

    // 🔥 Prioridade 2: Fallback para permissões hardcoded (RBAC básico)
    this.logger.warn(
      '⚠️ Token não contém permissões do Authorization Services. Usando RBAC hardcoded como fallback.',
    );

    // Mapeia roles para permissões específicas
    const permissions: { [key: string]: string[] } = {};

    // ADMIN tem todas as permissões
    if (user.roles.includes('ADMIN')) {
      permissions.importacao = ['create', 'list', 'delete'];
      permissions.exportacao = ['create', 'list'];
      permissions.colaboradores = ['create', 'list', 'update', 'delete'];
      permissions.processos = ['create', 'list', 'execute'];
      permissions.relatorios = ['list', 'download', 'all'];
    }
    // DP tem permissões de importação, exportação e relatórios
    else if (user.roles.includes('DP')) {
      permissions.importacao = ['create', 'list'];
      permissions.exportacao = ['create', 'list'];
      permissions.colaboradores = ['list', 'update'];
      permissions.processos = ['list', 'execute'];
      permissions.relatorios = ['list', 'download'];
    }
    // COLABORADOR tem apenas visualização de relatórios
    else if (user.roles.includes('COLABORADOR')) {
      permissions.relatorios = ['list'];
    }

    return {
      permissions,
      roles: user.roles,
      rolesSystem: ['ADMIN', 'DP', 'COLABORADOR'],
      source: 'hardcoded-fallback', // 🔥 Indica de onde vieram as permissões
    };
  }

  /**
   * GET /auth/colaborador
   * Retorna dados completos do colaborador autenticado
   */
  @Get('colaborador')
  async buscarColaborador(@AuthUser() user: UserAuth) {
    if (!user.cpf) {
      return {
        colaborador: {
          cpf: null,
          nome: user.nome,
          email: user.email,
          preferred_username: user.preferred_username,
        },
        segmentos: [],
        empresas: [],
        departamentos: [],
        funcoes: [],
        equipes: [],
      };
    }

    try {
      const colaborador =
        await this.colaboradorRepository.buscarDadosBasicosPorCpf(user.cpf);

      if (!colaborador) {
        return {
          colaborador: {
            cpf: user.cpf,
            nome: user.nome,
            email: user.email,
            preferred_username: user.preferred_username,
          },
          segmentos: [],
          empresas: [],
          departamentos: [],
          funcoes: [],
          equipes: [],
        };
      }

      // Busca nome da empresa
      const empresaNome = await this.colaboradorRepository.buscarNomeEmpresa(
        colaborador.cod_empresa,
      );

      return {
        colaborador: {
          cpf: user.cpf,
          nome: user.nome,
          email: user.email,
          preferred_username: user.preferred_username,
          cod_empresa: colaborador.cod_empresa,
          codcoligada: colaborador.codcoligada,
          codfilial: colaborador.codfilial,
          cod_band: colaborador.cod_band,
        },
        segmentos: [],
        empresas: empresaNome ? [empresaNome] : [],
        departamentos: [],
        funcoes: [],
        equipes: [],
      };
    } catch (error: any) {
      // Se houver erro, retorna dados básicos do Keycloak
      return {
        colaborador: {
          cpf: user.cpf,
          nome: user.nome,
          email: user.email,
          preferred_username: user.preferred_username,
        },
        segmentos: [],
        empresas: [],
        departamentos: [],
        funcoes: [],
        equipes: [],
      };
    }
  }
}
