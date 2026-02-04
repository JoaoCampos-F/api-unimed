import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from './../../../database/database.services';

export interface AtualizarExportaColaboradorParams {
  codigoCpf: string;
  mesRef: string;
  anoRef: string;
  exporta: 'S' | 'N';
}

export interface AtualizarExportaColaboradorResponse {
  sucesso: boolean;
  mensagem: string;
  registrosAfetados: number;
}

@Injectable()
export class AtualizarExportaColaboradorCommand {
  private readonly logger = new Logger(AtualizarExportaColaboradorCommand.name);

  constructor(private readonly databaseService: DatabaseService) {}

  async execute(
    params: AtualizarExportaColaboradorParams,
  ): Promise<AtualizarExportaColaboradorResponse> {
    const { codigoCpf, mesRef, anoRef, exporta } = params;

    this.logger.log(
      `Atualizando exporta colaborador CPF: ${codigoCpf}, Período: ${mesRef}/${anoRef}, Exporta: ${exporta}`,
    );

    // SQL conforme legacy UnimedDAO.php updateColaborador (linhas 300-323)
    const sql = `
      UPDATE gc.uni_resumo_colaborador
      SET exporta = :exporta
      WHERE ltrim(codigo_cpf, '0000') = ltrim(:codigoCpf, '0000')
        AND mes_ref = :mesRef
        AND ano_ref = :anoRef
    `;

    const binds = {
      exporta,
      codigoCpf,
      mesRef,
      anoRef,
    };

    try {
      const registrosAfetados = await this.databaseService.executeUpdate(
        sql,
        binds,
      );

      if (registrosAfetados === 0) {
        return {
          sucesso: false,
          mensagem: `Colaborador com CPF ${codigoCpf} não encontrado para o período ${mesRef}/${anoRef}`,
          registrosAfetados: 0,
        };
      }

      const mensagem =
        exporta === 'N'
          ? `O valor da Unimed referente ao mês ${mesRef} não será enviado`
          : `O valor da Unimed referente ao mês ${mesRef}, foi readicionado ao Colaborador`;

      this.logger.log(
        `Colaborador atualizado com sucesso: ${registrosAfetados} registro(s)`,
      );

      return {
        sucesso: true,
        mensagem,
        registrosAfetados,
      };
    } catch (error) {
      this.logger.error(
        `Erro ao atualizar colaborador: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }
}
