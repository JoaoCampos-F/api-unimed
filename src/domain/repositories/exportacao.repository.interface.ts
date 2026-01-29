export interface ConfigProcesso {
  dias: number;
  descricao: string;
}

export interface ProcessoLog {
  codigo: string;
  descricao: string;
  categoria: string;
  usuario: string;
  dataProcessamento: Date;
  mesRef: number;
  anoRef: number;
  apaga: boolean;
  previa: boolean;
  horaInicio: number;
  horaFinal: number;
}

export interface ExportacaoParams {
  mesRef: number;
  anoRef: number;
  previa: boolean;
  apagar: boolean;
  usuario: string;
  todas: 'S' | 'N'; // 'S' = todas empresas da bandeira, 'N' = empresa específica
  codEmpresa: number | string; // Número quando todas='N', vazio quando todas='S'
  bandeira: string;
  tipo: string;
  categoria: string;
  cpf?: string | null;
}

/**
 * Repository interface para exportação de dados TOTVS
 * Chama PKG_UNI_SAUDE.P_EXP_PLANO_SAUDE via P_MCW_FECHA_COMISSAO_GLOBAL
 */
export interface IExportacaoRepository {
  /**
   * Busca data final do período de fechamento
   */
  buscarDataFinalPeriodo(mesRef: number, anoRef: number): Promise<Date | null>;

  /**
   * Busca configuração do processo (dias limite, descrição)
   * Código fixo: '90000001' para exportação Unimed
   */
  buscarConfigProcesso(codigoProcesso: string): Promise<ConfigProcesso | null>;

  /**
   * Executa procedure de exportação TOTVS Unimed
   *
   * ⚠️ ATENÇÃO: Em ambiente de desenvolvimento, executa em modo preview
   * sem chamar a procedure real (DB_LINK aponta para produção)
   *
   * @param params - Parâmetros da exportação
   * @returns Promise<void>
   */
  executarExportacao(params: ExportacaoParams): Promise<void>;

  /**
   * Simula exportação retornando preview dos dados
   * Usado em ambiente de desenvolvimento
   */
  simularExportacao(params: ExportacaoParams): Promise<{
    colaboradoresAfetados: number;
    valorTotal: number;
    preview: any[];
  }>;

  /**
   * Busca logs de execução do processo de exportação
   */
  buscarLogsExportacao(params: {
    categoria: string;
    mesRef?: number;
    anoRef?: number;
    codigo?: string;
  }): Promise<ProcessoLog[]>;
}
