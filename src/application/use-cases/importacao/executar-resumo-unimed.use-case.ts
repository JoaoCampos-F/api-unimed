/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Inject, Injectable, Logger } from '@nestjs/common';
import type { IDadosCobrancaRepository } from '../../../domain/repositories/dados-cobranca.repository.interface';
import { Periodo } from '../../../domain/value-objects/periodo.value-object';

export interface ExecutarResumoUnimedRequest {
  mes: number;
  ano: number;
}

export interface ExecutarResumoUnimedResponse {
  sucesso: boolean;
  mensagem: string;
}

@Injectable()
export class ExecutarResumoUnimedUseCase {
  private readonly logger = new Logger(ExecutarResumoUnimedUseCase.name);

  constructor(
    @Inject('IDadosCobrancaRepository')
    private readonly dadosCobrancaRepository: IDadosCobrancaRepository,
  ) {}

  async execute(
    request: ExecutarResumoUnimedRequest,
  ): Promise<ExecutarResumoUnimedResponse> {
    try {
      const periodo = new Periodo(request.mes, request.ano);
      const periodoRef = periodo.calcularMesReferencia();

      this.logger.log(
        `Executando resumo para período de referência: ${periodoRef.mesFormatado}/${periodoRef.anoString}`,
      );

      await this.dadosCobrancaRepository.executarResumo(periodo);

      const mensagem = `Resumo de dados executado com sucesso para ${periodoRef.mesFormatado}/${periodoRef.anoString}`;
      this.logger.log(mensagem);

      return {
        sucesso: true,
        mensagem,
      };
    } catch (error) {
      const mensagemErro = `Erro ao executar resumo: ${error.message}`;
      this.logger.error(mensagemErro);

      return {
        sucesso: false,
        mensagem: mensagemErro,
      };
    }
  }
}
