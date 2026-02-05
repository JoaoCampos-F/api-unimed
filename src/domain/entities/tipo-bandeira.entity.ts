export class TipoBandeira {
  constructor(
    public readonly codBand: number,
    public readonly descricao: string,
    public readonly azTipoComVeic: string,
    public readonly azProcessa: 'S' | 'N',
  ) {}
}

export class TipoBandeiraRow {
  COD_BAND: number;
  DESCRICAO: string;
  AZ_TIPO_COM_VEIC: string;
  AZ_PROCESSA: 'S' | 'N';
}
