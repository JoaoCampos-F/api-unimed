import { ProcessoLog } from '../entities/processo-log';
import { Processo } from '../entities/processo.entity';

export interface IProcessoRepository {
  // Lista processos disponíveis para execução
  listarProcessosDisponiveis(params: {
    categoria: string;
    tipoDeDado: 'S' | 'C';
  }): Promise<Processo[]>;

  // Executa procedure de processamento
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
