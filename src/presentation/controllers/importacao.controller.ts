/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import {
  Controller,
  Get,
  Query,
  HttpStatus,
  HttpException,
} from '@nestjs/common';
import { ImportarDadosUnimedDto } from '../../application/dtos/importacao/importar-dados-unimed.dto';
import { ImportarDadosUnimedUseCase } from '../../application/use-cases/importacao/importar-dados-unimed.use-case';
import { ExecutarResumoUnimedUseCase } from '../../application/use-cases/importacao/executar-resumo-unimed.use-case';
import { BuscarEmpresasUnimedUseCase } from '../../application/use-cases/importacao/buscar-empresas-unimed.use-case';
import { ImportarUnimedPorContratoUseCase } from '../../application/use-cases/importacao/importar-unimed-por-contrato.use-case';
import { Roles } from 'src/infrastructure/auth/decorators/roles.decorator';

@Controller('importacao')
export class ImportacaoController {
  constructor(
    private readonly importarDadosUnimedUseCase: ImportarDadosUnimedUseCase,
    private readonly executarResumoUnimedUseCase: ExecutarResumoUnimedUseCase,
    private readonly buscarEmpresasUnimedUseCase: BuscarEmpresasUnimedUseCase,
    private readonly importarDadosContratoUseCase: ImportarUnimedPorContratoUseCase,
  ) {}

  @Get('dados-periodo-cnpj')
  @Roles('DP', 'ADMIN')
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
  @Roles('DP', 'ADMIN')
  async importarDadosContrato(@Query() params: ImportarDadosUnimedDto) {
    try {
      const resultado = await this.importarDadosContratoUseCase.execute(params);

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
  @Roles('DP', 'ADMIN')
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
  @Roles('DP', 'ADMIN')
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
