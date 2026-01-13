import { EmpresaFilialListDto } from 'src/modules/unimed/dtos/empresa-filial-list.dto';
import { DemonstrativoDto } from '../dtos/demonstrativo.dto';
import { DatabaseService } from 'src/database/database.services';
import { removerAcentos } from '../utils/remove-acentos';
import { Injectable } from '@nestjs/common';

@Injectable()
export class PersisteDadosCobrancaService {
  constructor(private databaseService: DatabaseService) {}

  async execute(
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
}
