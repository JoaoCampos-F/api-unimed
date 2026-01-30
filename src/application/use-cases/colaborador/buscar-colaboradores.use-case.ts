import { Injectable, Logger, Inject } from '@nestjs/common';
import type { IColaboradorRepository } from '../../../domain/repositories/colaborador.repository.interface';

export interface BuscarColaboradoresRequest {
  codEmpresa: number;
  codColigada: number;
  mes?: string;
  ano?: string;
  cpf?: string;
  page?: number;
  pageSize?: number;
  search?: string;
}

export interface BuscarColaboradoresResponse {
  data: {
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
  totalRecords: number;
  filteredRecords: number;
  page: number;
  pageSize: number;
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
    const page = request.page || 1;
    const pageSize = request.pageSize || 50;

    this.logger.log(
      `Buscando colaboradores - Empresa: ${request.codEmpresa}, Período: ${request.mes}/${request.ano}, Page: ${page}/${pageSize}, Search: "${request.search || ''}"`,
    );

    const result =
      await this.colaboradorRepository.buscarColaboradores(request);

    return {
      data: result.data.map((colaborador) => ({
        codEmpresa: colaborador.codEmpresa,
        codColigada: colaborador.codColigada,
        codFilial: colaborador.codFilial,
        codBand: colaborador.codBand,
        cpf: colaborador.cpf.value,
        nome: colaborador.nome,
        apelido: colaborador.apelido,
        mesRef: colaborador.mesRef,
        anoRef: colaborador.anoRef,
        valorTitular: colaborador.valorTitular,
        valorDependente: colaborador.valorDependente,
        valorConsumo: colaborador.valorConsumo,
        valorEmpresa: colaborador.valorEmpresa,
        valorTotal: colaborador.valorTotal,
        valorLiquido: colaborador.valorLiquido,
        exporta: colaborador.exporta,
        ativo: colaborador.ativo,
      })),
      totalRecords: result.totalRecords,
      filteredRecords: result.filteredRecords,
      page: result.page,
      pageSize: result.pageSize,
    };
  }
}
