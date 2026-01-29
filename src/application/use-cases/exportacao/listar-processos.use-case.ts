import { Injectable, Logger, Inject } from '@nestjs/common';
import type { IProcessoRepository } from '../../../domain/repositories/processo.repository.interface';
import {
  ListarProcessosDto,
  ProcessoResponseDto,
} from '../../dtos/exportacao/listar-processos.dto';

/**
 * Use Case: Listar Processos Disponíveis
 * Replicando comportamento do NPD-Legacy: case 'Buscarprocesso'
 */
@Injectable()
export class ListarProcessosUseCase {
  private readonly logger = new Logger(ListarProcessosUseCase.name);

  constructor(
    @Inject('IProcessoRepository')
    private readonly processoRepository: IProcessoRepository,
  ) {}

  /**
   * Executa listagem de processos disponíveis
   * Idêntico ao NPD-Legacy: carregaProcessosProcessa()
   */
  async execute(dto: ListarProcessosDto): Promise<ProcessoResponseDto[]> {
    this.logger.log(
      `Listando processos: ${dto.categoria} - ${dto.tipoDado} - ${dto.mesRef}/${dto.anoRef}`,
    );

    const processos = await this.processoRepository.buscarProcessosDisponiveis({
      categoria: dto.categoria,
      tipoDado: dto.tipoDado,
      mesRef: dto.mesRef,
      anoRef: dto.anoRef,
    });

    this.logger.log(`${processos.length} processo(s) disponível(is)`);

    return processos.map((processo) => ({
      codigo: processo.codigo,
      categoria: processo.categoria,
      procedure: processo.procedure,
      descricao: processo.descricao,
      ordem: processo.ordem,
      dias: processo.dias,
      usuario: processo.usuario,
      tipoEmpresa: processo.tipoEmpresa,
      tipoDado: processo.tipoDado,
      ativo: processo.ativo,
      dataUltimaExecucao:
        processo.dataUltimaExecucao &&
        processo.dataUltimaExecucao instanceof Date
          ? this.formatarDataBrasileira(processo.dataUltimaExecucao)
          : null,
    }));
  }

  /**
   * Formata data para padrão brasileiro com hora
   * Formato: 'DD/MM/YYYY HH:MM:SS'
   */
  private formatarDataBrasileira(data: Date): string {
    const dia = String(data.getDate()).padStart(2, '0');
    const mes = String(data.getMonth() + 1).padStart(2, '0');
    const ano = data.getFullYear();
    const hora = String(data.getHours()).padStart(2, '0');
    const minuto = String(data.getMinutes()).padStart(2, '0');
    const segundo = String(data.getSeconds()).padStart(2, '0');

    return `${dia}/${mes}/${ano} ${hora}:${minuto}:${segundo}`;
  }
}
