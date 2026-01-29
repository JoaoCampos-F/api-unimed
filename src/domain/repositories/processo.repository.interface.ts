import { ProcessoLog } from '../entities/processo-log';
import { Processo } from '../entities/processo.entity';

export interface IProcessoRepository {
  // Lista processos disponíveis para execução (existente)
  listarProcessosDisponiveis(params: {
    categoria: string;
    tipoDeDado: 'S' | 'C';
  }): Promise<Processo[]>;

  /**
   * Busca processos ativos filtrados por categoria, tipo de dado e período
   * Inclui data da última execução para auditoria
   * Réplica do NPD-Legacy: carregaProcessosProcessa()
   *
   * @param params - Filtros de busca
   * @returns Array de processos disponíveis
   */
  buscarProcessosDisponiveis(params: {
    categoria: string;
    tipoDado: string;
    mesRef: number;
    anoRef: number;
  }): Promise<Processo[]>;

  /**
   * Busca processo específico por código
   * Para validar antes de executar exportação
   *
   * @param codigo - Código do processo (ex: '90000001')
   * @returns Processo encontrado ou null
   */
  buscarPorCodigo(codigo: string): Promise<Processo | null>;

  // Executa procedure de processamento (existente)
  executarProcesso(params: {
    processo: string;
    mesRef: number;
    anoRef: number;
    previa: 'S' | 'N';
    apaga: 'S' | 'N';
    usuario: string;
    todasEmpresas: 'S' | 'N';
    codEmpresa?: number;
    codColigada?: number;
    codFilial?: number;
    codBand?: number;
    tipoComissao: 'S' | 'C';
    cpf?: string;
  }): Promise<void>;

  // Busca histórico de execuções
  buscarHistorico(params: {
    categoria: string;
    mesRef?: number;
    anoRef?: number;
    codigo?: string;
  }): Promise<ProcessoLog[]>;

  // Valida prazo de execução
  validarPrazoExecucao(params: {
    mesRef: number;
    anoRef: number;
    processo: string;
  }): Promise<{
    dentroDoPrazo: boolean;
    dataMaxima: Date;
    diasRestantes: number;
  }>;
}
