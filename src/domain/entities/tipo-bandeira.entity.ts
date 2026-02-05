export class TipoBandeira {
  constructor(
    public readonly codBand: number,
    public readonly descricao: string,
    public readonly TipoComVeic: string,
    public readonly Processa: 'S' | 'N',
  ) {}
}

export class TipoBandeiraRow {
  COD_BAND: number;
  DESCRICAO: string;
  TIPO_COM_VEIC: string;
  PROCESSA: 'S' | 'N';
}
