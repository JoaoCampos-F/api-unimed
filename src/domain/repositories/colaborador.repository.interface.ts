import { Colaborador } from '../entities/colaborador.entity';

export interface BuscarColaboradoresParams {
  codEmpresa: number;
  codColigada: number;
  mes?: string;
  ano?: string;
  cpf?: string;
  page?: number;
  pageSize?: number;
  search?: string;
}

export interface BuscarColaboradoresResult {
  data: Colaborador[];
  totalRecords: number;
  filteredRecords: number;
  page: number;
  pageSize: number;
}

export interface AtualizarColaboradorParams {
  cpf: string;
  mesRef: string;
  anoRef: string;
  exporta: 'S' | 'N';
}

export interface AtualizarTodosParams {
  codEmpresa: number;
  codColigada: number;
  codFilial: number;
  mesRef: string;
  anoRef: string;
  exporta: 'S' | 'N';
}

export interface AtualizarValorEmpresaParams {
  codEmpresa: number;
  codColigada: number;
  codFilial: number;
  valor: number;
}

export interface IColaboradorRepository {
  buscarColaboradores(
    params: BuscarColaboradoresParams,
  ): Promise<BuscarColaboradoresResult>;
  atualizarExporta(params: AtualizarColaboradorParams): Promise<number>; // retorna qtd atualizada
  atualizarTodosExporta(params: AtualizarTodosParams): Promise<number>; // retorna qtd atualizada
  atualizarValorEmpresa(params: AtualizarValorEmpresaParams): Promise<number>; // retorna qtd atualizada
}
