import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from 'src/database/database.services';
import { DemonstrativoDto } from '../dtos/demonstrativo.dto';
import { UnimedApiService } from 'src/modules/unimed/services/unimed-api.service';
import { ImportUnimedDto } from '../dtos/import-unimed.dto';
import { EmpresaFilialListDto } from 'src/modules/unimed/dtos/empresa-filial-list.dto';
import { BuscaEmpresasUnimedService } from './busca-empresas-unimed.service';
import { removerAcentos } from '../utils/remove-acentos';

@Injectable()
export class UnimedImportService {
  private readonly logger = new Logger(UnimedImportService.name);

  constructor(
    private databaseService: DatabaseService,
    private unimedApiService: UnimedApiService,
    private buscaEmpresasUnimedService: BuscaEmpresasUnimedService,
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

        const qtdInserida = await this.inserirDadosCobranca(
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
            descricao: removerAcentos(beneficiario.descricao),
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
