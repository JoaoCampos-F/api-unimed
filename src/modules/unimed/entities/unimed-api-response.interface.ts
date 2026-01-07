export interface UnimedBeneficiario {
  codbeneficiario: string;
  beneficiario: string;
  idade: number;
  nascimento: string;
  inclusao: string;
  dependencia: string;
  cpf: string;
  valorcobrado: number;
  descricao: string;
  acomodacao: string;
  codtitular: string;
  titular: string;
  cpftitular: string;
  matricula: string;
}

export interface UnimedFatura {
  fatura: UnimedBeneficiario[];
}

export interface UnimedMensalidade {
  contrato: string;
  contratante: string;
  nomeplano: string;
  abrangencia: string;
  codfatura: string;
  valor_fatura: number;
  periodo: string;
  fatura: UnimedFatura;
}

export interface UnimedApiResponse {
  mensalidades: UnimedMensalidade[];
}
