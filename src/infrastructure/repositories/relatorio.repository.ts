import { Injectable, Logger } from '@nestjs/common';
import {
  IRelatorioRepository,
  RelatorioColaboradorParams,
  RelatorioEmpresaParams,
  RelatorioParams,
} from '../../domain/repositories/relatorio.repository.interface';
import { JasperClientService } from '../external-apis/jasper-client.service';

/**
 * Implementação do repositório de relatórios
 * Faz proxy transparente para JasperReports Server
 * Mantém mesmos templates e parâmetros do sistema legado
 */
@Injectable()
export class RelatorioRepository implements IRelatorioRepository {
  private readonly logger = new Logger(RelatorioRepository.name);
  private readonly basePath = '/reports/INTRANET/uni';

  constructor(private readonly jasperClient: JasperClientService) {}

  async gerarRelatorioColaborador(
    params: RelatorioColaboradorParams,
  ): Promise<Buffer> {
    this.logger.log(
      `Gerando RelatorioColaborador: Empresa=${params.codEmpresa}, Ref=${params.mesRef}/${params.anoRef}`,
    );

    // Construir parâmetros exatamente como no legado (UnimedController.php linha 100-126)
    const jasperParams = {
      in_codEmpresa: params.codEmpresa,
      in_codColigada: params.codColigada,
      in_codFilial: params.codFilial,
      in_mesRef: params.mesRef,
      in_anoRef: params.anoRef,
      in_codBand: params.codBand,
      in_cpf: params.cpf || '', // Opcional
      in_usuario: 'API', // Hardcoded (no legado vinha do $User['nome'])
      in_codContrato: params.codContrato || '', // Opcional
    };

    return this.jasperClient.runReport(
      `${this.basePath}/RelatorioColaborador`,
      jasperParams,
    );
  }

  async gerarRelatorioEmpresaColaborador(
    params: RelatorioEmpresaParams,
  ): Promise<Buffer> {
    this.logger.log(
      `Gerando RelatorioEmpresaColaborador: Empresa=${params.codEmpresa}`,
    );

    // Parâmetros conforme UnimedController.php linha 127-152
    const jasperParams = {
      in_codEmpresa: params.codEmpresa,
      in_codColigada: params.codColigada,
      in_codFilial: params.codFilial,
      in_mesRef: params.mesRef,
      in_anoRef: params.anoRef,
      in_codBand: params.codBand,
      in_usuario: 'API',
      in_codContrato: params.codContrato || '',
    };

    // Template diferente: relatorioCobranca_por_empresa (conforme legado)
    return this.jasperClient.runReport(
      `${this.basePath}/relatorioCobranca_por_empresa`,
      jasperParams,
    );
  }

  async gerarRelatorioPagamento(params: RelatorioParams): Promise<Buffer> {
    this.logger.log(`Gerando RelatorioPagamento: Empresa=${params.codEmpresa}`);

    // Parâmetros conforme UnimedController.php linha 153-178
    const jasperParams = {
      in_codEmpresa: params.codEmpresa,
      in_codColigada: params.codColigada,
      in_codFilial: params.codFilial,
      in_mesRef: params.mesRef,
      in_anoRef: params.anoRef,
      in_codBand: params.codBand,
      in_usuario: 'API',
      in_codContrato: params.codContrato || '',
    };

    return this.jasperClient.runReport(
      `${this.basePath}/relatorioPagamentos`,
      jasperParams,
    );
  }

  async gerarRelatorioNaoPagamento(params: RelatorioParams): Promise<Buffer> {
    this.logger.log(
      `Gerando RelatorioNaoPagamento: Empresa=${params.codEmpresa}`,
    );

    // Parâmetros conforme UnimedController.php linha 179-204
    const jasperParams = {
      in_codEmpresa: params.codEmpresa,
      in_codColigada: params.codColigada,
      in_codFilial: params.codFilial,
      in_mesRef: params.mesRef,
      in_anoRef: params.anoRef,
      in_codBand: params.codBand,
      in_usuario: 'API',
      in_codContrato: params.codContrato || '',
    };

    return this.jasperClient.runReport(
      `${this.basePath}/relatorioNaolancamento`,
      jasperParams,
    );
  }

  async gerarResumoDepto(params: RelatorioParams): Promise<Buffer> {
    this.logger.log(`Gerando ResumoDepto: Empresa=${params.codEmpresa}`);

    // Parâmetros conforme UnimedController.php linha 205-230
    const jasperParams = {
      in_codEmpresa: params.codEmpresa,
      in_codColigada: params.codColigada,
      in_codFilial: params.codFilial,
      in_mesRef: params.mesRef,
      in_anoRef: params.anoRef,
      in_codBand: params.codBand,
      in_usuario: 'API',
      in_codContrato: params.codContrato || '',
    };

    return this.jasperClient.runReport(
      `${this.basePath}/resumoCentro`,
      jasperParams,
    );
  }

  async gerarResumoCentroCusto(params: RelatorioParams): Promise<Buffer> {
    this.logger.log(`Gerando ResumoCentroCusto: Empresa=${params.codEmpresa}`);

    // Parâmetros conforme UnimedController.php linha 231-256
    const jasperParams = {
      in_codEmpresa: params.codEmpresa,
      in_codColigada: params.codColigada,
      in_codFilial: params.codFilial,
      in_mesRef: params.mesRef,
      in_anoRef: params.anoRef,
      in_codBand: params.codBand,
      in_usuario: 'API',
      in_codContrato: params.codContrato || '',
    };

    return this.jasperClient.runReport(
      `${this.basePath}/relatorioCentroCusto`,
      jasperParams,
    );
  }
}
