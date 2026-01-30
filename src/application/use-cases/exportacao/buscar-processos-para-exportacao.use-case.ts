import { Injectable, Logger, Inject } from '@nestjs/common';
import type { IProcessoRepository } from '../../../domain/repositories/processo.repository.interface';
import {
  ListarProcessosDto,
  ProcessoResponseDto,
} from '../../dtos/exportacao/listar-processos.dto';

/**
 * Use Case: Buscar Processos Para Exportação
 *
 * Busca processos com informações de auditoria (última execução)
 * para seleção antes de exportar para TOTVS.
 *
 * Replicando comportamento do NPD-Legacy: case 'Buscarprocesso'
 * Usado na modal de exportação com checkboxes
 */
@Injectable()
export class BuscarProcessosParaExportacaoUseCase {
  private readonly logger = new Logger(
    BuscarProcessosParaExportacaoUseCase.name,
  );

  constructor(
    @Inject('IProcessoRepository')
    private readonly processoRepository: IProcessoRepository,
  ) {}

  /**
   * Executa listagem de processos para exportação
   * Idêntico ao NPD-Legacy: carregaDadosMCW()
   *
   * Retorna processos com:
   * - Dados completos do processo
   * - Data da última execução (para auditoria)
   * - Usuário que executou
   */
  async execute(dto: ListarProcessosDto): Promise<ProcessoResponseDto[]> {
    this.logger.log(
      `Buscando processos para exportação: ${dto.categoria} - ${dto.tipoDado} - ${dto.mesRef}/${dto.anoRef}`,
    );

    const processos = await this.processoRepository.buscarProcessosDisponiveis({
      categoria: dto.categoria,
      tipoDado: dto.tipoDado,
      mesRef: dto.mesRef,
      anoRef: dto.anoRef,
    });

    this.logger.log(
      `${processos.length} processo(s) disponível(is) para exportação`,
    );

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
