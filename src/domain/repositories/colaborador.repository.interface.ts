import { Colaborador } from '../entities/colaborador.entity';

export interface BuscarColaboradoresParams {
  codEmpresa: number;
  codColigada: number;
  mes?: string;
  ano?: string;
  cpf?: string;
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
  ): Promise<Colaborador[]>;
  atualizarExporta(params: AtualizarColaboradorParams): Promise<void>;
  atualizarTodosExporta(params: AtualizarTodosParams): Promise<number>; // retorna qtd atualizada
  atualizarValorEmpresa(params: AtualizarValorEmpresaParams): Promise<void>;
}
