import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from 'src/database/database.services';
import { UnimedApiService } from './unimed-api.service';
// import { ImportUnimedDto } from '../dtos/import-unimed.dto';

@Injectable()
export class UnimedImportService {
  private readonly logger = new Logger(UnimedImportService.name);

  constructor(
    private databaseService: DatabaseService,
    private unimedApiService: UnimedApiService,
  ) {}

  //   async importarPorCnpj(dto: ImportUnimedDto) {
  //     const periodo = `${dto.mes.padStart(2, '0')}${dto.ano}`;
  //   }

  async buscaEmpresasUnimed(): Promise<any[]> {
    const sql = `
      SELECT 
        a.cod_empresa,
        a.codcoligada,
        a.codfilial,
        a.cod_band,
        a.cnpj
      FROM gc.empresa_filial a
      WHERE a.processa_unimed = 'S'
      ORDER BY a.cod_band, a.cod_empresa
    `;

    return this.databaseService.executeQuery(sql);
  }
}
