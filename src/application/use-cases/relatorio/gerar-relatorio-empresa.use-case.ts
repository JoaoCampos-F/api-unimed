import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type {
  IRelatorioRepository,
  RelatorioEmpresaParams,
} from '../../../domain/repositories/relatorio.repository.interface';
import { DatabaseService } from '../../../database/database.services';

@Injectable()
export class GerarRelatorioEmpresaUseCase {
  constructor(
    @Inject('IRelatorioRepository')
    private readonly relatorioRepository: IRelatorioRepository,
    private readonly databaseService: DatabaseService,
  ) {}

  async execute(params: RelatorioEmpresaParams): Promise<Buffer> {
    // Validar se empresa existe
    const empresa = await this.databaseService.executeQuery(
      `SELECT CODEMPRESA, CODCOLIGADA, CODFILIAL 
       FROM gc.unimed_empresa 
       WHERE CODEMPRESA = :codEmpresa 
         AND CODCOLIGADA = :codColigada 
         AND CODFILIAL = :codFilial`,
      {
        codEmpresa: params.codEmpresa,
        codColigada: params.codColigada,
        codFilial: params.codFilial,
      },
    );

    if (!empresa || empresa.length === 0) {
      throw new NotFoundException(
        `Empresa ${params.codEmpresa}/${params.codColigada}/${params.codFilial} não encontrada`,
      );
    }

    return this.relatorioRepository.gerarRelatorioEmpresaColaborador(params);
  }
}
