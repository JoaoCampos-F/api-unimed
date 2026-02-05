import {
  Controller,
  Post,
  Body,
  HttpException,
  HttpStatus,
  Get,
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import { ExportarParaTOTVSUseCase } from 'src/application/use-cases/exportacao/exportar-para-totvs.use-case';
import { BuscarProcessosParaExportacaoUseCase } from 'src/application/use-cases/exportacao/buscar-processos-para-exportacao.use-case';
import { ExportarParaTOTVSDto } from 'src/application/dtos/exportacao/exportar-para-totvs.dto';
import {
  ListarProcessosDto,
  ProcessoResponseDto,
} from 'src/application/dtos/exportacao/listar-processos.dto';
import { Roles } from 'src/infrastructure/auth/decorators/roles.decorator';
import { AuthUser } from 'src/infrastructure/auth/decorators/auth-user.decorator';
import type { UserAuth } from 'src/infrastructure/auth/types/user-auth.type';
import type { IExportacaoRepository } from 'src/domain/repositories/exportacao.repository.interface';
import { Inject } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('Exportação')
@Controller('exportacao')
export class ExportacaoController {
  constructor(
    private readonly exportarParaTOTVSUseCase: ExportarParaTOTVSUseCase,
    private readonly buscarProcessosParaExportacaoUseCase: BuscarProcessosParaExportacaoUseCase,
    @Inject('IExportacaoRepository')
    private readonly exportacaoRepository: IExportacaoRepository,
  ) {}

  /**
   * GET /exportacao/processos
   *
   * Lista processos disponíveis para exportação
   * Replicando comportamento do NPD-Legacy: carregaDadosMCW()
   *
   * Requer role DP ou ADMIN
   */
  @Get('processos')
  @Roles('DP', 'ADMIN')
  async listarProcessos(
    @Query() dto: any,
    @AuthUser() user: UserAuth,
  ): Promise<ProcessoResponseDto[]> {
    try {
      return await this.buscarProcessosParaExportacaoUseCase.execute(dto);
    } catch (error) {
      throw new HttpException(
        {
          sucesso: false,
          mensagem: `Erro ao listar processos: ${error.message}`,
          timestamp: new Date().toISOString(),
        },
        error instanceof HttpException
          ? error.getStatus()
          : HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * POST /exportacao/totvs
   *
   * Executa exportação de dados Unimed para o TOTVS RM
   *
   * ⚠️ Em ambiente de desenvolvimento, retorna preview sem executar
   * (DB_LINK aponta para produção)
   *
   * Requer role DP ou ADMIN
   */
  @Post('totvs')
  @Roles('DP', 'ADMIN')
  async exportarParaTOTVS(
    @Body() dto: ExportarParaTOTVSDto,
    @AuthUser() user: UserAuth,
  ) {
    try {
      const usuario = user.preferred_username || user.email || 'sistema';

      const resultado = await this.exportarParaTOTVSUseCase.execute(
        dto,
        usuario,
        user.roles,
      );

      const nodeEnv = process.env.NODE_ENV || 'development';
      const isProduction = nodeEnv === 'production';
      const isTest = nodeEnv === 'test' || nodeEnv === 'staging';
      const allowExecution = process.env.ALLOW_TOTVS_EXPORT === 'true';
      const shouldPreview = !isProduction && !isTest && !allowExecution;

      return {
        sucesso: resultado.sucesso,
        mensagem: resultado.mensagem,
        ...(shouldPreview
          ? {
              modo: 'PREVIEW',
              aviso:
                'Exportação não executada (ambiente development). Dados simulados.',
              preview: resultado.preview,
            }
          : isTest
            ? {
                modo: 'EXECUÇÃO REAL (TESTE)',
                ambiente: nodeEnv,
                aviso:
                  '⚠️ Executando em base de teste. Certifique-se que @rmteste está configurado.',
              }
            : {
                modo: 'EXECUÇÃO REAL',
                ambiente: nodeEnv,
              }),
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      throw new HttpException(
        {
          sucesso: false,
          mensagem: `Erro na exportação: ${error.message}`,
          timestamp: new Date().toISOString(),
        },
        error instanceof HttpException
          ? error.getStatus()
          : HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * GET /exportacao/logs
   *
   * Busca histórico de exportações
   * Requer role DP ou ADMIN
   */
  @Get('logs')
  @Roles('DP', 'ADMIN')
  async buscarLogs(
    @Query('categoria') categoria: string = 'UNI',
    @Query('mes', new ParseIntPipe({ optional: true })) mes?: number,
    @Query('ano', new ParseIntPipe({ optional: true })) ano?: number,
    @Query('codigo') codigo?: string,
  ) {
    try {
      const logs = await this.exportacaoRepository.buscarLogsExportacao({
        categoria,
        mesRef: mes,
        anoRef: ano,
        codigo: codigo || '90000001', // Código padrão para exportação Unimed
      });

      return {
        sucesso: true,
        dados: logs,
        total: logs.length,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      throw new HttpException(
        `Erro ao buscar logs: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * GET /exportacao/status
   *
   * Retorna status do sistema de exportação
   * Requer role DP ou ADMIN
   */
  @Get('status')
  @Roles('DP', 'ADMIN')
  async obterStatus() {
    const nodeEnv = process.env.NODE_ENV || 'development';
    const isProduction = nodeEnv === 'production';
    const isTest = nodeEnv === 'test' || nodeEnv === 'staging';
    const allowExecution = process.env.ALLOW_TOTVS_EXPORT === 'true';
    const shouldPreview = !isProduction && !isTest && !allowExecution;

    let modoExecucao: string;
    let avisos: string[];

    if (shouldPreview) {
      modoExecucao = 'PREVIEW';
      avisos = [
        '🔴 Ambiente de desenvolvimento detectado',
        '✅ Exportações retornarão preview sem executar procedure',
        '💡 Para habilitar execução: NODE_ENV=test ou ALLOW_TOTVS_EXPORT=true',
      ];
    } else if (isTest) {
      modoExecucao = 'EXECUÇÃO REAL (TESTE)';
      avisos = [
        '⚠️ Ambiente de teste/staging detectado',
        '✅ Exportações serão executadas na base de TESTE',
        '📋 Certifique-se que DB_LINK @rmteste está configurado',
        '💡 Procedure deve usar: rm.pffinanc@rmteste, rm.pfperff@rmteste',
      ];
    } else {
      modoExecucao = 'EXECUÇÃO REAL (PRODUÇÃO)';
      avisos = [
        '🔴 Ambiente de PRODUÇÃO',
        '⚠️ Exportações afetarão base TOTVS RM de produção (@dblrm)',
      ];
    }

    return {
      sucesso: true,
      ambiente: nodeEnv,
      modoExecucao,
      permitirExportacao: isProduction || isTest || allowExecution,
      avisos,
      configuracao: {
        dbLinkEsperado: isTest ? '@rmteste' : '@dblrm',
        tabelasAfetadas: ['rm.pffinanc', 'rm.pfperff'],
      },
      codigoProcesso: '90000001',
      descricao: 'Exportação Plano Saúde Unimed',
      timestamp: new Date().toISOString(),
    };
  }
}
