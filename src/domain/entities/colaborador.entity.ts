import { CPF } from '../value-objects/cpf.value-object';

export class Colaborador {
  constructor(
    public readonly codEmpresa: number,
    public readonly codColigada: number,
    public readonly codFilial: number,
    public readonly codBand: number,
    public readonly cpf: CPF,
    public readonly nome: string,
    public readonly apelido: string,
    public readonly mesRef: string,
    public readonly anoRef: string,
    public readonly valorTitular: number,
    public readonly valorDependente: number,
    public readonly valorConsumo: number,
    public readonly valorEmpresa: number,
    public readonly valorTotal: number,
    public readonly valorLiquido: number,
    public readonly exporta: 'S' | 'N',
    public readonly ativo: 'S' | 'N',
  ) {}

  get cpfFormatado(): string {
    const cpf = this.cpf.value;
    return `${cpf.slice(0, 3)}.${cpf.slice(3, 6)}.${cpf.slice(6, 9)}-${cpf.slice(9)}`;
  }

  get periodoCompleto(): string {
    return `${this.mesRef}/${this.anoRef}`;
  }

  deveExportar(): boolean {
    return this.exporta === 'S' && this.ativo === 'S';
  }
}
