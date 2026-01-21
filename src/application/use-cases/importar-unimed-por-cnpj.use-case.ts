import { Inject, Injectable, Logger } from '@nestjs/common';
import { ImportUnimedDto } from '../dtos/import-unimed.dto';
import { UnimedApiService } from '../../infrastructure/external-apis/unimed-api.service';
import { EmpresaRepository } from '../../infrastructure/repositories/empresa.repository';
import type { IDadosCobrancaRepository } from '../../domain/repositories/dados-cobranca.repository.interface';
import { Periodo } from '../../domain/value-objects/periodo.value-object';

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
    @Inject('IDadosCobrancaRepository')
    private readonly dadosCobrancaRepository: IDadosCobrancaRepository,
  ) {}

  async execute(dto: ImportUnimedDto): Promise<ImportacaoResult> {
    const periodo = new Periodo(parseInt(dto.mes, 10), parseInt(dto.ano, 10));
    const periodoFormatado = `${dto.mes.padStart(2, '0')}${dto.ano}`;
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
          periodoFormatado,
          empresa.cnpj.value,
        );

        const qtdLimpa =
          await this.dadosCobrancaRepository.limparDadosImportacao(
            empresa,
            periodo,
          );

        this.logger.log(
          `Empresa ${empresa.codEmpresa}: ${qtdLimpa} registros antigos removidos`,
        );

        const qtdInserida =
          await this.dadosCobrancaRepository.persistirDeDemonstrativo(
            dadosUnimed,
            empresa,
            periodo,
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
