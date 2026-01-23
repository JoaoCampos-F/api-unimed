import { Injectable, Logger, Inject } from '@nestjs/common';
import type { IColaboradorRepository } from '../../domain/repositories/colaborador.repository.interface';

export interface BuscarColaboradoresRequest {
  codEmpresa: number;
  codColigada: number;
  mes?: string;
  ano?: string;
  cpf?: string;
}

export interface BuscarColaboradoresResponse {
  colaboradores: {
    codEmpresa: number;
    codColigada: number;
    codFilial: number;
    codBand: number;
    cpf: string;
    nome: string;
    apelido: string;
    mesRef: string;
    anoRef: string;
    valorTitular: number;
    valorDependente: number;
    valorConsumo: number;
    valorEmpresa: number;
    valorTotal: number;
    valorLiquido: number;
    exporta: 'S' | 'N';
    ativo: 'S' | 'N';
  }[];
  total: number;
}

@Injectable()
export class BuscarColaboradoresUseCase {
  private readonly logger = new Logger(BuscarColaboradoresUseCase.name);

  constructor(
    @Inject('IColaboradorRepository')
    private readonly colaboradorRepository: IColaboradorRepository,
  ) {}

  async execute(
    request: BuscarColaboradoresRequest,
  ): Promise<BuscarColaboradoresResponse> {
    this.logger.log(
      `Buscando colaboradores - Empresa: ${request.codEmpresa}, Período: ${request.mes}/${request.ano}`,
    );

    const colaboradores =
      await this.colaboradorRepository.buscarColaboradores(request);

    return {
      colaboradores: colaboradores.map((c) => ({
        codEmpresa: c.codEmpresa,
        codColigada: c.codColigada,
        codFilial: c.codFilial,
        codBand: c.codBand,
        cpf: c.cpf.value,
        nome: c.nome,
        apelido: c.apelido,
        mesRef: c.mesRef,
        anoRef: c.anoRef,
        valorTitular: c.valorTitular,
        valorDependente: c.valorDependente,
        valorConsumo: c.valorConsumo,
        valorEmpresa: c.valorEmpresa,
        valorTotal: c.valorTotal,
        valorLiquido: c.valorLiquido,
        exporta: c.exporta,
        ativo: c.ativo,
      })),
      total: colaboradores.length,
    };
  }
}
