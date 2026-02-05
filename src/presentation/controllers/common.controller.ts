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
import { TipoBandeiraRepository } from '../../infrastructure/repositories/tipo-bandeira.repository';

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
    private readonly tipoBandeiraRepository: TipoBandeiraRepository,
  ) {}

  @Get('empresas')
  @Roles('DP', 'ADMIN')
  async listarEmpresas(@Query('codBand') codBand?: string) {
    try {
      const empresas = await this.listarEmpresasQuery.execute(
        codBand ? parseInt(codBand, 10) : undefined,
      );

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

  @Get('bandeiras')
  @Roles('DP', 'ADMIN')
  async listarBandeiras() {
    try {
      const bandeiras = await this.tipoBandeiraRepository.listarBandeiras();

      return {
        sucesso: true,
        dados: bandeiras,
        total: bandeiras.length,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      throw new HttpException(
        `Erro ao listar bandeiras: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Lista contratos ativos, opcionalmente filtrados por empresa
   * Usado em: formulários de relatórios, importação
   */
  @Get('contratos')
  @Roles('DP', 'ADMIN')
  async listarContratos(@Query('codEmpresa') codEmpresa?: string) {
    try {
      const codEmpresaNum = codEmpresa ? parseInt(codEmpresa, 10) : undefined;
      const contratos = await this.listarContratosQuery.execute(codEmpresaNum);

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

  /**
   * Lista colaboradores ativos, opcionalmente filtrados por empresa
   * Se não informar empresa, retorna apenas os primeiros 100 registros
   * Usado em: formulários de relatórios, exportação
   */
  @Get('colaboradores')
  @Roles('DP', 'ADMIN')
  async listarColaboradores(
    @Query('codEmpresa') codEmpresa?: string,
    @Query('codColigada') codColigada?: string,
  ) {
    try {
      const codEmpresaNum = codEmpresa ? parseInt(codEmpresa, 10) : undefined;
      const codColigadaNum = codColigada
        ? parseInt(codColigada, 10)
        : undefined;

      const colaboradores = await this.listarColaboradoresQuery.execute(
        codEmpresaNum,
        codColigadaNum,
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
