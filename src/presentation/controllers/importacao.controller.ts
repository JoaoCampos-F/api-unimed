import {
  Controller,
  Get,
  Query,
  HttpStatus,
  HttpException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ImportarDadosUnimedDto } from '../../application/dtos/importar-dados-unimed.dto';
import { ImportarDadosUnimedUseCase } from '../../application/use-cases/importar-dados-unimed.use-case';
import { ExecutarResumoUnimedUseCase } from '../../application/use-cases/executar-resumo-unimed.use-case';
import { BuscarEmpresasUnimedUseCase } from '../../application/use-cases/buscar-empresas-unimed.use-case';

@ApiTags('Importação Unimed')
@Controller('importacao')
export class ImportacaoController {
  constructor(
    private readonly importarDadosUnimedUseCase: ImportarDadosUnimedUseCase,
    private readonly executarResumoUnimedUseCase: ExecutarResumoUnimedUseCase,
    private readonly buscarEmpresasUnimedUseCase: BuscarEmpresasUnimedUseCase,
  ) {}

  @Get('dados-periodo-cnpj')
  @ApiOperation({
    summary: 'Importar dados Unimed por período',
    description:
      'Importa dados de cobrança da Unimed para todas as empresas ativas no período especificado',
  })
  @ApiResponse({
    status: 200,
    description: 'Importação realizada com sucesso',
    schema: {
      type: 'object',
      properties: {
        totalEmpresas: { type: 'number', example: 5 },
        totalRegistros: { type: 'number', example: 150 },
        empresasProcessadas: { type: 'number', example: 5 },
        erros: { type: 'array', items: { type: 'string' } },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Parâmetros inválidos' })
  @ApiResponse({ status: 500, description: 'Erro interno do servidor' })
  async importarDadosPeriodo(@Query() params: ImportarDadosUnimedDto) {
    try {
      const request = {
        mes: parseInt(params.mes, 10),
        ano: parseInt(params.ano, 10),
      };

      const resultado = await this.importarDadosUnimedUseCase.execute(request);

      return {
        sucesso: true,
        dados: resultado,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      throw new HttpException(
        `Erro na importação: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('empresas-unimed')
  @ApiOperation({
    summary: 'Buscar empresas Unimed',
    description: 'Retorna lista de empresas ativas para processamento Unimed',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de empresas obtida com sucesso',
  })
  @ApiResponse({ status: 500, description: 'Erro interno do servidor' })
  async buscarEmpresasUnimed() {
    try {
      const empresas = await this.buscarEmpresasUnimedUseCase.execute();

      return {
        sucesso: true,
        dados: empresas,
        total: empresas.length,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      throw new HttpException(
        `Erro ao buscar empresas: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('executar-resumo')
  @ApiOperation({
    summary: 'Executar resumo Unimed',
    description: 'Executa o procedimento de resumo dos dados importados',
  })
  @ApiResponse({
    status: 200,
    description: 'Resumo executado com sucesso',
  })
  @ApiResponse({ status: 400, description: 'Parâmetros inválidos' })
  @ApiResponse({ status: 500, description: 'Erro interno do servidor' })
  async executarResumo(@Query() params: ImportarDadosUnimedDto) {
    try {
      const request = {
        mes: parseInt(params.mes, 10),
        ano: parseInt(params.ano, 10),
      };

      const resultado = await this.executarResumoUnimedUseCase.execute(request);

      return {
        sucesso: resultado.sucesso,
        mensagem: resultado.mensagem,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      throw new HttpException(
        `Erro ao executar resumo: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
