import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type {
  IRelatorioRepository,
  RelatorioParams,
} from '../../../domain/repositories/relatorio.repository.interface';
import type { IEmpresaRepository } from '../../../domain/repositories/empresa.repository.interface';

@Injectable()
export class GerarResumoCentroCustoUseCase {
  constructor(
    @Inject('IRelatorioRepository')
    private readonly relatorioRepository: IRelatorioRepository,
    @Inject('IEmpresaRepository')
    private readonly empresaRepository: IEmpresaRepository,
  ) {}

  async execute(params: RelatorioParams): Promise<Buffer> {
    // ✅ Usa repositório ao invés de SQL direto (Clean Architecture)
    const empresaExiste = await this.empresaRepository.validarExistencia(
      params.codEmpresa,
      params.codColigada,
      params.codFilial,
    );

    if (!empresaExiste) {
      throw new NotFoundException('Empresa não encontrada');
    }

    return this.relatorioRepository.gerarResumoCentroCusto(params);
  }
}
