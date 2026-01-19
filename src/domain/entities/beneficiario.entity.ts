import { CPF } from '../value-objects/cpf.value-object';

export class Beneficiario {
  constructor(
    private readonly _codBeneficiario: string,
    private readonly _nome: string,
    private readonly _cpf: CPF,
    private readonly _idade: number,
    private readonly _nascimento: Date,
    private readonly _inclusao: Date,
    private readonly _dependencia: string,
    private readonly _valorCobrado: number,
    private readonly _descricao: string,
  ) {}

  get codBeneficiario(): string {
    return this._codBeneficiario;
  }

  get nome(): string {
    return this._nome;
  }

  get cpf(): CPF {
    return this._cpf;
  }

  get idade(): number {
    return this._idade;
  }

  get nascimento(): Date {
    return this._nascimento;
  }

  get inclusao(): Date {
    return this._inclusao;
  }

  get dependencia(): string {
    return this._dependencia;
  }

  get valorCobrado(): number {
    return this._valorCobrado;
  }

  get descricao(): string {
    return this._descricao;
  }

  get descricaoSemAcentos(): string {
    return this.removerAcentos(this._descricao);
  }

  private removerAcentos(texto: string): string {
    return texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  }

  ehTitular(): boolean {
    return !this._dependencia || this._dependencia.trim() === '';
  }
}
