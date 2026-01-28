import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type {
  IRelatorioRepository,
  RelatorioColaboradorParams,
} from '../../../domain/repositories/relatorio.repository.interface';
import { DatabaseService } from '../../../database/database.services';

@Injectable()
export class GerarRelatorioColaboradorUseCase {
  constructor(
    @Inject('IRelatorioRepository')
    private readonly relatorioRepository: IRelatorioRepository,
    private readonly databaseService: DatabaseService,
  ) {}

  async execute(params: RelatorioColaboradorParams): Promise<Buffer> {
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

    // Delegar para JasperServer
    return this.relatorioRepository.gerarRelatorioColaborador(params);
  }
}
