import { CNPJ } from '../value-objects/cnpj.value-object';
import { DocumentoFiscal } from '../value-objects/documento-fiscal.value-object';

/**
 * Entidade Empresa
 *
 * ⚠️ IMPORTANTE: Suporta tanto CNPJ quanto CPF no campo documento fiscal.
 * Isso é necessário porque fazendas do Grupo Cometa não têm CNPJ,
 * apenas o CPF do proprietário, e a API Unimed retorna CPF no campo "cnpj".
 */
export class Empresa {
  constructor(
    private readonly _codEmpresa: number,
    private readonly _codColigada: number,
    private readonly _codFilial: number,
    private readonly _codBand: number,
    private readonly _documentoFiscal: DocumentoFiscal,
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

  /**
   * @deprecated Use documentoFiscal ao invés disso
   * Mantido por compatibilidade, mas retorna DocumentoFiscal
   */
  get cnpj(): CNPJ | DocumentoFiscal {
    return this._documentoFiscal;
  }

  /**
   * Retorna o documento fiscal (CPF ou CNPJ)
   */
  get documentoFiscal(): DocumentoFiscal {
    return this._documentoFiscal;
  }

  get processaUnimed(): boolean {
    return this._processaUnimed;
  }

  podeProcessarUnimed(): boolean {
    return this._processaUnimed;
  }
}
