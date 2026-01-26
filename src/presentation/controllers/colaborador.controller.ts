/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import {
  Controller,
  Get,
  HttpException,
  Logger,
  Patch,
  Query,
  HttpStatus,
  Body,
} from '@nestjs/common';
import { AtualizarColaboradorDto } from 'src/application/dtos/colaboradores/atualizar-colaborador.dto';
import { AtualizarTodosColaboradoresDto } from 'src/application/dtos/colaboradores/atualizar-todos-colaboradores.dto';
import { AtualizarValorEmpresaDto } from 'src/application/dtos/colaboradores/atualizar-valor-empresa.dto';
import { BuscarColaboradoresDto } from 'src/application/dtos/colaboradores/buscar-colaboradores.dto';
import { AtualizarColaboradorUseCase } from 'src/application/use-cases/colaborador/atualizar-colaborador.use-case';
import { AtualizarTodosColaboradoresUseCase } from 'src/application/use-cases/colaborador/atualizar-todos-colaboradores.use-case';
import { AtualizarValorEmpresaUseCase } from 'src/application/use-cases/colaborador/atualizar-valor-empresa.use-case';
import {
  BuscarColaboradoresResponse,
  BuscarColaboradoresUseCase,
} from 'src/application/use-cases/colaborador/buscar-colaboradores.use-case';
@Controller('colaboradores')
export class ColaboradorController {
  private readonly logger = new Logger(ColaboradorController.name);

  constructor(
    private readonly atualizarColaboradorUseCase: AtualizarColaboradorUseCase,
    private readonly buscarColaboradoresUseCase: BuscarColaboradoresUseCase,
    private readonly atualizarValorEmpresaUseCase: AtualizarValorEmpresaUseCase,
    private readonly atualizarTodosUseCase: AtualizarTodosColaboradoresUseCase,
  ) {}

  @Get('')
  async buscarColaboradores(
    @Query() query: BuscarColaboradoresDto,
  ): Promise<BuscarColaboradoresResponse> {
    try {
      const response = await this.buscarColaboradoresUseCase.execute(query);
      return response;
    } catch (error) {
      this.logger.error(
        `Erro ao buscar colaboradores: ${error.message}`,
        error.stack,
      );
      throw new HttpException(
        `Erro ao buscar colaboradores: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Patch('atualizar')
  async atualizarColaborador(@Body() dto: AtualizarColaboradorDto) {
    try {
      const resultado = await this.atualizarColaboradorUseCase.execute(dto);

      return {
        sucesso: resultado.sucesso,
        mensagem: resultado.mensagem,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error(
        `Erro ao atualizar colaborador: ${error.message}`,
        error.stack,
      );
      throw new HttpException(
        `Erro ao atualizar colaborador: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Patch('atualizar-todos')
  async atualizarTodosColaboradores(
    @Body() body: AtualizarTodosColaboradoresDto,
  ) {
    try {
      const resultado = await this.atualizarTodosUseCase.execute(body);

      return {
        sucesso: resultado.sucesso,
        mensagem: resultado.mensagem,
        quantidadeAtualizada: resultado.quantidadeAtualizada,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error(
        `Erro ao atualizar todos colaboradores: ${error.message}`,
        error.stack,
      );
      throw new HttpException(
        `Erro ao atualizar todos colaboradores: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Patch('atualizar-valor-empresa')
  async atualizarValorEmpresa(@Body() dto: AtualizarValorEmpresaDto) {
    try {
      const resultado = await this.atualizarValorEmpresaUseCase.execute(dto);

      return {
        sucesso: resultado.sucesso,
        mensagem: resultado.mensagem,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error(
        `Erro ao atualizar valor empresa: ${error.message}`,
        error.stack,
      );
      throw new HttpException(
        `Erro ao atualizar valor empresa: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
