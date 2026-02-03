import { Injectable, Logger } from '@nestjs/common';
import type { IEmpresaRepository } from '../../../domain/repositories/empresa.repository.interface';
import { Periodo } from '../../../domain/value-objects/periodo.value-object';
import { UnimedApiService } from '../../../infrastructure/external-apis/unimed-api.service';
import { Inject } from '@nestjs/common';
import { Empresa } from 'src/domain/entities/empresa.entity';
import type { IDadosCobrancaRepository } from 'src/domain/repositories/dados-cobranca.repository.interface';

export interface ImportarDadosUnimedRequest {
  mes: number;
  ano: number;
}

export interface ImportarDadosUnimedResponse {
  totalEmpresas: number;
  totalRegistros: number;
  empresasProcessadas: number;
  erros: string[];
}

@Injectable()
export class ImportarDadosUnimedUseCase {
  private readonly logger = new Logger(ImportarDadosUnimedUseCase.name);

  constructor(
    @Inject('IEmpresaRepository')
    private readonly empresaRepository: IEmpresaRepository,
    @Inject('IDadosCobrancaRepository')
    private readonly dadosCobrancaRepository: IDadosCobrancaRepository,
    private readonly unimedApiService: UnimedApiService,
  ) {}

  async execute(
    request: ImportarDadosUnimedRequest,
  ): Promise<ImportarDadosUnimedResponse> {
    const periodo = new Periodo(request.mes, request.ano);

    this.logger.log(
      `Iniciando importação para período: ${periodo.periodoFormatado}`,
    );

    const empresas = await this.empresaRepository.buscarEmpresasAtivasUnimed();

    if (empresas.length === 0) {
      this.logger.warn('Nenhuma empresa encontrada para importação');
      return {
        totalEmpresas: 0,
        totalRegistros: 0,
        empresasProcessadas: 0,
        erros: ['Nenhuma empresa encontrada para importação'],
      };
    }

    let totalRegistros = 0;
    let empresasProcessadas = 0;
    const erros: string[] = [];

    for (const empresa of empresas) {
      try {
        const registrosProcessados = await this.processarEmpresa(
          empresa,
          periodo,
        );
        totalRegistros += registrosProcessados;
        empresasProcessadas++;

        this.logger.log(
          `Empresa ${empresa.codEmpresa} processada: ${registrosProcessados} registros`,
        );
      } catch (error) {
        const mensagemErro = `Erro ao processar empresa ${empresa.codEmpresa}: ${error.message}`;
        this.logger.error(mensagemErro);
        erros.push(mensagemErro);
      }
    }

    this.logger.log(
      `Importação concluída: ${empresasProcessadas}/${empresas.length} empresas, ${totalRegistros} registros`,
    );

    return {
      totalEmpresas: empresas.length,
      totalRegistros,
      empresasProcessadas,
      erros,
    };
  }

  private async processarEmpresa(
    empresa: Empresa,
    periodo: Periodo,
  ): Promise<number> {
    // 1. Limpar dados anteriores
    const registrosLimpos =
      await this.dadosCobrancaRepository.limparDadosImportacao(
        empresa,
        periodo,
      );

    this.logger.debug(
      `Empresa ${empresa.codEmpresa}: ${registrosLimpos} registros limpos`,
    );

    // 2. Buscar novos dados
    const dadosUnimed = await this.unimedApiService.buscarPorPeriodoCnpj(
      periodo.periodoFormatado,
      empresa.documentoFiscal.value, // 🔥 Usa documentoFiscal (CPF ou CNPJ)
    );

    // 3. Persistir dados completos (com todos os campos da mensalidade)
    const registrosInseridos =
      await this.dadosCobrancaRepository.persistirDeDemonstrativo(
        dadosUnimed,
        empresa,
        periodo,
      );

    return registrosInseridos;
  }
}
