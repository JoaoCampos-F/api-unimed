import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from '../../database/database.services';
import { Periodo } from '../../domain/value-objects/periodo.value-object';

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

  constructor(private readonly databaseService: DatabaseService) {}

  async execute(
    request: ExecutarResumoUnimedRequest,
  ): Promise<ExecutarResumoUnimedResponse> {
    try {
      const periodo = new Periodo(request.mes, request.ano);
      const periodoRef = periodo.calcularMesReferencia();

      this.logger.log(
        `Executando resumo para período de referência: ${periodoRef.mesFormatado}/${periodoRef.anoString}`,
      );

      const plsql = `
        BEGIN
          gc.PKG_UNI_SAUDE.p_uni_resumo(:mes_ref, :ano_ref);
        END;
      `;

      const binds = {
        mes_ref: parseInt(periodoRef.mesFormatado, 10),
        ano_ref: parseInt(periodoRef.anoString, 10),
      };

      await this.databaseService.executeProcedure(plsql, binds);

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
