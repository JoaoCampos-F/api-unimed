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
        tipo_com_veic,
        processa
      FROM gc.tipo_bandeira
      WHERE processa = 'S'
      ORDER BY descricao
    `;

    const result = await this.database.executeQuery<TipoBandeiraRow>(query);

    return result.map(
      (row) =>
        new TipoBandeira(
          row.COD_BAND,
          row.DESCRICAO,
          row.TIPO_COM_VEIC,
          row.PROCESSA,
        ),
    );
  }
}
