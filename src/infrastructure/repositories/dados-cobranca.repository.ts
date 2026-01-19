import { Injectable } from '@nestjs/common';
import { IDadosCobrancaRepository } from '../../domain/repositories/dados-cobranca.repository.interface';
import { Beneficiario } from '../../domain/entities/beneficiario.entity';
import { Empresa } from '../../domain/entities/empresa.entity';
import { Periodo } from '../../domain/value-objects/periodo.value-object';
import { DatabaseService } from '../../database/database.services';

@Injectable()
export class DadosCobrancaRepository implements IDadosCobrancaRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  async persistirBeneficiarios(
    beneficiarios: Beneficiario[],
    empresa: Empresa,
    periodo: Periodo,
  ): Promise<number> {
    if (beneficiarios.length === 0) return 0;

    const sql = `
      INSERT INTO gc.UNI_DADOS_COBRANCA (
        cod_empresa, codcoligada, codfilial, cod_band,
        codbeneficiario, beneficiario, idade, nascimento, inclusao,
        dependencia, cpf, valor, descricao,
        mes_import, ano_import, mes_ref, ano_ref, data_import
      ) VALUES (
        :cod_empresa, :codcoligada, :codfilial, :cod_band,
        :codbeneficiario, :beneficiario, :idade, :nascimento, :inclusao,
        :dependencia, :cpf, :valor, :descricao,
        :mes_import, :ano_import, :mes_ref, :ano_ref, SYSDATE
      )
    `;

    const periodoRef = periodo.calcularMesReferencia();
    const binds = beneficiarios.map((beneficiario) => [
      empresa.codEmpresa,
      empresa.codColigada,
      empresa.codFilial,
      empresa.codBand,
      beneficiario.codBeneficiario,
      beneficiario.nome,
      beneficiario.idade,
      beneficiario.nascimento,
      beneficiario.inclusao,
      beneficiario.dependencia?.trim() || null,
      beneficiario.cpf.value,
      beneficiario.valorCobrado,
      beneficiario.descricaoSemAcentos,
      periodo.mesFormatado,
      periodo.anoString,
      periodoRef.mesFormatado,
      periodoRef.anoString,
    ]);

    await this.databaseService.executeMany(sql, binds);
    return beneficiarios.length;
  }

  async limparDadosImportacao(
    empresa: Empresa,
    periodo: Periodo,
  ): Promise<number> {
    const sql = `
      DELETE FROM gc.uni_dados_cobranca
      WHERE cod_empresa = :codEmpresa
        AND codcoligada = :codColigada
        AND codfilial = :codFilial
        AND mes_import = :mes
        AND ano_import = :ano
    `;

    const binds = {
      codEmpresa: empresa.codEmpresa,
      codColigada: empresa.codColigada,
      codFilial: empresa.codFilial,
      mes: periodo.mesFormatado,
      ano: periodo.anoString,
    };

    return await this.databaseService.executeDelete(sql, binds);
  }
}
