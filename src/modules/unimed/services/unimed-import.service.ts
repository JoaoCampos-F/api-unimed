import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from 'src/database/database.services';
import { UnimedApiService } from './unimed-api.service';
import { EmpresaFilialListDto } from '../dtos/empresa-filial-list.dto';
import { ImportUnimedDto } from '../dtos/import-unimed.dto';
import { DemonstrativoDto } from '../entities/demonstrativo.dto';

@Injectable()
export class UnimedImportService {
  private readonly logger = new Logger(UnimedImportService.name);

  constructor(
    private databaseService: DatabaseService,
    private unimedApiService: UnimedApiService,
  ) {}

  async importarPorCnpj(dto: ImportUnimedDto) {
    if (!dto.mes || !dto.ano) {
      throw new Error('Mês e Ano são obrigatórios para a importação.');
    }

    const periodo = `${dto.mes.padStart(2, '0')}${dto.ano}`;

    const empresas = await this.buscaEmpresasUnimed();

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

        const qtdInserida = await this.inserirDadosCobranca(
          dadosUnimed,
          empresa,
          dto.mes,
          dto.ano,
        );

        totalImportado += qtdInserida;

        this.logger.log(
          `✅ Empresa ${empresa.COD_EMPRESA} - ${qtdInserida} registros importados`,
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

  async buscaEmpresasUnimed(): Promise<EmpresaFilialListDto[]> {
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

  private async inserirDadosCobranca(
    dadosUnimed: DemonstrativoDto,
    empresa: EmpresaFilialListDto,
    mes: string,
    ano: string,
  ): Promise<number> {
    if (!dadosUnimed.mensalidades || dadosUnimed.mensalidades.length === 0) {
      return 0;
    }

    const sql = `
      INSERT INTO gc.UNI_DADOS_COBRANCA (
        cod_empresa, codcoligada, codfilial, cod_band,
        contrato, cnpj, contratante, nomeplano, abrangencia,
        codfatura, valorFatura, periodo,
        codtitular, titular, cpftitular, matricula, acomodacao,
        codbeneficiario, beneficiario, idade, nascimento, inclusao,
        dependencia, cpf, valor, descricao,
        mes_import, ano_import, mes_ref, ano_ref, data_import
      ) VALUES (
        :cod_empresa, :codcoligada, :codfilial, :cod_band,
        :contrato, :cnpj, :contratante, :nomeplano, :abrangencia,
        :codfatura, :valorFatura, :periodo,
        :codtitular, :titular, :cpftitular, :matricula, :acomodacao,
        :codbeneficiario, :beneficiario, :idade, :nascimento, :inclusao,
        :dependencia, :cpf, :valor, :descricao,
        :mes_import, :ano_import, :mes_ref, :ano_ref, SYSDATE
      )
    `;

    const binds: Array<any> = [];
    let count = 0;

    for (const mensalidade of dadosUnimed.mensalidades) {
      if (mensalidade.composicoes) {
        for (const beneficiario of mensalidade.composicoes) {
          binds.push({
            cod_empresa: empresa.COD_EMPRESA,
            codcoligada: empresa.CODCOLIGADA,
            codfilial: empresa.CODFILIAL,
            cod_band: empresa.COD_BAND,
            contrato: mensalidade.contrato,
            cnpj: empresa.CNPJ,
            contratante: mensalidade.contratante,
            nomeplano: mensalidade.nomeplano,
            abrangencia: mensalidade.abrangencia,
            codfatura: mensalidade.codfatura,
            valorFatura: mensalidade.valor_fatura,
            periodo: mensalidade.periodo,
            codtitular: beneficiario.codtitular,
            titular: beneficiario.titular,
            cpftitular: beneficiario.cpftitular,
            matricula: beneficiario.matricula,
            acomodacao: beneficiario.acomodacao,
            codbeneficiario: beneficiario.codbeneficiario,
            beneficiario: beneficiario.beneficiario,
            idade: beneficiario.idade,
            nascimento: beneficiario.nascimento,
            inclusao: beneficiario.inclusao,
            dependencia: beneficiario.dependencia?.trim(),
            cpf: beneficiario.cpf,
            valor: beneficiario.valorcobrado,
            descricao: this.removerAcentos(beneficiario.descricao),
            mes_import: mes.padStart(2, '0'),
            ano_import: ano,
            mes_ref: this.calcularMesRef(mensalidade.periodo),
            ano_ref: this.calcularAnoRef(mensalidade.periodo),
          });
          count++;
        }
      }
    }

    if (binds.length > 0) {
      await this.databaseService.executeMany(sql, binds);
    }

    return count;
  }

  private calcularMesRef(periodo: string): string {
    const [mes] = periodo.split('-');
    const mesNum = parseInt(mes, 10) - 1;
    return mesNum === 0 ? '12' : mesNum.toString().padStart(2, '0');
  }

  private calcularAnoRef(periodo: string): string {
    const [mes, ano] = periodo.split('-');
    const mesNum = parseInt(mes, 10);
    return mesNum === 1 ? (parseInt(ano) - 1).toString() : ano;
  }

  private removerAcentos(str: string): string {
    const acentos = {
      À: 'A',
      Á: 'A',
      Â: 'A',
      Ã: 'A',
      Ä: 'A',
      Å: 'A',
      à: 'a',
      á: 'a',
      â: 'a',
      ã: 'a',
      ä: 'a',
      å: 'a',
      È: 'E',
      É: 'E',
      Ê: 'E',
      Ë: 'E',
      è: 'e',
      é: 'e',
      ê: 'e',
      ë: 'e',
      Ì: 'I',
      Í: 'I',
      Î: 'I',
      Ï: 'I',
      ì: 'i',
      í: 'i',
      î: 'i',
      ï: 'i',
      Ò: 'O',
      Ó: 'O',
      Ô: 'O',
      Õ: 'O',
      Ö: 'O',
      ò: 'o',
      ó: 'o',
      ô: 'o',
      õ: 'o',
      ö: 'o',
      Ù: 'U',
      Ú: 'U',
      Û: 'U',
      Ü: 'U',
      ù: 'u',
      ú: 'u',
      û: 'u',
      ü: 'u',
      Ç: 'C',
      ç: 'c',
      Ñ: 'N',
      ñ: 'n',
    };

    return str
      .replace(
        /[À-ÿ]/g,
        (match) => acentos[match as keyof typeof acentos] || match,
      )
      .toUpperCase();
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
