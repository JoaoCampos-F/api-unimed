import { Empresa } from '../entities/empresa.entity';

export interface IEmpresaRepository {
  buscarEmpresasAtivasUnimed(): Promise<Empresa[]>;
  buscarPorCodigo(codEmpresa: number): Promise<Empresa | null>;
}
