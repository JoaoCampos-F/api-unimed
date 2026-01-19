import { CNPJ } from '../value-objects/cnpj.value-object';

export class Empresa {
  constructor(
    private readonly _codEmpresa: number,
    private readonly _codColigada: number,
    private readonly _codFilial: number,
    private readonly _codBand: number,
    private readonly _cnpj: CNPJ,
    private readonly _processaUnimed: boolean = true,
  ) {}

  get codEmpresa(): number {
    return this._codEmpresa;
  }

  get codColigada(): number {
    return this._codColigada;
  }

  get codFilial(): number {
    return this._codFilial;
  }

  get codBand(): number {
    return this._codBand;
  }

  get cnpj(): CNPJ {
    return this._cnpj;
  }

  get processaUnimed(): boolean {
    return this._processaUnimed;
  }

  podeProcessarUnimed(): boolean {
    return this._processaUnimed;
  }
}
