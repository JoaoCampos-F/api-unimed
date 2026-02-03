/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';
import { DemonstrativoDto } from '../../application/dtos/importacao/demonstrativo.dto';
import type { ITokenCacheRepository } from '../../domain/repositories/token-cache.repository.interface';

@Injectable()
export class UnimedApiService {
  private readonly logger = new Logger(UnimedApiService.name);
  private readonly apiClient: AxiosInstance;
  private token: string | null = null;
  private tokenTimestamp: Date | null = null; // Data de geração do token em memória
  private readonly TOKEN_VALIDADE_HORAS = 6;

  constructor(
    private readonly configService: ConfigService,
    @Inject('ITokenCacheRepository')
    private readonly tokenCacheRepository: ITokenCacheRepository,
  ) {
    const baseURL = this.configService.get<string>('UNIMED_API_URL');
    if (!baseURL) {
      throw new Error('UNIMED_API_URL não configurada');
    }

    this.apiClient = axios.create({
      baseURL,
      timeout: 30000,
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

      if (!this.token) {
        throw new Error('Falha ao obter token de autenticação');
      }

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
        return this.buscarPorPeriodoCnpj(periodo, cnpj);
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

      if (!this.token) {
        throw new Error('Falha ao obter token de autenticação');
      }

      const response = await this.apiClient.get<DemonstrativoDto>(
        '/Demonstrativo/buscaporperiodocontrato',
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
    if (this.token && this.tokenTimestamp) {
      const agora = new Date();
      const diffMs = agora.getTime() - this.tokenTimestamp.getTime();
      const diffHoras = diffMs / (1000 * 60 * 60);

      if (diffHoras < this.TOKEN_VALIDADE_HORAS) {
        this.logger.debug(
          `✅ Token em memória ainda válido (${diffHoras.toFixed(1)}h de uso)`,
        );
        return;
      }

      this.logger.warn(
        `⏰ Token em memória expirado (${diffHoras.toFixed(1)}h) - renovando...`,
      );
      this.token = null;
      this.tokenTimestamp = null;
    }

    this.token = await this.obterToken();
    this.tokenTimestamp = new Date();
  }

  /**
   * ⚠️ CRÍTICO: Implementação com cache para evitar limite de tokens da API
   *
   * Este método implementa cache de token no banco para evitar gerar múltiplos
   * tokens desnecessariamente. A API Unimed tem LIMITE DIÁRIO de tokens.
   *
   * INCIDENTE ANTERIOR: Geração ilimitada de tokens deixou departamento inteiro sem acesso.
   *
   * FLUXO:
   * 1. Verifica cache no banco (válido se < 6 horas)
   * 2. Se cache válido, usa token existente
   * 3. Se cache inválido/inexistente, gera novo token
   * 4. Salva novo token no cache
   *
   * VALIDAÇÃO: Token tem validade de 6 HORAS
   */
  private async obterToken(): Promise<string> {
    try {
      this.logger.log('🔍 Verificando cache de token...');
      const tokenCacheado = await this.tokenCacheRepository.buscarTokenValido();

      if (tokenCacheado) {
        this.logger.log('✅ Token válido encontrado no cache - REUTILIZANDO');
        this.tokenTimestamp = new Date(); // 🔥 Define timestamp quando vem do cache
        return tokenCacheado;
      }

      this.logger.warn('⚠️  Cache miss ou token expirado - GERANDO NOVO TOKEN');

      const usuario = this.configService.get<string>('UNIMED_API_USER');
      const senha = this.configService.get<string>('UNIMED_API_PASSWORD');

      if (!usuario || !senha) {
        throw new Error('Credenciais da API Unimed não configuradas');
      }

      this.logger.log('📡 Chamando API Unimed para gerar token...');
      const response = await this.apiClient.post<string>(
        '/Token/geratoken',
        {},
        {
          headers: { usuario, senha },
        },
      );

      const novoToken = response.data;

      // 3️⃣ CRÍTICO: Salvar no cache para próximas requisições
      this.logger.log('💾 Salvando token no cache...');
      await this.tokenCacheRepository.salvarToken(novoToken);
      this.logger.log('✅ Token salvo no cache - válido por 6 horas');

      this.tokenTimestamp = new Date(); // 🔥 Registra timestamp de geração
      return novoToken;
    } catch (error) {
      this.logger.error(
        '❌ Erro ao obter token',
        error.response?.data || error.message,
      );
      throw new Error('Falha na autenticação com a API Unimed');
    }
  }
}
