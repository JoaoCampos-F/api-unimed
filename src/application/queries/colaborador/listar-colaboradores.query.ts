import { Injectable } from '@nestjs/common';
import { DatabaseService } from 'src/database/database.services';

export interface ColaboradorListagemDto {
  codEmpresa: number;
  codColigada: number;
  codFilial: number;
  codBand: number;
  cpf: string;
  nome: string;
}

interface ColaboradorRow {
  COD_EMPRESA: number;
  CODCOLIGADA: number;
  CODFILIAL: number;
  COD_BAND: number;
  CODIGO_CPF: string; // Ajustado para bater com o SQL
  NOME: string;
}

@Injectable()
export class ListarColaboradoresQuery {
  constructor(private readonly databaseService: DatabaseService) {}

  async execute(
    codEmpresa?: number,
    codColigada?: number,
  ): Promise<ColaboradorListagemDto[]> {
    let sql = `
      SELECT DISTINCT
        c.cod_empresa,
        c.codcoligada,
        c.codfilial,
        c.cod_band,
        c.codigo_cpf,
        c.nome
      FROM gc.colaborador c
      WHERE 1=1
      AND c.tipo=1
    `;

    const binds: any = {};

    if (codEmpresa) {
      sql += ` AND c.cod_empresa = :codEmpresa`;
      binds.codEmpresa = codEmpresa;
    }

    if (codColigada) {
      sql += ` AND c.codcoligada = :codColigada`;
      binds.codColigada = codColigada;
    }

    sql += ` ORDER BY c.nome`;

    // Limite de 100 registros se não houver empresa especificada
    if (!codEmpresa) {
      sql += ` FETCH FIRST 100 ROWS ONLY`;
    }

    const rows = await this.databaseService.executeQuery<ColaboradorRow>(
      sql,
      binds,
    );

    return rows.map((row) => ({
      codEmpresa: row.COD_EMPRESA,
      codColigada: row.CODCOLIGADA,
      codFilial: row.CODFILIAL,
      codBand: row.COD_BAND,
      cpf: row.CODIGO_CPF,
      nome: row.NOME,
    }));
  }
}
