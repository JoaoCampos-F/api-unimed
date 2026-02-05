import {
  TipoBandeira,
  TipoBandeiraRow,
} from '../../domain/entities/tipo-bandeira.entity';
import { DatabaseService } from '../../database/database.services';
import { Injectable } from '@nestjs/common';

@Injectable()
export class TipoBandeiraRepository {
  constructor(private readonly database: DatabaseService) {}

  async listarBandeiras(): Promise<TipoBandeira[]> {
    const query = `
      SELECT 
        cod_band,
        descricao,
        az_tipo_com_veic,
        az_processa
      FROM gc.tipo_bandeira
      WHERE az_processa = 'S'
      ORDER BY descricao
    `;

    const result = await this.database.executeQuery<TipoBandeiraRow>(query);

    return result.map(
      (row: TipoBandeiraRow) =>
        new TipoBandeira(
          row.COD_BAND,
          row.DESCRICAO,
          row.AZ_TIPO_COM_VEIC,
          row.AZ_PROCESSA,
        ),
    );
  }
}
