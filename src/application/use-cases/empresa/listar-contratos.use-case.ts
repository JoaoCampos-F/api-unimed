import { Injectable } from '@nestjs/common';
import { EmpresaRepository } from '../../../infrastructure/repositories/empresa.repository';

export interface ContratoDto {
  codEmpresa: number;
  codColigada: number;
  codFilial: number;
  codBand: number;
  cnpj: string;
  contrato: string;
}

@Injectable()
export class ListarContratosUseCase {
  constructor(private readonly empresaRepository: EmpresaRepository) {}

  async execute(): Promise<ContratoDto[]> {
    const contratos = await this.empresaRepository.buscarContratosAtivos();

    return contratos.map((c) => ({
      codEmpresa: c.COD_EMPRESA,
      codColigada: c.CODCOLIGADA,
      codFilial: c.CODFILIAL,
      codBand: c.COD_BAND,
      cnpj: c.CNPJ,
      contrato: c.CONTRATO,
    }));
  }
}
