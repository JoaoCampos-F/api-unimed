import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { BuscarHistoricoDto } from 'src/application/dtos/processos/buscar-historico.dto';
import { ExecutarProcessoDto } from 'src/application/dtos/processos/executar-processo.dto';
import { ListarProcessosDisponiveisDto } from 'src/application/dtos/processos/listar-processos-disponiveis.dto';
import { BuscarHistoricoUseCase } from 'src/application/use-cases/processos/buscar-historico.use-case';
import { ExecutarProcessoUseCase } from 'src/application/use-cases/processos/executar-processo.use-case';
import { BuscarProcessosAtivosUseCase } from 'src/application/use-cases/processos/buscar-processos-ativos.use-case';
import { Roles } from 'src/infrastructure/auth/decorators/roles.decorator';
import { AuthUser } from 'src/infrastructure/auth/decorators/auth-user.decorator';
import type { UserAuth } from 'src/infrastructure/auth/types/user-auth.type';

@Controller('processos')
export class ProcessoController {
  constructor(
    private readonly buscarProcessosAtivosUseCase: BuscarProcessosAtivosUseCase,
    private readonly executarProcessoUseCase: ExecutarProcessoUseCase,
    private readonly buscarHistoricoUseCase: BuscarHistoricoUseCase,
  ) {}

  @Get('disponiveis')
  @Roles('DP', 'ADMIN')
  async listarProcessosDisponiveis(
    @Query() query: ListarProcessosDisponiveisDto,
  ) {
    return await this.buscarProcessosAtivosUseCase.execute(query);
  }

  @Post('executar')
  @Roles('DP', 'ADMIN')
  async executarProcesso(
    @Body() body: ExecutarProcessoDto,
    @AuthUser() user: UserAuth,
  ) {
    const usuario: string = user.preferred_username || user.email || 'sistema';
    return await this.executarProcessoUseCase.execute(body, usuario);
  }

  @Get('historico')
  @Roles('DP', 'ADMIN')
  async buscarHistorico(@Query() query: BuscarHistoricoDto) {
    return await this.buscarHistoricoUseCase.execute(query);
  }
}
