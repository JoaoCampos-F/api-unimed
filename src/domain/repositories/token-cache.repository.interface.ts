/**
 * Interface para Cache de Token da API Unimed
 *
 * ⚠️ CRÍTICO: Token tem validade de 6 HORAS
 * ⚠️ API tem LIMITE DIÁRIO de geração de tokens
 * ⚠️ Gerar tokens desnecessariamente pode BLOQUEAR todo o departamento
 */
export interface TokenCache {
  token: string;
  dataGeracao: Date;
  validoAte: Date;
}

/**
 * Repository para persistência de token no banco Oracle
 * Tabela: gc.api_gc_servicos
 */
export interface ITokenCacheRepository {
  /**
   * Busca token válido do cache
   * @returns Token se válido, null se expirado ou inexistente
   */
  buscarTokenValido(): Promise<string | null>;

  /**
   * Salva novo token no cache
   * @param token - Token gerado pela API Unimed
   */
  salvarToken(token: string): Promise<void>;

  /**
   * Verifica se token ainda é válido (6 horas)
   * @param dataGeracao - Data de geração do token
   * @returns true se ainda válido, false se expirado
   */
  isTokenValido(dataGeracao: Date): boolean;
}
