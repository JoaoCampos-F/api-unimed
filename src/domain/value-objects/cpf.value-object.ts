export class CPF {
  private readonly _value: string;

  constructor(value: string) {
    if (!this.isValid(value)) {
      throw new Error('CPF inválido');
    }
    this._value = this.format(value);
  }

  get value(): string {
    return this._value;
  }

  private isValid(cpf: string): boolean {
    const cleanCpf = cpf.replace(/\D/g, '');
    if (cleanCpf.length !== 11) return false;

    // Verifica se todos os dígitos são iguais
    if (/^(\d)\1{10}$/.test(cleanCpf)) return false;

    // Validação do primeiro dígito verificador
    let soma = 0;
    for (let i = 0; i < 9; i++) {
      soma += parseInt(cleanCpf.charAt(i)) * (10 - i);
    }
    let resto = soma % 11;
    const digito1 = resto < 2 ? 0 : 11 - resto;

    if (digito1 !== parseInt(cleanCpf.charAt(9))) return false;

    // Validação do segundo dígito verificador
    soma = 0;
    for (let i = 0; i < 10; i++) {
      soma += parseInt(cleanCpf.charAt(i)) * (11 - i);
    }
    resto = soma % 11;
    const digito2 = resto < 2 ? 0 : 11 - resto;

    if (digito2 !== parseInt(cleanCpf.charAt(10))) return false;

    return true;
  }

  private format(cpf: string): string {
    const clean = cpf.replace(/\D/g, '');
    return clean.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, '$1.$2.$3-$4');
  }

  equals(other: CPF): boolean {
    return this._value === other._value;
  }

  toString(): string {
    return this._value;
  }
}
