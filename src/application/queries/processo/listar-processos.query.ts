import { Injectable } from '@nestjs/common';
import { DatabaseService } from 'src/database/database.services';

export interface ProcessoListagemDto {
  codigo: string;
  descricao: string;
  categoria: string;
  ordem: number;
  dias: number;
  ativo: boolean;
  tipoDeDado: 'S' | 'C';
}

interface ProcessoRow {
  CODIGO: string;
  DESCRICAO: string;
  CATEGORIA: string;
  ORDEM: number;
  DIAS: number;
  ATIVO: 'S' | 'N';
  TIPO_DE_DADO: 'S' | 'C';
}

@Injectable()
export class ListarProcessosQuery {
  constructor(private readonly databaseService: DatabaseService) {}

  async execute(categoria?: string): Promise<ProcessoListagemDto[]> {
    let sql = `
      SELECT 
        codigo,
        descricao,
        categoria,
        ordem,
        dias,
        ativo,
        tipo_de_dado
      FROM gc.mcw_processo
      WHERE ativo = 'S'
    `;

    const binds: any = {};

    if (categoria) {
      sql += ` AND categoria = :categoria`;
      binds.categoria = categoria;
    }

    sql += ` ORDER BY categoria, ordem`;

    const rows = await this.databaseService.executeQuery<ProcessoRow>(
      sql,
      binds,
    );

    return rows.map((row) => ({
      codigo: row.CODIGO,
      descricao: row.DESCRICAO,
      categoria: row.CATEGORIA,
      ordem: row.ORDEM,
      dias: row.DIAS,
      ativo: row.ATIVO === 'S',
      tipoDeDado: row.TIPO_DE_DADO,
    }));
  }
}
