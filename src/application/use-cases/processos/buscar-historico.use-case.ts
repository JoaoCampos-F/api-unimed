import { Inject, Injectable } from '@nestjs/common';
import { BuscarHistoricoDto } from 'src/application/dtos/processos/buscar-historico.dto';
import type { IProcessoRepository } from 'src/domain/repositories/processo.repository.interface';

@Injectable()
export class BuscarHistoricoUseCase {
  constructor(
    @Inject('IProcessoRepository')
    private readonly processoRepository: IProcessoRepository,
  ) {}

  async execute(request: BuscarHistoricoDto) {
    const historico = await this.processoRepository.buscarHistorico({
      categoria: request.categoria,
      mesRef: request.mesRef,
      anoRef: request.anoRef,
      codigo: request.codigo,
    });

    return {
      historico: historico.map((log) => ({
        id: log.id,
        codigo: log.codigo,
        descricao: log.descricao,
        categoria: log.categoria,
        mesRef: log.mesRef,
        anoRef: log.anoRef,
        usuario: log.usuario,
        dataProc: log.dataProc,
        apaga: log.apaga,
        previa: log.previa,
        duracao: log.duracao,
        erro: log.erro,
      })),
      total: historico.length,
    };
  }
}
