import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from 'src/database/database.services';
import { ITokenCacheRepository } from '../../domain/repositories/token-cache.repository.interface';

/**
 * Repository para Cache de Token da API Unimed
 *
 * ⚠️ CRÍTICO: Este repository é fundamental para evitar
 * esgotar o limite diário de geração de tokens da API Unimed
 *
 * Tabela: gc.api_gc_servicos
 * Tipo: 'U' (Unimed)
 * Validade: 6 HORAS
 */
@Injectable()
export class TokenCacheRepository implements ITokenCacheRepository {
  private readonly logger = new Logger(TokenCacheRepository.name);
  private readonly VALIDADE_TOKEN_HORAS = 6;

  constructor(private readonly databaseService: DatabaseService) {}

  async buscarTokenValido(): Promise<string | null> {
    try {
      const seisHorasAtras = new Date();
      seisHorasAtras.setHours(
        seisHorasAtras.getHours() - this.VALIDADE_TOKEN_HORAS,
      );

      const query = `
        SELECT 
          hash AS token,
          data_atualizacao AS data_geracao
        FROM gc.api_gc_servicos
        WHERE tipo = 'U'
          AND ativo = 'S'
          AND data_atualizacao >= :dataLimite
        ORDER BY data_atualizacao DESC
        FETCH FIRST 1 ROW ONLY
      `;

      const resultado = await this.databaseService.executeQuery<{
        TOKEN: string;
        DATA_GERACAO: Date;
      }>(query, {
        dataLimite: seisHorasAtras,
      });

      if (resultado.length === 0) {
        this.logger.log('❌ Nenhum token válido encontrado no cache');
        return null;
      }

      const { TOKEN, DATA_GERACAO } = resultado[0];
      const idadeToken = this.calcularIdadeToken(
        new Date(DATA_GERACAO as string | number | Date),
      );

      this.logger.log(
        `✅ Token encontrado no cache (gerado há ${idadeToken} horas)`,
      );

      return TOKEN;
    } catch (error) {
      this.logger.error(
        `Erro ao buscar token do cache: ${error.message}`,
        error.stack,
      );
      return null; // Em caso de erro, gera novo token
    }
  }

  /**
   * Salva novo token no cache
   * ⚠️ IMPORTANTE: Atualiza registro existente, não insere novo
   */
  async salvarToken(token: string): Promise<void> {
    try {
      // Verificar se existe registro
      const queryVerifica = `
        SELECT COUNT(*) AS qtd
        FROM gc.api_gc_servicos
        WHERE tipo = 'U'
      `;

      const resultado = await this.databaseService.executeQuery<{
        QTD: number;
      }>(queryVerifica);

      const existe = resultado[0].QTD > 0;

      if (existe) {
        // UPDATE
        const queryUpdate = `
          UPDATE gc.api_gc_servicos
          SET hash = :token,
              data_atualizacao = SYSDATE,
              ativo = 'S'
          WHERE tipo = 'U'
        `;

        await this.databaseService.executeUpdate(queryUpdate, { token });
        this.logger.log('✅ Token atualizado no cache com sucesso');
      } else {
        // INSERT (primeira vez)
        const queryInsert = `
          INSERT INTO gc.api_gc_servicos (
            tipo,
            hash,
            data_atualizacao,
            ativo
          ) VALUES (
            'U',
            :token,
            SYSDATE,
            'S'
          )
        `;

        await this.databaseService.executeUpdate(queryInsert, { token });
        this.logger.log('✅ Token salvo no cache pela primeira vez');
      }
    } catch (error) {
      this.logger.error(
        `❌ Erro ao salvar token no cache: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Verifica se token ainda é válido
   * @param dataGeracao - Data de geração do token
   * @returns true se ainda válido (< 6 horas), false se expirado
   */
  isTokenValido(dataGeracao: Date): boolean {
    const agora = new Date();
    const diffMs = agora.getTime() - dataGeracao.getTime();
    const diffHoras = diffMs / (1000 * 60 * 60);

    return diffHoras < this.VALIDADE_TOKEN_HORAS;
  }

  /**
   * Calcula idade do token em horas (para logs)
   */
  private calcularIdadeToken(dataGeracao: Date): string {
    const agora = new Date();
    const diffMs = agora.getTime() - dataGeracao.getTime();
    const diffHoras = diffMs / (1000 * 60 * 60);

    if (diffHoras < 1) {
      const diffMinutos = Math.floor(diffMs / (1000 * 60));
      return `${diffMinutos} minutos`;
    }

    return `${diffHoras.toFixed(1)} horas`;
  }
}
