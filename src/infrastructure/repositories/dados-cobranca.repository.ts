/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../database/database.services';
import { IDadosCobrancaRepository } from '../../domain/repositories/dados-cobranca.repository.interface';
import { Beneficiario } from '../../domain/entities/beneficiario.entity';
import { Empresa } from '../../domain/entities/empresa.entity';
import { Periodo } from '../../domain/value-objects/periodo.value-object';
import { CPF } from '../../domain/value-objects/cpf.value-object';
import { DemonstrativoDto } from '../../application/dtos/demonstrativo.dto';

@Injectable()
export class DadosCobrancaRepository implements IDadosCobrancaRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  async persistirBeneficiarios(
    beneficiarios: Beneficiario[],
    empresa: Empresa,
    periodo: Periodo,
  ): Promise<number> {
    if (beneficiarios.length === 0) {
      console.log('⚠️ Nenhum beneficiário para persistir');
      return 0;
    }

    console.log(
      `🔵 Iniciando persistência de ${beneficiarios.length} beneficiários`,
    );
    const periodoRef = periodo.calcularMesReferencia();

    // Construir o INSERT ALL para batch insert
    let sql = 'INSERT ALL\n';

    beneficiarios.forEach((beneficiario, index) => {
      sql += `
        INTO gc.UNI_DADOS_COBRANCA (
          cod_empresa, codcoligada, codfilial, cod_band,
          codbeneficiario, beneficiario, cpf, idade, nascimento, inclusao,
          dependencia, valor, descricao,
          mes_import, ano_import, mes_ref, ano_ref, data_import
        ) VALUES (
          :cod_empresa${index}, :codcoligada${index}, :codfilial${index}, :cod_band${index},
          :codbeneficiario${index}, :beneficiario${index}, :cpf${index}, :idade${index}, 
          :nascimento${index}, :inclusao${index},
          :dependencia${index}, :valor${index}, :descricao${index},
          :mes_import${index}, :ano_import${index}, :mes_ref${index}, :ano_ref${index}, SYSDATE
        )
      `;
    });

    sql += '\nSELECT 1 FROM DUAL';

    // Construir binds - usando Record para tipagem correta
    const binds: Record<string, any> = {};

    beneficiarios.forEach((beneficiario, index) => {
      binds[`cod_empresa${index}`] = empresa.codEmpresa;
      binds[`codcoligada${index}`] = empresa.codColigada;
      binds[`codfilial${index}`] = empresa.codFilial;
      binds[`cod_band${index}`] = empresa.codBand;
      binds[`codbeneficiario${index}`] = beneficiario.codBeneficiario;
      binds[`beneficiario${index}`] = beneficiario.nome;
      binds[`cpf${index}`] = beneficiario.cpf.value;
      binds[`idade${index}`] = beneficiario.idade;
      binds[`nascimento${index}`] = beneficiario.nascimento;
      binds[`inclusao${index}`] = beneficiario.inclusao;
      binds[`dependencia${index}`] = beneficiario.dependencia || null;
      binds[`valor${index}`] = beneficiario.valorCobrado;
      binds[`descricao${index}`] = beneficiario.descricao;
      binds[`mes_import${index}`] = periodo.mesFormatado;
      binds[`ano_import${index}`] = periodo.anoString;
      binds[`mes_ref${index}`] = periodoRef.mesFormatado;
      binds[`ano_ref${index}`] = periodoRef.anoString;
    });

    console.log('🔵 SQL gerado:', sql.substring(0, 500) + '...');
    console.log('🔵 Total de binds:', Object.keys(binds).length);
    console.log('🔵 Primeiro beneficiário:', {
      codbeneficiario: binds['codbeneficiario0'],
      nome: binds['beneficiario0'],
      cpf: binds['cpf0'],
    });

    try {
      const result = await this.databaseService.executeQuery(sql, binds);
      console.log('✅ INSERT executado com sucesso, result:', result);
      return beneficiarios.length;
    } catch (error) {
      console.error('❌ Erro ao executar INSERT:', error.message);
      console.error('SQL:', sql);
      throw error;
    }
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

  async persistirDeDemonstrativo(
    demonstrativo: DemonstrativoDto,
    empresa: Empresa,
    periodo: Periodo,
  ): Promise<number> {
    console.log('🔵 persistirDeDemonstrativo chamado');
    console.log(
      '🔵 Mensalidades recebidas:',
      demonstrativo.mensalidades?.length || 0,
    );

    if (
      !demonstrativo.mensalidades ||
      demonstrativo.mensalidades.length === 0
    ) {
      console.log('⚠️ Nenhuma mensalidade no demonstrativo');
      return 0;
    }

    const beneficiarios: Beneficiario[] = [];

    for (const mensalidade of demonstrativo.mensalidades) {
      if (mensalidade.composicoes) {
        for (const comp of mensalidade.composicoes) {
          try {
            const beneficiario = new Beneficiario(
              comp.codbeneficiario,
              comp.beneficiario,
              new CPF(comp.cpf),
              parseInt(comp.idade, 10),
              comp.nascimento,
              comp.inclusao,
              comp.dependencia,
              comp.valorcobrado,
              this.removerAcentos(comp.descricao),
            );
            beneficiarios.push(beneficiario);
          } catch (error) {
            // Log e continua processamento
            console.warn(
              `Erro ao criar beneficiário ${comp.codbeneficiario}: ${error.message}`,
            );
          }
        }
      }
    }

    console.log(`🔵 Total de beneficiários criados: ${beneficiarios.length}`);
    return this.persistirBeneficiarios(beneficiarios, empresa, periodo);
  }

  async executarResumo(periodo: Periodo): Promise<void> {
    const periodoRef = periodo.calcularMesReferencia();
    const plsql = `
      BEGIN
        gc.PKG_UNI_SAUDE.p_uni_resumo(:mes_ref, :ano_ref);
      END;
    `;

    const binds = {
      mes_ref: parseInt(periodoRef.mesFormatado, 10),
      ano_ref: parseInt(periodoRef.anoString, 10),
    };

    await this.databaseService.executeProcedure(plsql, binds);
  }

  private removerAcentos(texto: string): string {
    return texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  }
}
