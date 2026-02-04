import { Injectable } from '@nestjs/common';
import { DatabaseService } from 'src/database/database.services';

export interface ContratoListagemDto {
  codEmpresa: number;
  codColigada: number;
  codFilial: number;
  codBand: number;
  cnpj: string;
  contrato: string;
}

interface ContratoRow {
  COD_EMPRESA: number;
  CODCOLIGADA: number;
  CODFILIAL: number;
  COD_BAND: number;
  CNPJ: string;
  CONTRATO: string;
}

@Injectable()
export class ListarContratosQuery {
  constructor(private readonly databaseService: DatabaseService) {}

  async execute(): Promise<ContratoListagemDto[]> {
    const sql = `
      SELECT DISTINCT
        ef.cod_empresa,
        ef.codcoligada,
        ef.codfilial,
        ef.cod_band,
        ef.cnpj,
        ef.contrato
      FROM gc.empresa_filial ef
      WHERE ef.ativo = 'S'
        AND ef.processa_unimed = 'S'
        AND ef.contrato IS NOT NULL
      ORDER BY ef.contrato
    `;

    const rows = await this.databaseService.executeQuery<ContratoRow>(sql);

    return rows.map((row) => ({
      codEmpresa: row.COD_EMPRESA,
      codColigada: row.CODCOLIGADA,
      codFilial: row.CODFILIAL,
      codBand: row.COD_BAND,
      cnpj: row.CNPJ,
      contrato: row.CONTRATO,
    }));
  }
}
