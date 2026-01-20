import {
  Controller,
  Get,
  Query,
  HttpStatus,
  HttpException,
} from '@nestjs/common';
import { ImportarDadosUnimedDto } from '../../application/dtos/importar-dados-unimed.dto';
import { ImportarDadosUnimedUseCase } from '../../application/use-cases/importar-dados-unimed.use-case';
import { ExecutarResumoUnimedUseCase } from '../../application/use-cases/executar-resumo-unimed.use-case';
import { BuscarEmpresasUnimedUseCase } from '../../application/use-cases/buscar-empresas-unimed.use-case';
import { ImportarUnimedPorContratoUseCase } from '../../application/use-cases/importar-unimed-por-contrato.use-case';

@Controller('importacao')
export class ImportacaoController {
  constructor(
    private readonly importarDadosUnimedUseCase: ImportarDadosUnimedUseCase,
    private readonly executarResumoUnimedUseCase: ExecutarResumoUnimedUseCase,
    private readonly buscarEmpresasUnimedUseCase: BuscarEmpresasUnimedUseCase,
    private readonly importarDadosContratoUseCase: ImportarUnimedPorContratoUseCase,
  ) {}

  @Get('dados-periodo-cnpj')
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

  @Get('dados-periodo-contrato')
  async importarDadosContrato(@Query() params: ImportarDadosUnimedDto) {
    try {
      const request = {
        mes: parseInt(params.mes, 10),
        ano: parseInt(params.ano, 10),
      };

      const resultado ={
          mes: params.mes,
          ano: params.ano,
        });

      return {
        sucesso: true,
        dados: resultado,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      throw new HttpException(
        `Erro na importação por contration(
        `Erro na importação: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('empresas-unimed')
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
