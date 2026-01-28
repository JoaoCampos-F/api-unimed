import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type {
  IRelatorioRepository,
  RelatorioParams,
} from '../../../domain/repositories/relatorio.repository.interface';
import { DatabaseService } from '../../../database/database.services';

@Injectable()
export class GerarRelatorioPagamentoUseCase {
  constructor(
    @Inject('IRelatorioRepository')
    private readonly relatorioRepository: IRelatorioRepository,
    private readonly databaseService: DatabaseService,
  ) {}

  async execute(params: RelatorioParams): Promise<Buffer> {
    const empresa = await this.databaseService.executeQuery(
      `SELECT CODEMPRESA FROM gc.unimed_empresa 
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
      throw new NotFoundException('Empresa não encontrada');
    }

    return this.relatorioRepository.gerarRelatorioPagamento(params);
  }
}
