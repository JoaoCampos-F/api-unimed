/**
 * Entity: Processo MCW
 * Representa um processo de exportação/importação configurado no sistema
 * Tabela: gc.mcw_processo
 */
export class Processo {
  constructor(
    public readonly codigo: string,
    public readonly categoria: string,
    public readonly procedure: string,
    public readonly descricao: string,
    public readonly ordem: number,
    public readonly dias: number,
    public readonly usuario: string,
    public readonly tipoEmpresa: string,
    public readonly tipoDado: string,
    public readonly ativo: string,
    public readonly dataUltimaExecucao?: Date | null,
  ) {}

  // Manter compatibilidade com código existente
  get tipoDeDado(): 'S' | 'C' {
    return this.tipoDado as 'S' | 'C';
  }
}
