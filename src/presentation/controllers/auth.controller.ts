import { Controller, Get } from '@nestjs/common';
import { AuthUser } from 'src/infrastructure/auth/decorators/auth-user.decorator';
import { UserAuth } from 'src/infrastructure/auth/types/user-auth.type';
import { ColaboradorRepository } from 'src/infrastructure/repositories/colaborador.repository';

@Controller('auth')
export class AuthController {
  constructor(private readonly colaboradorRepository: ColaboradorRepository) {}

  /**
   * GET /auth/usuarios
   * Retorna permissões e roles do usuário autenticado
   */
  @Get('usuarios')
  async buscarPermissoes(@AuthUser() user: UserAuth) {
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
