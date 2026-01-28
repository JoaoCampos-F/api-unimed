// Interface para geração de relatórios via JasperReports Server
export interface IRelatorioRepository {
  /**
   * Gera relatório individual de colaborador(es)
   */
  gerarRelatorioColaborador(
    params: RelatorioColaboradorParams,
  ): Promise<Buffer>;

  /**
   * Gera resumo de todos colaboradores da empresa
   */
  gerarRelatorioEmpresaColaborador(
    params: RelatorioEmpresaParams,
  ): Promise<Buffer>;

  /**
   * Gera relatório apenas de colaboradores com lançamento (exporta='S')
   */
  gerarRelatorioPagamento(params: RelatorioParams): Promise<Buffer>;

  /**
   * Gera relatório apenas de colaboradores sem lançamento (exporta='N')
   */
  gerarRelatorioNaoPagamento(params: RelatorioParams): Promise<Buffer>;

  /**
   * Gera resumo por colaborador e centro de custo
   */
  gerarResumoDepto(params: RelatorioParams): Promise<Buffer>;

  /**
   * Gera totalização por centro de custo (agregado)
   */
  gerarResumoCentroCusto(params: RelatorioParams): Promise<Buffer>;
}

/**
 * Parâmetros para relatório individual de colaborador
 * Aceita filtro por CPF específico
 */
export interface RelatorioColaboradorParams {
  codEmpresa: number;
  codColigada: number;
  codFilial: number;
  mesRef: string; // Formato: "01", "02", etc
  anoRef: number;
  codBand: number;
  cpf?: string; // Opcional - filtrar colaborador específico
  codContrato?: string; // Opcional - filtrar por contrato
}

/**
 * Parâmetros para relatório de empresa (sem filtro por CPF)
 * Sempre retorna todos os colaboradores
 */
export interface RelatorioEmpresaParams {
  codEmpresa: number;
  codColigada: number;
  codFilial: number;
  mesRef: string;
  anoRef: number;
  codBand: number;
  codContrato?: string;
}

/**
 * Parâmetros genéricos para demais relatórios
 */
export interface RelatorioParams {
  codEmpresa: number;
  codColigada: number;
  codFilial: number;
  mesRef: string;
  anoRef: number;
  codBand: number;
  codContrato?: string;
}
