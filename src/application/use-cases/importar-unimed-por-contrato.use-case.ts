/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Injectable, Logger } from '@nestjs/common';
import { ImportUnimedDto } from '../dtos/import-unimed.dto';
import { UnimedApiService } from '../../infrastructure/external-apis/unimed-api.service';
import { EmpresaRepository } from '../../infrastructure/repositories/empresa.repository';
import { UnimedCobrancaRepository } from '../../infrastructure/repositories/unimed-cobranca.repository';
import { ImportacaoResult } from './importar-unimed-por-cnpj.use-case';

@Injectable()
export class ImportarUnimedPorContratoUseCase {
  private readonly logger = new Logger(ImportarUnimedPorContratoUseCase.name);

  constructor(
    private readonly unimedApiService: UnimedApiService,
    private readonly empresaRepository: EmpresaRepository,
    private readonly cobrancaRepository: UnimedCobrancaRepository,
  ) {}

  async execute(dto: ImportUnimedDto): Promise<ImportacaoResult> {
    const periodo = `${dto.mes.padStart(2, '0')}${dto.ano}`;
    const contratos = await this.empresaRepository.buscarContratosAtivos();

    if (contratos.length === 0) {
      this.logger.warn('Nenhum contrato encontrado para importação.');
      return {
        totalImportado: 0,
        empresasProcessadas: 0,
        erros: ['Nenhum contrato ativo encontrado'],
      };
    }

    let totalImportado = 0;
    let contratosProcessados = 0;
    const erros: string[] = [];

    for (const contrato of contratos) {
      try {
        this.logger.log(`Processando contrato ${contrato.CONTRATO}...`);

        const dadosUnimed =
          await this.unimedApiService.buscarPorPeriodoContrato(
            periodo,
            contrato.CONTRATO,
          );

        const qtdLimpa = await this.cobrancaRepository.limparDadosImportacao(
          contrato.COD_EMPRESA,
          contrato.CODCOLIGADA,
          contrato.CODFILIAL,
          dto.mes,
          dto.ano,
        );

        this.logger.log(
          `Contrato ${contrato.CONTRATO}: ${qtdLimpa} registros antigos removidos`,
        );

        const empresaDto = {
          COD_EMPRESA: contrato.COD_EMPRESA,
          CODCOLIGADA: contrato.CODCOLIGADA,
          CODFILIAL: contrato.CODFILIAL,
          COD_BAND: contrato.COD_BAND,
          CNPJ: contrato.CNPJ,
        };

        const qtdInserida =
          await this.cobrancaRepository.persistirDadosCobranca(
            dadosUnimed,
            empresaDto,
            dto.mes,
            dto.ano,
          );

        totalImportado += qtdInserida;
        contratosProcessados++;

        this.logger.log(
          `Contrato ${contrato.CONTRATO}: ${qtdInserida} registros importados`,
        );
      } catch (error: any) {
        const mensagemErro = `Erro no contrato ${contrato.CONTRATO}: ${error.message}`;
        this.logger.error(mensagemErro);
        erros.push(mensagemErro);
      }
    }

    this.logger.log(
      `Importação finalizada: ${totalImportado} registros, ${contratosProcessados} contratos`,
    );

    return {
      totalImportado,
      empresasProcessadas: contratosProcessados,
      erros,
    };
  }
}
