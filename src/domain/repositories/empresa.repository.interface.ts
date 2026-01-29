import { Empresa } from '../entities/empresa.entity';

export interface IEmpresaRepository {
  buscarEmpresasAtivasUnimed(): Promise<Empresa[]>;
  buscarPorCodigo(codEmpresa: number): Promise<Empresa | null>;
  buscarPorSigla(sigla: string): Promise<Empresa | null>;
  buscarPorBandeira(codBand: string): Promise<Empresa[]>;
}
