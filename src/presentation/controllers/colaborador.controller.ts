import { Controller, Get, HttpException, Query } from '@nestjs/common';
import { BuscarColaboradoresDto } from 'src/application/dtos/buscar-colaboradores.dto';
import { AtualizarColaboradorUseCase } from 'src/application/use-cases/atualizar-colaborador.use-case';
import { AtualizarTodosColaboradoresUseCase } from 'src/application/use-cases/atualizar-todos-colaboradores.use-case';
import { AtualizarValorEmpresaUseCase } from 'src/application/use-cases/atualizar-valor-empresa.use-case';
import {
  BuscarColaboradoresResponse,
  BuscarColaboradoresUseCase,
} from 'src/application/use-cases/buscar-colaboradores.use-case';
@Controller('colaboradores')
export class ColaboradorController {
  constructor(
    private readonly atualizarColaboradoresUseCase: AtualizarColaboradorUseCase,
    private readonly buscarColaboradoresUseCase: BuscarColaboradoresUseCase,
    private readonly atualizarValorEmpresaUseCase: AtualizarValorEmpresaUseCase,
    private readonly atualizarTodosColaboradoresUseCase: AtualizarTodosColaboradoresUseCase,
  ) {}

  @Get('buscar')
  async buscarColaboradores(
    @Query() query: BuscarColaboradoresDto,
  ): Promise<BuscarColaboradoresResponse> {
    try {
      const response = await this.buscarColaboradoresUseCase.execute(query);
      return response;
    } catch (error) {
      throw new HttpException(
        `Erro ao buscar colaboradores: ${error.message}`,
        500,
      );
    }
  }
}
