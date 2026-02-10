import { Injectable, Logger, NotFoundException, Inject } from '@nestjs/common';
import type { IExportacaoRepository } from 'src/domain/repositories/exportacao.repository.interface';

export interface BuscarDashboardColaboradorParams {
  cpf: string;
  codEmpresa: number;
  mesRef: number;
  anoRef: number;
}

@Injectable()
export class BuscarDashboardColaboradorUseCase {
  private readonly logger = new Logger(BuscarDashboardColaboradorUseCase.name);

  constructor(
    @Inject('IExportacaoRepository')
    private readonly exportacaoRepository: IExportacaoRepository,
  ) {}

  async execute(params: BuscarDashboardColaboradorParams) {
    this.logger.log(
      `🎯 Buscando dashboard do colaborador CPF: ${params.cpf}, Período: ${params.mesRef}/${params.anoRef}`,
    );

    const dashboard =
      await this.exportacaoRepository.buscarDashboardColaborador({
        cpf: params.cpf,
        codEmpresa: params.codEmpresa,
        mesRef: params.mesRef,
        anoRef: params.anoRef,
      });

    if (!dashboard) {
      throw new NotFoundException(
        `Dados não encontrados para o colaborador ${params.cpf} no período ${params.mesRef}/${params.anoRef}`,
      );
    }

    this.logger.log(
      `✅ Dashboard encontrado: ${dashboard.nome} - Valor líquido: R$ ${dashboard.valorLiquido}`,
    );

    return {
      sucesso: true,
      dados: dashboard,
      periodo: {
        mes: params.mesRef,
        ano: params.anoRef,
      },
    };
  }
}
