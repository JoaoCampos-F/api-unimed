import {
  Controller,
  Get,
  HttpException,
  Logger,
  Patch,
  Query,
  HttpStatus,
  Body,
  ForbiddenException,
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
import { ListarColaboradoresPaginadoQuery } from 'src/application/queries/colaborador/listar-colaboradores-paginado.query';
import { AtualizarExportaColaboradorCommand } from 'src/application/commands/colaborador/atualizar-exporta-colaborador.command';
import { Roles } from 'src/infrastructure/auth/decorators/roles.decorator';
import { AuthUser } from 'src/infrastructure/auth/decorators/auth-user.decorator';
import type { UserAuth } from 'src/infrastructure/auth/types/user-auth.type';

@Controller('colaboradores')
export class ColaboradorController {
  private readonly logger = new Logger(ColaboradorController.name);

  constructor(
    private readonly atualizarColaboradorUseCase: AtualizarColaboradorUseCase,
    private readonly buscarColaboradoresUseCase: BuscarColaboradoresUseCase,
    private readonly atualizarValorEmpresaUseCase: AtualizarValorEmpresaUseCase,
    private readonly atualizarTodosUseCase: AtualizarTodosColaboradoresUseCase,
    private readonly listarColaboradoresPaginadoQuery: ListarColaboradoresPaginadoQuery,
    private readonly atualizarExportaColaboradorCommand: AtualizarExportaColaboradorCommand,
  ) {}

  /**
   * GET /colaboradores/listar
   * Lista colaboradores com paginação e filtros
   * Baseado em: npd-legacy acao=Buscar (linhas 260-350)
   */
  @Get('listar')
  @Roles('DP', 'ADMIN')
  async listarColaboradores(
    @Query('codEmpresa') codEmpresa?: string,
    @Query('codColigada') codColigada?: string,
    @Query('mesRef') mesRef?: string,
    @Query('anoRef') anoRef?: string,
    @Query('cpf') cpf?: string,
    @Query('nome') nome?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('orderBy') orderBy?: string,
    @Query('orderDirection') orderDirection?: 'asc' | 'desc',
  ) {
    try {
      const resultado = await this.listarColaboradoresPaginadoQuery.execute({
        codEmpresa: codEmpresa ? parseInt(codEmpresa, 10) : undefined,
        codColigada: codColigada ? parseInt(codColigada, 10) : undefined,
        mesRef,
        anoRef,
        cpf,
        nome,
        page: page ? parseInt(page, 10) : 1,
        pageSize: pageSize ? parseInt(pageSize, 10) : 10,
        orderBy: orderBy || 'COLABORADOR',
        orderDirection: orderDirection || 'asc',
      });

      return {
        sucesso: true,
        ...resultado,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error(
        `Erro ao listar colaboradores: ${error.message}`,
        error.stack,
      );
      throw new HttpException(
        `Erro ao listar colaboradores: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('')
  @Roles('COLABORADOR', 'DP', 'ADMIN')
  async buscarColaboradores(
    @Query() query: BuscarColaboradoresDto,
    @AuthUser() user: UserAuth,
  ): Promise<BuscarColaboradoresResponse> {
    try {
      // colaborador só pode buscar seu próprio CPF
      if (
        user.roles.includes('COLABORADOR') &&
        !user.roles.includes('DP') &&
        !user.roles.includes('ADMIN')
      ) {
        if (query.cpf && query.cpf !== user.cpf) {
          throw new ForbiddenException(
            'Colaborador só pode acessar seus próprios dados',
          );
        }
        query.cpf = user.cpf;
      }
      if (user.roles.includes('DP') && !user.roles.includes('ADMIN')) {
        if (user.cod_empresa) {
          query.codEmpresa = user.cod_empresa;
        }
      }

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

  /**
   * PATCH /colaboradores/atualizar-exporta
   * Atualiza flag exporta de um colaborador específico
   * Baseado em: npd-legacy acao=update (linhas 352-357)
   */
  @Patch('atualizar-exporta')
  @Roles('DP', 'ADMIN')
  async atualizarExportaColaborador(
    @Body()
    body: {
      codigoCpf: string;
      mesRef: string;
      anoRef: string;
      exporta: 'S' | 'N';
    },
  ) {
    try {
      // Validações
      if (!body.codigoCpf || !body.mesRef || !body.anoRef || !body.exporta) {
        throw new HttpException(
          'Parâmetros obrigatórios: codigoCpf, mesRef, anoRef, exporta',
          HttpStatus.BAD_REQUEST,
        );
      }

      if (!['S', 'N'].includes(body.exporta)) {
        throw new HttpException(
          'Exporta deve ser S ou N',
          HttpStatus.BAD_REQUEST,
        );
      }

      const resultado = await this.atualizarExportaColaboradorCommand.execute({
        codigoCpf: body.codigoCpf,
        mesRef: body.mesRef,
        anoRef: body.anoRef,
        exporta: body.exporta,
      });

      return {
        ...resultado,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      this.logger.error(
        `Erro ao atualizar exporta colaborador: ${error.message}`,
        error.stack,
      );
      throw new HttpException(
        `Erro ao atualizar exporta colaborador: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Patch('atualizar')
  @Roles('DP', 'ADMIN')
  async atualizarColaborador(@Body() dto: AtualizarColaboradorDto) {
    try {
      // No sistema legacy, a atualização individual não filtra por empresa
      // O controle é apenas por role (quem tem acesso dp pode atualizar qualquer colaborador)
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
  @Roles('DP', 'ADMIN')
  async atualizarTodosColaboradores(
    @Body() body: AtualizarTodosColaboradoresDto,
  ) {
    try {
      // No sistema legacy, a empresa é enviada no body pelo frontend
      // O dp central (EC) pode atualizar colaboradores de qualquer empresa do grupo
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
  @Roles('DP', 'ADMIN')
  async atualizarValorEmpresa(@Body() dto: AtualizarValorEmpresaDto) {
    try {
      // No sistema legacy, a empresa é enviada no body pelo frontend
      // O dp central (EC) pode atualizar valores de qualquer empresa do grupo
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
