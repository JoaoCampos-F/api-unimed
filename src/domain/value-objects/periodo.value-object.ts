export class Periodo {
  constructor(
    private readonly mes: number,
    private readonly ano: number,
  ) {
    this.validate();
  }

  private validate(): void {
    if (this.mes < 1 || this.mes > 12) {
      throw new Error('Mês deve estar entre 1 e 12');
    }
    if (this.ano < 2000 || this.ano > 2100) {
      throw new Error('Ano inválido');
    }
  }

  get mesFormatado(): string {
    return this.mes.toString().padStart(2, '0');
  }

  get anoString(): string {
    return this.ano.toString();
  }

  get periodoFormatado(): string {
    return `${this.mesFormatado}${this.ano}`;
  }

  calcularMesReferencia(): Periodo {
    const mesAnterior = this.mes - 1;
    if (mesAnterior === 0) {
      return new Periodo(12, this.ano - 1);
    }
    return new Periodo(mesAnterior, this.ano);
  }

  equals(other: Periodo): boolean {
    return this.mes === other.mes && this.ano === other.ano;
  }
}
