import { Body, Controller, Get, Post, Query, Request } from '@nestjs/common';
import { BuscarHistoricoDto } from 'src/application/dtos/processos/buscar-historico.dto';
import { ExecutarProcessoDto } from 'src/application/dtos/processos/executar-processo.dto';
import { ListarProcessosDisponiveisDto } from 'src/application/dtos/processos/listar-processos-disponiveis.dto';
import { BuscarHistoricoUseCase } from 'src/application/use-cases/processos/buscar-historico.use-case';
import { ExecutarProcessoUseCase } from 'src/application/use-cases/processos/executar-processo.use-case';
import { ListarProcessosDisponiveisUseCase } from 'src/application/use-cases/processos/listar-processos-disponiveis.use-case';

@Controller('api/v1/processos')
export class ProcessoController {
  constructor(
    private readonly listarProcessosUseCase: ListarProcessosDisponiveisUseCase,
    private readonly executarProcessoUseCase: ExecutarProcessoUseCase,
    private readonly buscarHistoricoUseCase: BuscarHistoricoUseCase,
  ) {}

  @Get('disponiveis')
  async listarProcessosDisponiveis(
    @Query() query: ListarProcessosDisponiveisDto,
  ) {
    return await this.listarProcessosUseCase.execute(query);
  }

  @Post('executar')
  async executarProcesso(
    @Body() body: ExecutarProcessoDto,
    @Request() req: any, // TODO: Implementar autenticação
  ) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
    const usuario: string = req.user?.usuario || 'sistema'; // TODO: Pegar usuário autenticado
    return await this.executarProcessoUseCase.execute(body, usuario);
  }

  @Get('historico')
  async buscarHistorico(@Query() query: BuscarHistoricoDto) {
    return await this.buscarHistoricoUseCase.execute(query);
  }
}
