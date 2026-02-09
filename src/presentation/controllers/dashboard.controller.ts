import {
  Controller,
  Get,
  Query,
  Logger,
  ParseIntPipe,
  BadRequestException,
} from '@nestjs/common';
import { AuthUser } from 'src/infrastructure/auth/decorators/auth-user.decorator';
import type { UserAuth } from 'src/infrastructure/auth/types/user-auth.type';
import { BuscarDashboardColaboradorUseCase } from 'src/application/use-cases/dashboard/buscar-dashboard-colaborador.use-case';

@Controller('dashboard')
export class DashboardController {
  private readonly logger = new Logger(DashboardController.name);

  constructor(
    private readonly buscarDashboardColaboradorUseCase: BuscarDashboardColaboradorUseCase,
  ) {}

  /**
   * GET /dashboard/colaborador?mes=2&ano=2026
   * Retorna dados do dashboard do colaborador logado
   */
  @Get('colaborador')
  async buscarDashboardColaborador(
    @AuthUser() user: UserAuth,
    @Query('mes', ParseIntPipe) mes: number,
    @Query('ano', ParseIntPipe) ano: number,
  ) {
    this.logger.log(
      `📊 Buscando dashboard - Usuario: ${user.nome}, Período: ${mes}/${ano}`,
    );

    if (!user.cpf) {
      throw new BadRequestException('CPF do usuário não encontrado');
    }

    if (!user.cod_empresa) {
      throw new BadRequestException('Empresa do usuário não encontrada');
    }

    if (mes < 1 || mes > 12) {
      throw new BadRequestException('Mês deve estar entre 1 e 12');
    }

    if (ano < 2020 || ano > 2030) {
      throw new BadRequestException('Ano deve estar entre 2020 e 2030');
    }

    const resultado = await this.buscarDashboardColaboradorUseCase.execute({
      cpf: user.cpf,
      codEmpresa: user.cod_empresa,
      mesRef: mes,
      anoRef: ano,
    });

    this.logger.log(
      `✅ Dashboard retornado para ${user.nome}: R$ ${resultado.dados.valorLiquido}`,
    );

    return {
      success: true,
      data: resultado.dados,
      meta: {
        periodo: `${mes.toString().padStart(2, '0')}/${ano}`,
        usuario: user.nome,
        empresa: resultado.dados.empresa,
      },
    };
  }
}
