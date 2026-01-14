import { ConfigService } from '@nestjs/config';
import { Injectable, Logger } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';
import { DemonstrativoDto } from 'src/modules/importacao/dtos/demonstrativo.dto';

@Injectable()
export class UnimedApiService {
  private token: string | null;

  private readonly apiUrl: string;
  private readonly apiUser: string;
  private readonly apiPassword: string;
  private readonly apiClient: AxiosInstance;
  private readonly logger = new Logger(UnimedApiService.name);

  constructor(private configService: ConfigService) {
    this.token =
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJodHRwOi8vc2NoZW1hcy54bWxzb2FwLm9yZy93cy8yMDA1LzA1L2lkZW50aXR5L2NsYWltcy9uYW1lIjoiY29tZXRhIiwiaHR0cDovL3NjaGVtYXMubWljcm9zb2Z0LmNvbS93cy8yMDA4LzA2L2lkZW50aXR5L2NsYWltcy9yb2xlIjoiREVNT05TVFJBVElWTyIsIm5iZiI6MTc2ODM5NzU1OCwiZXhwIjoxNzY4NDE5MTU4fQ.Bm34KacauoJVp7FgVnkcCHaW3eVyDgioLMSiMJXj9Io';
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
  ): Promise<DemonstrativoDto> {
    try {
      if (!this.token) {
        await this.getToken();
      }
      const response = await this.apiClient.get<DemonstrativoDto>(
        '/Demonstrativo/buscaporperiodocnpj',
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
      throw 'dados não encontrados: ' + e.response?.data || e.message;
    }
  }

  async buscaPorPeriodoContrato(
    periodo: string,
    contrato: string,
  ): Promise<DemonstrativoDto> {
    try {
      if (!this.token) {
        await this.getToken();
      }

      const response = await this.apiClient.get<DemonstrativoDto>(
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
      throw 'Erro ao obter dados:' + e.response?.data || e.message;
    }
  }
}
