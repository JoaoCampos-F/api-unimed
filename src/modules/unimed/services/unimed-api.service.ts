import { ConfigService } from '@nestjs/config';
import { Injectable, Logger } from '@nestjs/common';
import axios, { AxiosError, AxiosInstance } from 'axios';

@Injectable()
export class UnimedApiService {
  private readonly apiUrl: string;
  private readonly apiUser: string;
  private readonly apiPassword: string;

  private token: string | null;

  private readonly apiClient: AxiosInstance;
  private readonly logger = new Logger(UnimedApiService.name);

  constructor(private configService: ConfigService) {
    this.apiUrl = this.configService.get<string>('UNIMED_API_URL') || '';
    this.apiUser = this.configService.get<string>('UNIMED_API_USER') || '';
    this.apiPassword =
      this.configService.get<string>('UNIMED_API_PASSWORD') || '';

    this.apiClient = axios.create({
      baseURL: this.apiUrl,
      timeout: 5000,
    });
  }

  async getToken() {
    try {
      const response = await this.apiClient.post<string>(
        '/Token/geratoken',
        {},
        {
          headers: {
            usuario: this.apiUser,
            senha: this.apiPassword,
          },
        },
      );
      this.logger.log('Token obtido com sucesso', response.data);

      this.token = response.data;
      return this.token;
    } catch (e) {
      this.logger.error('Erro ao obter token:', e.response?.data || e.message);
      throw e;
    }
  }

  async buscarPorPeriodoCnpj(
    periodo: string,
    cnpj: string,
  ): Promise<UnimedApiService | undefined> {
    try {
      const response = await this.apiClient.get<UnimedApiService>(
        '/Demonstrativo/BuscarPorPeriodoCnpj',
        {
          params: {
            periodo,
            cnpj,
          },
          headers: {
            Authorization: `Bearer ${this.token}`,
          },
        },
      );
      this.logger.log('Dados obtidos com sucesso', response.data);
      return response.data;
    } catch (e) {
      if (e?.response?.status === 401) {
        this.token = null;
        return this.buscarPorPeriodoCnpj(periodo, cnpj);
      }
      this.logger.error('Erro ao obter dados:', e.response?.data || e.message);
    }
  }

  async buscaPorPeriodoContrato(
    periodo: string,
    contrato: string,
  ): Promise<UnimedApiService | AxiosError | undefined> {
    try {
      if (!this.token) {
        await this.getToken();
      }

      const response = await this.apiClient.get<UnimedApiService>(
        '/Demonstrativo/BuscarPorPeriodoContrato',
        {
          params: {
            periodo,
            contrato,
          },
          headers: {
            Authorization: `Bearer ${this.token}`,
          },
        },
      );
      return response.data;
    } catch (e) {
      if (e?.response?.status === 401) {
        this.token = null;
        return this.buscaPorPeriodoContrato(periodo, contrato);
      }
      this.logger.error('Erro ao obter dados:', e.response?.data || e.message);
    }
  }
}
