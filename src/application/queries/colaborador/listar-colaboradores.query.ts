import { Injectable } from '@nestjs/common';
import { DatabaseService } from 'src/database/database.services';

export interface ColaboradorListagemDto {
  codEmpresa: number;
  codColigada: number;
  codFilial: number;
  codBand: number;
  cpf: string;
  nome: string;
  apelido: string;
}

interface ColaboradorRow {
  COD_EMPRESA: number;
  CODCOLIGADA: number;
  CODFILIAL: number;
  COD_BAND: number;
  CPF: string;
  NOME: string;
  APELIDO: string;
}

@Injectable()
export class ListarColaboradoresQuery {
  constructor(private readonly databaseService: DatabaseService) {}

  async execute(
    codEmpresa: number,
    codColigada: number,
  ): Promise<ColaboradorListagemDto[]> {
    const sql = `
      SELECT DISTINCT
        c.cod_empresa,
        c.codcoligada,
        c.codfilial,
        c.cod_band,
        c.cpf,
        c.nome,
        c.apelido
      FROM gc.colaboradores c
      WHERE c.cod_empresa = :codEmpresa
        AND c.codcoligada = :codColigada
        AND c.ativo = 'S'
      ORDER BY c.nome
    `;

    const rows = await this.databaseService.executeQuery<ColaboradorRow>(sql, {
      codEmpresa,
      codColigada,
    });

    return rows.map((row) => ({
      codEmpresa: row.COD_EMPRESA,
      codColigada: row.CODCOLIGADA,
      codFilial: row.CODFILIAL,
      codBand: row.COD_BAND,
      cpf: row.CPF,
      nome: row.NOME,
      apelido: row.APELIDO,
    }));
  }
}
