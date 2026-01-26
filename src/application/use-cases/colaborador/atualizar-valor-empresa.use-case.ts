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

    const rowsAffected =
      await this.colaboradorRepository.atualizarValorEmpresa(request);

    if (rowsAffected === 0) {
      return {
        sucesso: false,
        mensagem: `Nenhum colaborador ativo encontrado para a empresa ${request.codEmpresa}`,
      };
    }

    return {
      sucesso: true,
      mensagem: `Valor atualizado com sucesso para R$ ${request.valor.toFixed(2).replace('.', ',')} (${rowsAffected} colaboradores)`,
    };
  }
}
