import { Injectable, Logger, Inject } from '@nestjs/common';
import type { IColaboradorRepository } from '../../../domain/repositories/colaborador.repository.interface';

export interface AtualizarColaboradorRequest {
  cpf: string;
  mesRef: string;
  anoRef: string;
  exporta: 'S' | 'N';
}

export interface AtualizarColaboradorResponse {
  sucesso: boolean;
  mensagem: string;
}

@Injectable()
export class AtualizarColaboradorUseCase {
  private readonly logger = new Logger(AtualizarColaboradorUseCase.name);

  constructor(
    @Inject('IColaboradorRepository')
    private readonly colaboradorRepository: IColaboradorRepository,
  ) {}

  async execute(
    request: AtualizarColaboradorRequest,
  ): Promise<AtualizarColaboradorResponse> {
    this.logger.log(
      `Atualizando colaborador CPF: ${request.cpf}, Período: ${request.mesRef}/${request.anoRef}, Exporta: ${request.exporta}`,
    );

    await this.colaboradorRepository.atualizarExporta(request);

    const mensagem =
      request.exporta === 'N'
        ? `O valor da Unimed referente ao mês ${request.mesRef} não será enviado`
        : `O valor da Unimed referente ao mês ${request.mesRef} foi readicionado ao colaborador`;

    return {
      sucesso: true,
      mensagem,
    };
  }
}
