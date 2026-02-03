/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Inject, Injectable, Logger } from '@nestjs/common';
import { ImportUnimedDto } from '../../dtos/importacao/import-unimed.dto';
import { UnimedApiService } from '../../../infrastructure/external-apis/unimed-api.service';
import { EmpresaRepository } from '../../../infrastructure/repositories/empresa.repository';
import type { IDadosCobrancaRepository } from '../../../domain/repositories/dados-cobranca.repository.interface';
import { ImportacaoResult } from './importar-unimed-por-cnpj.use-case';
import { Periodo } from '../../../domain/value-objects/periodo.value-object';
import { Empresa } from '../../../domain/entities/empresa.entity';
import { DocumentoFiscal } from '../../../domain/value-objects/documento-fiscal.value-object';

@Injectable()
export class ImportarUnimedPorContratoUseCase {
  private readonly logger = new Logger(ImportarUnimedPorContratoUseCase.name);

  constructor(
    private readonly unimedApiService: UnimedApiService,
    private readonly empresaRepository: EmpresaRepository,
    @Inject('IDadosCobrancaRepository')
    private readonly dadosCobrancaRepository: IDadosCobrancaRepository,
  ) {}

  async execute(dto: ImportUnimedDto): Promise<ImportacaoResult> {
    const periodo = new Periodo(parseInt(dto.mes, 10), parseInt(dto.ano, 10));
    const periodoFormatado = `${dto.mes.padStart(2, '0')}${dto.ano}`;
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
            periodoFormatado,
            contrato.CONTRATO,
          );

        // Converter DTO para Entity
        // 🔥 DocumentoFiscal detecta automaticamente se é CPF ou CNPJ
        // Necessário porque fazendas têm CPF do proprietário no campo CNPJ
        const empresa = new Empresa(
          contrato.COD_EMPRESA,
          contrato.CODCOLIGADA,
          contrato.CODFILIAL,
          contrato.COD_BAND,
          new DocumentoFiscal(contrato.CNPJ), // Aceita CPF (11) ou CNPJ (14)
          true,
        );

        const qtdLimpa =
          await this.dadosCobrancaRepository.limparDadosImportacao(
            empresa,
            periodo,
          );

        this.logger.log(
          `Contrato ${contrato.CONTRATO}: ${qtdLimpa} registros antigos removidos`,
        );

        const qtdInserida =
          await this.dadosCobrancaRepository.persistirDeDemonstrativo(
            dadosUnimed,
            empresa,
            periodo,
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
