import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from 'src/database/database.services';
import { UnimedApiService } from 'src/modules/unimed/services/unimed-api.service';
import { ImportUnimedDto } from '../dtos/import-unimed.dto';
import { BuscaEmpresasUnimedService } from './busca-empresas-unimed.service';
import { PersisteDadosCobrancaService } from './persiste-dados-cobranca.service';

@Injectable()
export class UnimedImportService {
  private readonly logger = new Logger(UnimedImportService.name);

  constructor(
    private databaseService: DatabaseService,
    private unimedApiService: UnimedApiService,
    private buscaEmpresasUnimedService: BuscaEmpresasUnimedService,
    private persisteDadosCobrancaService: PersisteDadosCobrancaService,
  ) {}

  async importarPorCnpj(dto: ImportUnimedDto) {
    if (!dto.mes || !dto.ano) {
      throw new Error('Mês e Ano são obrigatórios para a importação.');
    }

    const periodo = `${dto.mes.padStart(2, '0')}${dto.ano}`;

    const empresas = await this.buscaEmpresasUnimedService.execute();

    if (empresas.length == 0) {
      this.logger.warn('Nenhuma empresa encontrada para importação.');
    }

    let totalImportado = 0;

    for (const empresa of empresas) {
      try {
        const dadosUnimed = await this.unimedApiService.buscarPorPeriodoCnpj(
          periodo,
          empresa.CNPJ,
        );

        await this.limparDadosImportacao(
          empresa.COD_EMPRESA,
          empresa.CODCOLIGADA,
          empresa.CODFILIAL,
          dto.mes,
          dto.ano,
        );

        const qtdInserida = await this.persisteDadosCobrancaService.execute(
          dadosUnimed,
          empresa,
          dto.mes,
          dto.ano,
        );

        totalImportado += qtdInserida;

        this.logger.log(
          `Empresa ${empresa.COD_EMPRESA} - ${qtdInserida} registros importados`,
        );

        this.logger.log(
          `Total de registros importados até agora: ${totalImportado}`,
        );
      } catch (error) {
        this.logger.error(
          `Erro ao processar empresa ${empresa.COD_EMPRESA}: ${error.message}`,
        );
      }
    }
  }

  async importPorContrato(dto: ImportUnimedDto) {
    if (!dto.mes || !dto.ano) {
      throw new Error('Mês e Ano são obrigatórios para a importação.');
    }

    const sql = `select 
          a.cod_empresa,
          a.codcoligada,
          a.codfilial,              
          a.cod_band,
          a.cnpj,
          a.contrato
          from 
          gc.uni_dados_contrato a
          where 
          1=1  
          and a.ativo='S'       
          order by 
          a.cod_band,
          a.cod_empresa`;
    return this.databaseService.executeQuery(sql);
  }

  private async limparDadosImportacao(
    codEmpresa: number,
    codColigada: number,
    codFilial: number,
    mes: string,
    ano: string,
  ): Promise<void> {
    const sql = `
      DELETE FROM gc.uni_dados_cobranca
      WHERE cod_empresa = :codEmpresa
        AND codcoligada = :codColigada
        AND codfilial = :codFilial
        AND mes_import = :mes
        AND ano_import = :ano
    `;

    const binds = {
      codEmpresa,
      codColigada,
      codFilial,
      mes: mes.padStart(2, '0'),
      ano,
    };

    await this.databaseService.executeQuery(sql, binds);
  }

  async executarResumo(
    dto: ImportUnimedDto,
  ): Promise<{ result: boolean; msg: string }> {
    try {
      const plsql = `
        BEGIN
          gc.PKG_UNI_SAUDE.p_uni_resumo(:mes_ref, :ano_ref);
        END;
      `;

      const binds = {
        mes_ref: parseInt(dto.mes, 10),
        ano_ref: parseInt(dto.ano, 10),
      };

      await this.databaseService.executeProcedure(plsql, binds);

      return {
        result: true,
        msg: 'Resumo de dados executado com sucesso!',
      };
    } catch (error) {
      this.logger.error(`Erro ao executar resumo: ${error.message}`);
      return {
        result: false,
        msg: `Erro ao executar resumo: ${error.message}`,
      };
    }
  }
}
