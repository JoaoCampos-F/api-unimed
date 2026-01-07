export interface UniResumoColaborador {
  cod_empresa: number;
  codcoligada: number;
  codfilial: number;
  cod_band: number;
  codigo_cpf: string;
  colaborador: string;
  apelido: string;
  mes_ref: string;
  ano_ref: string;
  m_titular: number;
  m_dependente: number;
  valor_consumo: number;
  perc_empresa: number;
  valor_total: number;
  valor_liquido: number;
  exporta: 'S' | 'N';
  ativo: 'S' | 'N';
}
