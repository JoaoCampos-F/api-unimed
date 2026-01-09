import { Injectable } from '@nestjs/common';
import { DatabaseService } from 'src/database/database.services';
import { EmpresaFilialListDto } from 'src/modules/unimed/dtos/empresa-filial-list.dto';

@Injectable()
export class BuscaEmpresasUnimedService {
  constructor(private readonly databaseService: DatabaseService) {}

  async execute(): Promise<EmpresaFilialListDto[]> {
    const sql = `
      SELECT 
        ef.cod_empresa,
        ef.codcoligada,
        ef.codfilial,
        ef.cod_band,
        ef.cnpj
      FROM gc.empresa_filial ef
      WHERE ef.processa_unimed = 'S'
      AND ef.cnpj ='28941028000142' 
      ORDER BY ef.cod_band, ef.cod_empresa
    `;

    return this.databaseService.executeQuery(sql);
  }
}
