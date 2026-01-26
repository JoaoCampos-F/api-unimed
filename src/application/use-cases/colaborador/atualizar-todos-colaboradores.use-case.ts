import { Injectable, Logger, Inject } from '@nestjs/common';
import type { IColaboradorRepository } from '../../../domain/repositories/colaborador.repository.interface';

export interface AtualizarTodosColaboradoresRequest {
  codEmpresa: number;
  codColigada: number;
  codFilial: number;
  mesRef: string;
  anoRef: string;
  exporta: 'S' | 'N';
}

export interface AtualizarTodosColaboradoresResponse {
  sucesso: boolean;
  mensagem: string;
  quantidadeAtualizada: number;
}

@Injectable()
export class AtualizarTodosColaboradoresUseCase {
  private readonly logger = new Logger(AtualizarTodosColaboradoresUseCase.name);

  constructor(
    @Inject('IColaboradorRepository')
    private readonly colaboradorRepository: IColaboradorRepository,
  ) {}

  async execute(
    request: AtualizarTodosColaboradoresRequest,
  ): Promise<AtualizarTodosColaboradoresResponse> {
    this.logger.log(
      `Atualizando todos colaboradores - Empresa: ${request.codEmpresa}, Período: ${request.mesRef}/${request.anoRef}, Exporta: ${request.exporta}`,
    );

    const quantidade =
      await this.colaboradorRepository.atualizarTodosExporta(request);

    const mensagem =
      request.exporta === 'N'
        ? `${quantidade} colaboradores não serão enviados para pagamento`
        : `${quantidade} colaboradores foram marcados para exportação`;

    return {
      sucesso: true,
      mensagem,
      quantidadeAtualizada: quantidade,
    };
  }
}
