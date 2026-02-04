import { Injectable, Inject } from '@nestjs/common';
import { DatabaseService } from 'src/database/database.services';

export interface EmpresaListagemDto {
  codEmpresa: number;
  codColigada: number;
  codFilial: number;
  codBand: number;
  cnpj: string;
  apelido: string;
}

interface EmpresaRow {
  COD_EMPRESA: number;
  CODCOLIGADA: number;
  CODFILIAL: number;
  COD_BAND: number;
  CNPJ: string;
  APELIDO: string;
}

@Injectable()
export class ListarEmpresasQuery {
  constructor(private readonly databaseService: DatabaseService) {}

  async execute(): Promise<EmpresaListagemDto[]> {
    const sql = `
      SELECT 
        cod_empresa,
        codcoligada,
        codfilial,
        cod_band,
        cnpj,
        apelido
      FROM gc.empresa_filial
      WHERE ativo = 'S' 
        AND processa_unimed = 'S'
      ORDER BY apelido, cod_empresa
    `;

    const rows = await this.databaseService.executeQuery<EmpresaRow>(sql);

    return rows.map((row) => ({
      codEmpresa: row.COD_EMPRESA,
      codColigada: row.CODCOLIGADA,
      codFilial: row.CODFILIAL,
      codBand: row.COD_BAND,
      cnpj: row.CNPJ,
      apelido: row.APELIDO,
    }));
  }
}
