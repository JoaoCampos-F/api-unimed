import { CPF } from './cpf.value-object';
import { CNPJ } from './cnpj.value-object';

/**
 * Value Object que representa um documento fiscal (CPF ou CNPJ)
 *
 * ⚠️ CASO DE USO: API Unimed retorna CPF no campo "cnpj" para fazendas
 * que não possuem CNPJ, apenas CPF do proprietário.
 *
 * Esta classe detecta automaticamente se o documento é CPF ou CNPJ
 * baseado no comprimento após remover caracteres não numéricos.
 */
export class DocumentoFiscal {
  private readonly _documento: CPF | CNPJ;
  private readonly _tipo: 'CPF' | 'CNPJ';

  constructor(valor: string) {
    const valorLimpo = valor.replace(/\D/g, '');

    if (valorLimpo.length === 11) {
      this._documento = new CPF(valorLimpo);
      this._tipo = 'CPF';
    } else if (valorLimpo.length === 14) {
      this._documento = new CNPJ(valorLimpo);
      this._tipo = 'CNPJ';
    } else {
      throw new Error(
        `Documento inválido: esperado CPF (11 dígitos) ou CNPJ (14 dígitos), recebido ${valorLimpo.length} dígitos`,
      );
    }
  }

  /**
   * Retorna o valor sem formatação (apenas números)
   */
  get value(): string {
    return this._documento.value;
  }

  /**
   * Retorna o tipo do documento
   */
  get tipo(): 'CPF' | 'CNPJ' {
    return this._tipo;
  }

  /**
   * Retorna se é CPF
   */
  get isCPF(): boolean {
    return this._tipo === 'CPF';
  }

  /**
   * Retorna se é CNPJ
   */
  get isCNPJ(): boolean {
    return this._tipo === 'CNPJ';
  }

  /**
   * Retorna o documento formatado (com pontuação)
   */
  getFormatted(): string {
    return this._documento.getFormatted();
  }

  /**
   * Retorna o documento interno (CPF ou CNPJ)
   */
  getDocumento(): CPF | CNPJ {
    return this._documento;
  }

  equals(other: DocumentoFiscal): boolean {
    return this._documento.equals(other._documento as any);
  }

  toString(): string {
    return this._documento.toString();
  }
}
