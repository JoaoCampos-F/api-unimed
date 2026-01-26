export class ProcessoLog {
  constructor(
    public readonly id: number,
    public readonly codigo: string,
    public readonly descricao: string,
    public readonly categoria: string,
    public readonly mesRef: number,
    public readonly anoRef: number,
    public readonly usuario: string,
    public readonly dataProc: Date,
    public readonly apaga: 'S' | 'N',
    public readonly previa: 'S' | 'N',
    public readonly duracao: number, // Em segundos
    public readonly erro: string | null,
  ) {}
}
