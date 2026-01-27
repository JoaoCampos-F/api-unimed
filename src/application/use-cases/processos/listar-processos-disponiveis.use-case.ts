import { Inject, Injectable } from '@nestjs/common';
import { ListarProcessosDisponiveisDto } from 'src/application/dtos/processos/listar-processos-disponiveis.dto';
import type { IProcessoRepository } from 'src/domain/repositories/processo.repository.interface';

@Injectable()
export class ListarProcessosDisponiveisUseCase {
  constructor(
    @Inject('IProcessoRepository')
    private readonly processoRepository: IProcessoRepository,
  ) {}

  async execute(request: ListarProcessosDisponiveisDto) {
    const processos = await this.processoRepository.listarProcessosDisponiveis({
      categoria: request.categoria,
      tipoDeDado: request.tipoDeDado,
    });

    return {
      processos: processos.map((p) => ({
        codigo: p.codigo,
        descricao: p.descricao,
        categoria: p.categoria,
        ordem: p.ordem,
        dias: p.dias,
        ativo: p.ativo,
      })),
      total: processos.length,
    };
  }
}
