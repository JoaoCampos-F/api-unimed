export class DomainException extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DomainException';
  }
}

export class InvalidCnpjException extends DomainException {
  constructor(cnpj: string) {
    super(`CNPJ inválido: ${cnpj}`);
    this.name = 'InvalidCnpjException';
  }
}

export class InvalidCpfException extends DomainException {
  constructor(cpf: string) {
    super(`CPF inválido: ${cpf}`);
    this.name = 'InvalidCpfException';
  }
}

export class EmpresaNotFoundException extends DomainException {
  constructor(codEmpresa: number) {
    super(`Empresa não encontrada: ${codEmpresa}`);
    this.name = 'EmpresaNotFoundException';
  }
}

export class InvalidPeriodoException extends DomainException {
  constructor(mes: number, ano: number) {
    super(`Período inválido: ${mes}/${ano}`);
    this.name = 'InvalidPeriodoException';
  }
}