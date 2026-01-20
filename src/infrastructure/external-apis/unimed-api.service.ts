import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';
import { DemonstrativoDto } from '../../application/dtos/demonstrativo.dto';

@Injectable()
export class UnimedApiService {
  private readonly logger = new Logger(UnimedApiService.name);
  private readonly apiClient: AxiosInstance;
  private token: string | null =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJodHRwOi8vc2NoZW1hcy54bWxzb2FwLm9yZy93cy8yMDA1LzA1L2lkZW50aXR5L2NsYWltcy9uYW1lIjoiY29tZXRhIiwiaHR0cDovL3NjaGVtYXMubWljcm9zb2Z0LmNvbS93cy8yMDA4LzA2L2lkZW50aXR5L2NsYWltcy9yb2xlIjoiREVNT05TVFJBVElWTyIsIm5iZiI6MTc2ODkzOTU0NSwiZXhwIjoxNzY4OTYxMTQ1fQ.jzSdhKqkA2objCwljah3Dri9SeUaxpO53p-U108Nnbg';

  constructor(private readonly configService: ConfigService) {
    const baseURL = this.configService.get<string>('UNIMED_API_URL');
    if (!baseURL) {
      throw new Error('UNIMED_API_URL não configurada');
    }

    this.apiClient = axios.create({
      baseURL,
      timeout: 30000, // 30 segundos
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  async buscarPorPeriodoCnpj(
    periodo: string,
    cnpj: string,
  ): Promise<DemonstrativoDto> {
    try {
      await this.ensureValidToken();

      const response = await this.apiClient.get<DemonstrativoDto>(
        '/Demonstrativo/buscaporperiodocnpj',
        {
          params: { periodo, cnpj },
          headers: { Authorization: `Bearer ${this.token}` },
        },
      );

      this.logger.debug(`Dados obtidos para CNPJ ${cnpj}, período ${periodo}`);
      return response.data;
    } catch (error) {
      if (error?.response?.status === 401) {
        this.token = null;
        return this.buscarPorPeriodoCnpj(periodo, cnpj); // Retry uma vez
      }

      this.logger.error(
        `Erro ao buscar dados para CNPJ ${cnpj}, período ${periodo}`,
        error.response?.data || error.message,
      );

      throw new Error(
        `Dados não encontrados: ${error.response?.data || error.message}`,
      );
    }
  }

  async buscarPorPeriodoContrato(
    periodo: string,
    contrato: string,
  ): Promise<DemonstrativoDto> {
    try {
      await this.ensureValidToken();

      const response = await this.apiClient.get<DemonstrativoDto>(
        '/Demonstrativo/BuscarPorPeriodoContrato',
        {
          params: { periodo, contrato },
          headers: { Authorization: `Bearer ${this.token}` },
        },
      );

      this.logger.debug(
        `Dados obtidos para contrato ${contrato}, período ${periodo}`,
      );
      return response.data;
    } catch (error) {
      if (error?.response?.status === 401) {
        this.token = null;
        return this.buscarPorPeriodoContrato(periodo, contrato); // Retry uma vez
      }

      this.logger.error(
        `Erro ao buscar dados para contrato ${contrato}, período ${periodo}`,
        error.response?.data || error.message,
      );

      throw new Error(
        `Dados não encontrados: ${error.response?.data || error.message}`,
      );
    }
  }

  private async ensureValidToken(): Promise<void> {
    if (!this.token) {
      await this.obterToken();
    }
  }

  private async obterToken(): Promise<void> {
    try {
      const usuario = this.configService.get<string>('UNIMED_API_USER');
      const senha = this.configService.get<string>('UNIMED_API_PASSWORD');

      if (!usuario || !senha) {
        throw new Error('Credenciais da API Unimed não configuradas');
      }

      const response = await this.apiClient.post<string>(
        '/Token/geratoken',
        {},
        {
          headers: { usuario, senha },
        },
      );

      this.token = response.data;
      this.logger.log('Token obtido com sucesso');
    } catch (error) {
      this.logger.error(
        'Erro ao obter token',
        error.response?.data || error.message,
      );
      throw new Error('Falha na autenticação com a API Unimed');
    }
  }
}
