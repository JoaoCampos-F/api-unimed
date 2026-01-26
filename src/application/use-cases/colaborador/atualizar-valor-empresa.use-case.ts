import { Injectable, Logger, Inject } from '@nestjs/common';
import type { IColaboradorRepository } from '../../../domain/repositories/colaborador.repository.interface';

export interface AtualizarValorEmpresaRequest {
  codEmpresa: number;
  codColigada: number;
  codFilial: number;
  valor: number;
}

export interface AtualizarValorEmpresaResponse {
  sucesso: boolean;
  mensagem: string;
}

@Injectable()
export class AtualizarValorEmpresaUseCase {
  private readonly logger = new Logger(AtualizarValorEmpresaUseCase.name);

  constructor(
    @Inject('IColaboradorRepository')
    private readonly colaboradorRepository: IColaboradorRepository,
  ) {}

  async execute(
    request: AtualizarValorEmpresaRequest,
  ): Promise<AtualizarValorEmpresaResponse> {
    this.logger.log(
      `Atualizando valor empresa: ${request.codEmpresa} para R$ ${request.valor.toFixed(2)}`,
    );

    await this.colaboradorRepository.atualizarValorEmpresa(request);

    return {
      sucesso: true,
      mensagem: `Valor atualizado com sucesso para R$ ${request.valor.toFixed(2).replace('.', ',')}`,
    };
  }
}
