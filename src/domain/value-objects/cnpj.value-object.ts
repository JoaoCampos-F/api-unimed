export class CNPJ {
  private readonly _value: string;

  constructor(value: string) {
    if (!this.isValid(value)) {
      throw new Error('CNPJ inválido');
    }
    this._value = this.format(value);
  }

  get value(): string {
    return this._value;
  }

  private isValid(cnpj: string): boolean {
    const cleanCnpj = cnpj.replace(/\D/g, '');
    if (cleanCnpj.length !== 14) return false;

    // Verifica se todos os dígitos são iguais
    if (/^(\d)\1{13}$/.test(cleanCnpj)) return false;

    // Validação dos dígitos verificadores
    let tamanho = cleanCnpj.length - 2;
    let numeros = cleanCnpj.substring(0, tamanho);
    const digitos = cleanCnpj.substring(tamanho);
    let soma = 0;
    let pos = tamanho - 7;

    for (let i = tamanho; i >= 1; i--) {
      soma += parseInt(numeros.charAt(tamanho - i)) * pos--;
      if (pos < 2) pos = 9;
    }

    let resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11);
    if (resultado !== parseInt(digitos.charAt(0))) return false;

    tamanho = tamanho + 1;
    numeros = cleanCnpj.substring(0, tamanho);
    soma = 0;
    pos = tamanho - 7;

    for (let i = tamanho; i >= 1; i--) {
      soma += parseInt(numeros.charAt(tamanho - i)) * pos--;
      if (pos < 2) pos = 9;
    }

    resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11);
    if (resultado !== parseInt(digitos.charAt(1))) return false;

    return true;
  }

  private format(cnpj: string): string {
    const clean = cnpj.replace(/\D/g, '');
    return clean.replace(
      /^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/,
      '$1.$2.$3/$4-$5',
    );
  }

  equals(other: CNPJ): boolean {
    return this._value === other._value;
  }

  toString(): string {
    return this._value;
  }
}
