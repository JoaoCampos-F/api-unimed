export class Processo {
  constructor(
    public readonly codigo: string,
    public readonly descricao: string,
    public readonly categoria: string,
    public readonly ordem: number,
    public readonly dias: number,
    public readonly ativo: 'S' | 'N',
    public readonly tipoDeDado: 'S' | 'C', //S para simplificado, C para completo
  ) {}
}
