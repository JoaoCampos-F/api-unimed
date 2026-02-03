/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import {
  Controller,
  Get,
  Query,
  HttpStatus,
  HttpException,
  Post,
  Body,
} from '@nestjs/common';
import { ImportarDadosUnimedDto } from '../../application/dtos/importacao/importar-dados-unimed.dto';
import { ImportarDadosUnimedUseCase } from '../../application/use-cases/importacao/importar-dados-unimed.use-case';
import { ExecutarResumoUnimedUseCase } from '../../application/use-cases/importacao/executar-resumo-unimed.use-case';
import { BuscarEmpresasUnimedUseCase } from '../../application/use-cases/importacao/buscar-empresas-unimed.use-case';
import { ImportarUnimedPorContratoUseCase } from '../../application/use-cases/importacao/importar-unimed-por-contrato.use-case';
import { Roles } from 'src/infrastructure/auth/decorators/roles.decorator';
import { ImportarPeriodoDto } from 'src/application/dtos/importacao/importar-periodo.dto';
import { ImportarPeriodoCompletoUseCase } from 'src/application/use-cases/importacao/importar-periodo-completo.use-case';
import { ListarEmpresasUseCase } from 'src/application/use-cases/empresa/listar-empresas.use-case';
import { ListarContratosUseCase } from 'src/application/use-cases/empresa/listar-contratos.use-case';
import { ListarColaboradoresUseCase } from 'src/application/use-cases/colaborador/listar-colaboradores.use-case';
import { ListarProcessosUseCase } from 'src/application/use-cases/processo/listar-processos.use-case';

@Controller('importacao')
export class ImportacaoController {
  constructor(
    private readonly importarDadosUnimedUseCase: ImportarDadosUnimedUseCase,
    private readonly executarResumoUnimedUseCase: ExecutarResumoUnimedUseCase,
    private readonly buscarEmpresasUnimedUseCase: BuscarEmpresasUnimedUseCase,
    private readonly importarDadosContratoUseCase: ImportarUnimedPorContratoUseCase,
    private readonly importarPeriodoCompletoUseCase: ImportarPeriodoCompletoUseCase,
    private readonly listarEmpresasUseCase: ListarEmpresasUseCase,
    private readonly listarContratosUseCase: ListarContratosUseCase,
    private readonly listarColaboradoresUseCase: ListarColaboradoresUseCase,
    private readonly listarProcessosUseCase: ListarProcessosUseCase,
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

  @Get('listar-empresas')
  @Roles('DP', 'ADMIN')
  async listarEmpresas() {
    try {
      const empresas = await this.listarEmpresasUseCase.execute();

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

  @Get('listar-contratos')
  @Roles('DP', 'ADMIN')
  async listarContratos() {
    try {
      const contratos = await this.listarContratosUseCase.execute();

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

  @Get('listar-colaboradores')
  @Roles('DP', 'ADMIN')
  async listarColaboradores(
    @Query('codEmpresa') codEmpresa: string,
    @Query('codColigada') codColigada: string,
  ) {
    try {
      const colaboradores = await this.listarColaboradoresUseCase.execute(
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
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('listar-processos')
  @Roles('DP', 'ADMIN')
  async listarProcessos(@Query('categoria') categoria?: string) {
    try {
      const processos = await this.listarProcessosUseCase.execute(categoria);

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

  @Post('importar-periodo')
  @Roles('DP', 'ADMIN')
  async importarPeriodoCompleto(@Body() dto: ImportarPeriodoDto) {
    return await this.importarPeriodoCompletoUseCase.execute(dto);
  }
}
