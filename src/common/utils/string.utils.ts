export class StringUtils {
  static removerAcentos(texto: string): string {
    if (!texto) return '';
    return texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  }

  static formatarCnpj(cnpj: string): string {
    const clean = cnpj.replace(/\D/g, '');
    return clean.replace(
      /^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/,
      '$1.$2.$3/$4-$5',
    );
  }

  static formatarCpf(cpf: string): string {
    const clean = cpf.replace(/\D/g, '');
    return clean.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, '$1.$2.$3-$4');
  }

  static limparString(texto: string): string {
    return texto?.trim().replace(/\s+/g, ' ') || '';
  }
}