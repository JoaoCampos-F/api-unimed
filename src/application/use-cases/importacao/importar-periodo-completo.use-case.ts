import { Injectable, Logger } from '@nestjs/common';
import { ImportarUnimedPorCnpjUseCase } from './importar-unimed-por-cnpj.use-case';
import { ImportarUnimedPorContratoUseCase } from './importar-unimed-por-contrato.use-case';
import { ExecutarResumoUnimedUseCase } from './executar-resumo-unimed.use-case';
import { ImportarPeriodoDto } from 'src/application/dtos/importacao/importar-periodo.dto';

export interface ImportacaoCompletaResult {
  sucesso: boolean;
  periodo: string; // "01/2026"
  resumo: {
    cnpj: {
      totalImportado: number;
      empresasProcessadas: number;
      erros: string[];
    };
    contrato: {
      totalImportado: number;
      contratosProcessados: number;
      erros: string[];
    };
    totalGeral: number;
  };
  timestamp: string;
}

@Injectable()
export class ImportarPeriodoCompletoUseCase {
  constructor(
    private readonly importarPorCnpjUseCase: ImportarUnimedPorCnpjUseCase,
    private readonly importarPorContratoUseCase: ImportarUnimedPorContratoUseCase,
    private readonly executarResumoUseCase: ExecutarResumoUnimedUseCase,
  ) {}

  async execute(params: ImportarPeriodoDto): Promise<ImportacaoCompletaResult> {
    const logger = new Logger('ImportarPeriodoCompleto');
    const request = {
      mes: parseInt(params.mes, 10),
      ano: parseInt(params.ano, 10),
    };

    logger.log(' Iniciando importação por CNPJ...');
    const resultadoCnpj = await this.importarPorCnpjUseCase.execute({
      mes: params.mes,
      ano: params.ano,
    });

    logger.log(' Iniciando importação por Contrato...');
    const resultadoContrato = await this.importarPorContratoUseCase.execute({
      mes: params.mes,
      ano: params.ano,
    });

    logger.log('Executando procedure de resumo...');
    await this.executarResumoUseCase.execute(request);

    return {
      sucesso: true,
      periodo: `${params.mes}/${params.ano}`,
      resumo: {
        cnpj: {
          totalImportado: resultadoCnpj.totalImportado,
          empresasProcessadas: resultadoCnpj.empresasProcessadas,
          erros: resultadoCnpj.erros,
        },
        contrato: {
          totalImportado: resultadoContrato.totalImportado,
          contratosProcessados: resultadoContrato.empresasProcessadas,
          erros: resultadoContrato.erros,
        },
        totalGeral:
          resultadoCnpj.totalImportado + resultadoContrato.totalImportado,
      },
      timestamp: new Date().toISOString(),
    };
  }
}
