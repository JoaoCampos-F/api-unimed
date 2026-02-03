import { Injectable } from '@nestjs/common';
import { ProcessoRepository } from '../../../infrastructure/repositories/processo.repository';

export interface ProcessoDto {
  codigo: string;
  descricao: string;
  categoria: string;
  ordem: number;
  dias: number;
  ativo: boolean;
  tipoDeDado: 'S' | 'C';
}

@Injectable()
export class ListarProcessosUseCase {
  constructor(private readonly processoRepository: ProcessoRepository) {}

  async execute(categoria?: string): Promise<ProcessoDto[]> {
    const processos = await this.processoRepository.listarProcessos(categoria);

    return processos.map((p) => ({
      codigo: p.CODIGO,
      descricao: p.DESCRICAO,
      categoria: p.CATEGORIA,
      ordem: p.ORDEM,
      dias: p.DIAS,
      ativo: p.ATIVO === 'S',
      tipoDeDado: p.TIPO_DE_DADO,
    }));
  }
}
