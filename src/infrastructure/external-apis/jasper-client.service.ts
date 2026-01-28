import { Injectable, Logger, HttpException } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';

/**
 * Cliente HTTP para JasperReports Server
 * Faz proxy transparente para o servidor de relatórios
 * Mantém 100% compatibilidade com templates existentes
 */
@Injectable()
export class JasperClientService {
  private readonly logger = new Logger(JasperClientService.name);
  private readonly client: AxiosInstance;
  private readonly baseUrl: string;
  private readonly username: string;
  private readonly password: string;

  constructor() {
    // Configuração do JasperServer (mesmo do sistema legado)
    this.baseUrl =
      process.env.JASPER_SERVER_URL ||
      'http://relatorio.viacometa.com.br:8080/jasperserver';
    this.username = process.env.JASPER_USERNAME || 'npd';
    this.password = process.env.JASPER_PASSWORD || 'npd1234@';

    // Cliente HTTP com autenticação básica
    this.client = axios.create({
      baseURL: this.baseUrl,
      auth: {
        username: this.username,
        password: this.password,
      },
      timeout: 60000, // 60 segundos (relatórios podem ser pesados)
      responseType: 'arraybuffer', // Receber PDF como buffer
    });
  }

  /**
   * Executa relatório no JasperServer
   * @param reportPath Caminho completo do relatório (ex: /reports/INTRANET/uni/RelatorioColaborador)
   * @param params Parâmetros do relatório
   * @param format Formato de saída (padrão: pdf)
   * @returns Buffer com o arquivo PDF
   */
  async runReport(
    reportPath: string,
    params: Record<string, any>,
    format: string = 'pdf',
  ): Promise<Buffer> {
    try {
      this.logger.log(`Gerando relatório: ${reportPath} (formato: ${format})`);

      // API REST do JasperServer: /rest_v2/reports/<caminho>.<formato>
      const url = `/rest_v2/reports${reportPath}.${format}`;

      // Fazer requisição para JasperServer
      const response = await this.client.get(url, {
        params, // Parâmetros via query string
        headers: {
          'Content-Type': 'application/pdf',
        },
      });

      this.logger.log(
        `Relatório gerado com sucesso: ${reportPath} (${response.data.length} bytes)`,
      );

      return Buffer.from(response.data);
    } catch (error) {
      this.logger.error(
        `Erro ao gerar relatório ${reportPath}:`,
        error.message,
      );

      if (axios.isAxiosError(error)) {
        const status = error.response?.status || 500;
        const message =
          error.response?.data?.toString() ||
          'Erro ao gerar relatório no JasperServer';

        throw new HttpException(
          {
            message,
            reportPath,
            params,
            jasperError: error.message,
          },
          status,
        );
      }

      throw error;
    }
  }

  /**
   * Testa conexão com JasperServer
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.client.get('/rest_v2/serverInfo');
      this.logger.log('Conexão com JasperServer OK');
      return true;
    } catch (error) {
      this.logger.error('Falha na conexão com JasperServer:', error.message);
      return false;
    }
  }
}
