/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from '../../database/database.services';
import { IDadosCobrancaRepository } from '../../domain/repositories/dados-cobranca.repository.interface';
import { Empresa } from '../../domain/entities/empresa.entity';
import { Periodo } from '../../domain/value-objects/periodo.value-object';
import { DemonstrativoDto } from '../../application/dtos/demonstrativo.dto';

@Injectable()
export class DadosCobrancaRepository implements IDadosCobrancaRepository {
  private readonly logger = new Logger(DadosCobrancaRepository.name);

  constructor(private readonly databaseService: DatabaseService) {}

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

  async persistirDeDemonstrativo(
    demonstrativo: DemonstrativoDto,
    empresa: Empresa,
    periodo: Periodo,
  ): Promise<number> {
    this.logger.log('🔵 persistirDeDemonstrativo chamado');
    this.logger.log(
      `🔵 Mensalidades recebidas: ${demonstrativo.mensalidades?.length || 0}`,
    );

    if (
      !demonstrativo.mensalidades ||
      demonstrativo.mensalidades.length === 0
    ) {
      this.logger.warn('⚠️ Nenhuma mensalidade no demonstrativo');
      return 0;
    }

    const periodoRef = periodo.calcularMesReferencia();
    let totalInserido = 0;

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

    try {
      for (const mensalidade of demonstrativo.mensalidades) {
        if (mensalidade.composicoes) {
          for (const comp of mensalidade.composicoes) {
            try {
              const binds = {
                cod_empresa: empresa.codEmpresa,
                codcoligada: empresa.codColigada,
                codfilial: empresa.codFilial,
                cod_band: empresa.codBand,
                contrato: mensalidade.contrato,
                cnpj: mensalidade.cnpj,
                contratante: mensalidade.contratante,
                nomeplano: mensalidade.nomeplano,
                abrangencia: mensalidade.abrangencia,
                codfatura: mensalidade.codfatura,
                valorFatura: mensalidade.valor_fatura,
                periodo: mensalidade.periodo,
                codtitular: comp.codtitular,
                titular: comp.titular,
                cpftitular: comp.cpftitular,
                matricula: comp.matricula,
                acomodacao: comp.acomodacao,
                codbeneficiario: comp.codbeneficiario,
                beneficiario: comp.beneficiario,
                idade: parseInt(comp.idade, 10),
                nascimento: comp.nascimento,
                inclusao: comp.inclusao,
                dependencia: comp.dependencia?.trim() || null,
                cpf: comp.cpf,
                valor: comp.valorcobrado,
                descricao: this.removerAcentos(comp.descricao),
                mes_import: periodo.mesFormatado,
                ano_import: periodo.anoString,
                mes_ref: periodoRef.mesFormatado,
                ano_ref: periodoRef.anoString,
              };

              await this.databaseService.executeQuery(sql, binds);
              totalInserido++;

              this.logger.debug(
                `✅ Beneficiário ${comp.codbeneficiario} inserido (${totalInserido})`,
              );
            } catch (error) {
              this.logger.warn(
                `Erro ao inserir beneficiário ${comp.codbeneficiario}: ${error.message}`,
              );
            }
          }
        }
      }

      this.logger.log(`✅ Total inserido: ${totalInserido} registros`);
      return totalInserido;
    } catch (error) {
      this.logger.error('❌ Erro na persistência:', error.stack);
      throw error;
    }
  }

  async executarResumo(periodo: Periodo): Promise<void> {
    const plsql = `
      BEGIN
        gc.PKG_UNI_SAUDE.p_uni_resumo(:mes_ref, :ano_ref);
      END;
    `;

    const binds = {
      mes_ref: parseInt(periodo.mesFormatado, 10),
      ano_ref: parseInt(periodo.anoString, 10),
    };

    await this.databaseService.executeProcedure(plsql, binds);
  }

  private removerAcentos(texto: string): string {
    return texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  }
}
