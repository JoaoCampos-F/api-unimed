import { Injectable } from '@nestjs/common';
import { DatabaseService } from 'src/database/database.services';

export interface ContratoListagemDto {
  contratos: string;
  contrato: string;
  abrangencia: string;
  cnpj: string;
  codEmpresa: number;
  codBand: number;
}

interface ContratoRow {
  CONTRATOS: string;
  CONTRATO: string;
  ABRANGENCIA: string;
  CNPJ: string;
  COD_EMPRESA: number;
  COD_BAND: number;
}

@Injectable()
export class ListarContratosQuery {
  constructor(private readonly databaseService: DatabaseService) {}

  async execute(codEmpresa?: number): Promise<ContratoListagemDto[]> {
    let sql = `
      SELECT 
        contratos,
        contrato,
        abrangencia,
        cnpj,
        cod_empresa,
        cod_band
      FROM gc.vw_uni_dados_contratos
      WHERE 
        contrato IS NOT NULL
    `;

    const binds: any = {};

    if (codEmpresa) {
      sql += ` AND cod_empresa = :codEmpresa`;
      binds.codEmpresa = codEmpresa;
    }

    sql += ` ORDER BY contrato`;
    const rows = await this.databaseService.executeQuery<ContratoRow>(
      sql,
      binds,
    );

    return rows.map((row) => ({
      contratos: row.CONTRATOS,
      contrato: row.CONTRATO,
      abrangencia: row.ABRANGENCIA,
      cnpj: row.CNPJ,
      codEmpresa: row.COD_EMPRESA,
      codBand: row.COD_BAND,
    }));
  }
}
