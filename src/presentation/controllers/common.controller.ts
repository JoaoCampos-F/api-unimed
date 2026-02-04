import {
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Query,
} from '@nestjs/common';
import { Roles } from 'src/infrastructure/auth/decorators/roles.decorator';
import { ListarEmpresasQuery } from 'src/application/queries/empresa/listar-empresas.query';
import { ListarContratosQuery } from 'src/application/queries/empresa/listar-contratos.query';
import { ListarColaboradoresQuery } from 'src/application/queries/colaborador/listar-colaboradores.query';
import { ListarProcessosQuery } from 'src/application/queries/processo/listar-processos.query';

/**
 * Controller para recursos compartilhados/transversais
 * Endpoints de listagem genéricos usados em múltiplos módulos
 * (relatórios, importação, exportação, processos, etc.)
 */
@Controller('common')
export class CommonController {
  constructor(
    private readonly listarEmpresasQuery: ListarEmpresasQuery,
    private readonly listarContratosQuery: ListarContratosQuery,
    private readonly listarColaboradoresQuery: ListarColaboradoresQuery,
    private readonly listarProcessosQuery: ListarProcessosQuery,
  ) {}

  @Get('empresas')
  @Roles('DP', 'ADMIN')
  async listarEmpresas() {
    try {
      const empresas = await this.listarEmpresasQuery.execute();

      return {
        sucesso: true,
        dados: empresas,
        total: empresas.length,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      throw new HttpException(
        `Erro ao listar empresas: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('contratos')
  @Roles('DP', 'ADMIN')
  async listarContratos() {
    try {
      const contratos = await this.listarContratosQuery.execute();

      return {
        sucesso: true,
        dados: contratos,
        total: contratos.length,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      throw new HttpException(
        `Erro ao listar contratos: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('colaboradores')
  @Roles('DP', 'ADMIN')
  async listarColaboradores(
    @Query('codEmpresa') codEmpresa: string,
    @Query('codColigada') codColigada: string,
  ) {
    try {
      if (!codEmpresa || !codColigada) {
        throw new HttpException(
          'Parâmetros codEmpresa e codColigada são obrigatórios',
          HttpStatus.BAD_REQUEST,
        );
      }

      const colaboradores = await this.listarColaboradoresQuery.execute(
        parseInt(codEmpresa, 10),
        parseInt(codColigada, 10),
      );

      return {
        sucesso: true,
        dados: colaboradores,
        total: colaboradores.length,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      throw new HttpException(
        `Erro ao listar colaboradores: ${error.message}`,
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('processos')
  @Roles('DP', 'ADMIN')
  async listarProcessos(@Query('categoria') categoria?: string) {
    try {
      const processos = await this.listarProcessosQuery.execute(categoria);

      return {
        sucesso: true,
        dados: processos,
        total: processos.length,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      throw new HttpException(
        `Erro ao listar processos: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
