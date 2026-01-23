/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';
import { DemonstrativoDto } from '../../application/dtos/demonstrativo.dto';

@Injectable()
export class UnimedApiService {
  private readonly logger = new Logger(UnimedApiService.name);
  private readonly apiClient: AxiosInstance;
  private token: string | null =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJodHRwOi8vc2NoZW1hcy54bWxzb2FwLm9yZy93cy8yMDA1LzA1L2lkZW50aXR5L2NsYWltcy9uYW1lIjoiY29tZXRhIiwiaHR0cDovL3NjaGVtYXMubWljcm9zb2Z0LmNvbS93cy8yMDA4LzA2L2lkZW50aXR5L2NsYWltcy9yb2xlIjoiREVNT05TVFJBVElWTyIsIm5iZiI6MTc2OTA4ODYwNCwiZXhwIjoxNzY5MTEwMjA0fQ.z87u-D_3yILQnUhu3IXHon8UBHTZawAaeMqaGkodweQ';

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
    // 🧪 MOCK: Comentando chamada real da API para economizar tokens
    this.logger.warn(`🧪 USANDO MOCK - CNPJ ${cnpj}, período ${periodo}`);

    const mockData: DemonstrativoDto = {
      mensalidades: [
        {
          contrato: '0013364',
          cnpj: '28941028000142',
          contratante: 'COMETA MULTI MARCAS COMERCIO DE AUTOS LTDA',
          nomeplano: ' SUPER CLASS EMPRESARIAL ENFERMARIA',
          abrangencia: 'ESTADUAL',
          codfatura: '2594854',
          valor_fatura: 1710.93,
          periodo: '102025',
          composicoes: [
            {
              codFatura: '2594854',
              codtitular: '0560013364000101',
              titular: 'EVERTON DOS SANTOS RIBEIRO',
              cpftitular: '99815494104',
              matricula: '',
              acomodacao: 'ENFERMARIA',
              codbeneficiario: '0560013364000101',
              beneficiario: 'EVERTON DOS SANTOS RIBEIRO',
              idade: '41',
              nascimento: '15/05/1984',
              inclusao: '15/04/2024',
              dependencia: 'Titular',
              cpf: '99815494104',
              valorcobrado: 291.35,
              descricao: 'Mensalidade/Contribuição Saúde',
            },
            {
              codFatura: '2594854',
              codtitular: '0560013364000101',
              titular: 'EVERTON DOS SANTOS RIBEIRO',
              cpftitular: '99815494104',
              matricula: '',
              acomodacao: 'ENFERMARIA',
              codbeneficiario: '0560013364000110',
              beneficiario: 'DANILO GABRIEL SILVA DOS SANTOS',
              idade: '12',
              nascimento: '23/01/2013',
              inclusao: '15/04/2024',
              dependencia: 'Dependente',
              cpf: '09238941106',
              valorcobrado: 154.46,
              descricao: 'Mensalidade/Contribuição Saúde',
            },
            {
              codFatura: '2594854',
              codtitular: '0560013364000101',
              titular: 'EVERTON DOS SANTOS RIBEIRO',
              cpftitular: '99815494104',
              matricula: '',
              acomodacao: 'ENFERMARIA',
              codbeneficiario: '0560013364000128',
              beneficiario: 'EDUARDO MATHEUS SILVA DOS SANTOS',
              idade: '16',
              nascimento: '11/11/2009',
              inclusao: '15/04/2024',
              dependencia: 'Dependente',
              cpf: '09238925160',
              valorcobrado: 154.46,
              descricao: 'Mensalidade/Contribuição Saúde',
            },
            {
              codFatura: '2594854',
              codtitular: '0560013364000152',
              titular: 'ANA BEATRIZ AMARAL PORTO',
              cpftitular: '01476957169',
              matricula: '',
              acomodacao: 'ENFERMARIA',
              codbeneficiario: '0560013364000152',
              beneficiario: 'ANA BEATRIZ AMARAL PORTO',
              idade: '28',
              nascimento: '30/06/1997',
              inclusao: '24/04/2025',
              dependencia: 'Titular',
              cpf: '01476957169',
              valorcobrado: 130.23,
              descricao: 'Co-participação em contas/Reciprocidade',
            },
            {
              codFatura: '2594854',
              codtitular: '0560013364000160',
              titular: 'ANDREIA GUIMARAES KICHLER',
              cpftitular: '01721649158',
              matricula: '',
              acomodacao: 'ENFERMARIA',
              codbeneficiario: '0560013364000160',
              beneficiario: 'ANDREIA GUIMARAES KICHLER',
              idade: '34',
              nascimento: '07/06/1991',
              inclusao: '12/09/2025',
              dependencia: 'Titular',
              cpf: '01721649158',
              valorcobrado: 475.87,
              descricao: 'Mensalidade/Contribuição Saúde',
            },
            {
              codFatura: '2594854',
              codtitular: '0560013364000160',
              titular: 'ANDREIA GUIMARAES KICHLER',
              cpftitular: '01721649158',
              matricula: '',
              acomodacao: 'ENFERMARIA',
              codbeneficiario: '0560013364000179',
              beneficiario: 'MANUELA GUIMARAES KICHLER',
              idade: '13',
              nascimento: '09/05/2012',
              inclusao: '12/09/2025',
              dependencia: 'Dependente',
              cpf: '08936694154',
              valorcobrado: 252.28,
              descricao: 'Mensalidade/Contribuição Saúde',
            },
            {
              codFatura: '2594854',
              codtitular: '0560013364000160',
              titular: 'ANDREIA GUIMARAES KICHLER',
              cpftitular: '01721649158',
              matricula: '',
              acomodacao: 'ENFERMARIA',
              codbeneficiario: '0560013364000187',
              beneficiario: 'ARTHUR GUIMARAES KICHLER',
              idade: '8',
              nascimento: '28/09/2017',
              inclusao: '12/09/2025',
              dependencia: 'Dependente',
              cpf: '08680658111',
              valorcobrado: 252.28,
              descricao: 'Mensalidade/Contribuição Saúde',
            },
          ],
        },
      ],
      status: true,
      descricao_status: 'Aceito',
    };

    return mockData;

    /* 🔴 CHAMADA REAL COMENTADA PARA ECONOMIZAR TOKENS
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
    */
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
