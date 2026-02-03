import { Injectable } from '@nestjs/common';
import { EmpresaRepository } from '../../../infrastructure/repositories/empresa.repository';

export interface EmpresaCompletaDto {
  codEmpresa: number;
  codColigada: number;
  codFilial: number;
  codBand: number;
  cnpj: string;
  apelido: string;
  processaUnimed: boolean;
  ativo: boolean;
}

@Injectable()
export class ListarEmpresasUseCase {
  constructor(private readonly empresaRepository: EmpresaRepository) {}

  async execute(): Promise<EmpresaCompletaDto[]> {
    const empresas = await this.empresaRepository.listarEmpresasCompletas();

    return empresas.map((emp) => ({
      codEmpresa: emp.COD_EMPRESA,
      codColigada: emp.CODCOLIGADA,
      codFilial: emp.CODFILIAL,
      codBand: emp.COD_BAND,
      cnpj: emp.CNPJ,
      apelido: emp.APELIDO,
      processaUnimed: emp.PROCESSA_UNIMED === 'S',
      ativo: emp.ATIVO === 'S',
    }));
  }
}
