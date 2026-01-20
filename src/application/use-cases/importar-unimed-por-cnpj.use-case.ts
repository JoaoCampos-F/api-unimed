import { Injectable, Logger } from '@nestjs/common';
import { ImportUnimedDto } from '../dtos/import-unimed.dto';
import { UnimedApiService } from '../../infrastructure/external-apis/unimed-api.service';
import { EmpresaRepository } from '../../infrastructure/repositories/empresa.repository';
import { UnimedCobrancaRepository } from '../../infrastructure/repositories/unimed-cobranca.repository';

export interface ImportacaoResult {
  totalImportado: number;
  empresasProcessadas: number;
  erros: string[];
}

@Injectable()
export class ImportarUnimedPorCnpjUseCase {
  private readonly logger = new Logger(ImportarUnimedPorCnpjUseCase.name);

  constructor(
    private readonly unimedApiService: UnimedApiService,
    private readonly empresaRepository: EmpresaRepository,
    private readonly cobrancaRepository: UnimedCobrancaRepository,
  ) {}

  async execute(dto: ImportUnimedDto): Promise<ImportacaoResult> {
    const periodo = `${dto.mes.padStart(2, '0')}${dto.ano}`;
    const empresas = await this.empresaRepository.buscarEmpresasAtivasUnimed();

    if (empresas.length === 0) {
      this.logger.warn('Nenhuma empresa encontrada para importação.');
      return {
        totalImportado: 0,
        empresasProcessadas: 0,
        erros: ['Nenhuma empresa ativa encontrada'],
      };
    }

    let totalImportado = 0;
    let empresasProcessadas = 0;
    const erros: string[] = [];

    for (const empresa of empresas) {
      try {
        this.logger.log(`Processando empresa ${empresa.codEmpresa}...`);

        const dadosUnimed = await this.unimedApiService.buscarPorPeriodoCnpj(
          periodo,
          empresa.cnpj.valor,
        );

        const qtdLimpa = await this.cobrancaRepository.limparDadosImportacao(
          empresa.codEmpresa,
          empresa.codColigada,
          empresa.codFilial,
          dto.mes,
          dto.ano,
        );

        this.logger.log(
          `Empresa ${empresa.codEmpresa}: ${qtdLimpa} registros antigos removidos`,
        );

        // Converter Empresa domain para DTO temporário
        const empresaDto = {
          COD_EMPRESA: empresa.codEmpresa,
          CODCOLIGADA: empresa.codColigada,
          CODFILIAL: empresa.codFilial,
          COD_BAND: empresa.codBand,
          CNPJ: empresa.cnpj.valor,
        };

        const qtdInserida =
          await this.cobrancaRepository.persistirDadosCobranca(
            dadosUnimed,
            empresaDto,
            dto.mes,
            dto.ano,
          );

        totalImportado += qtdInserida;
        empresasProcessadas++;

        this.logger.log(
          `Empresa ${empresa.codEmpresa}: ${qtdInserida} registros importados`,
        );
      } catch (error) {
        const mensagemErro = `Erro na empresa ${empresa.codEmpresa}: ${error.message}`;
        this.logger.error(mensagemErro);
        erros.push(mensagemErro);
      }
    }

    this.logger.log(
      `Importação finalizada: ${totalImportado} registros, ${empresasProcessadas} empresas`,
    );

    return {
      totalImportado,
      empresasProcessadas,
      erros,
    };
  }
}
