import { Injectable, Logger } from '@nestjs/common';
import type { IEmpresaRepository } from '../../../domain/repositories/empresa.repository.interface';
import { Inject } from '@nestjs/common';

export interface BuscarEmpresasUnimedResponse {
  codEmpresa: number;
  codColigada: number;
  codFilial: number;
  codBand: number;
  cnpj: string;
}

@Injectable()
export class BuscarEmpresasUnimedUseCase {
  private readonly logger = new Logger(BuscarEmpresasUnimedUseCase.name);

  constructor(
    @Inject('IEmpresaRepository')
    private readonly empresaRepository: IEmpresaRepository,
  ) {}

  async execute(): Promise<BuscarEmpresasUnimedResponse[]> {
    this.logger.log('Buscando empresas ativas para processamento Unimed');

    const empresas = await this.empresaRepository.buscarEmpresasAtivasUnimed();

    if (!empresas || empresas.length === 0) {
      this.logger.warn('Nenhuma empresa ativa encontrada');
      return [];
    }

    return empresas.map((empresa) => {
      if (!empresa || !empresa.documentoFiscal) {
        this.logger.error(
          `Empresa inválida encontrada: ${JSON.stringify(empresa)}`,
        );
        throw new Error('Empresa sem documento fiscal válido');
      }

      return {
        codEmpresa: empresa.codEmpresa,
        codColigada: empresa.codColigada,
        codFilial: empresa.codFilial,
        codBand: empresa.codBand,
        cnpj: empresa.documentoFiscal.value, // 🔥 Usa documentoFiscal (CPF ou CNPJ)
      };
    });
  }
}
