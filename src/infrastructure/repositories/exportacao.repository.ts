import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from 'src/database/database.services';
import {
  IExportacaoRepository,
  ConfigProcesso,
  ProcessoLog,
  ExportacaoParams,
} from 'src/domain/repositories/exportacao.repository.interface';

@Injectable()
export class ExportacaoRepository implements IExportacaoRepository {
  private readonly logger = new Logger(ExportacaoRepository.name);

  constructor(private readonly databaseService: DatabaseService) {}

  async buscarDataFinalPeriodo(
    mesRef: number,
    anoRef: number,
  ): Promise<Date | null> {
    const query = `
      SELECT TO_CHAR(data_final, 'YYYY-MM-DD') AS data_final
      FROM gc.mcw_periodo
      WHERE mes_ref = :mesRef
        AND ano_ref = :anoRef
    `;

    const result = await this.databaseService.executeQuery<{
      DATA_FINAL: string;
    }>(query, { mesRef, anoRef });

    if (!result || result.length === 0) {
      return null;
    }

    return new Date(result[0].DATA_FINAL);
  }

  async buscarConfigProcesso(
    codigoProcesso: string,
  ): Promise<ConfigProcesso | null> {
    const query = `
      SELECT dias, descricao
      FROM gc.mcw_processo
      WHERE codigo = :codigoProcesso
        AND ativo = 'S'
    `;

    const result = await this.databaseService.executeQuery<{
      DIAS: number;
      DESCRICAO: string;
    }>(query, { codigoProcesso });

    if (!result || result.length === 0) {
      return null;
    }

    return {
      dias: result[0].DIAS,
      descricao: result[0].DESCRICAO,
    };
  }

  async executarExportacao(params: ExportacaoParams): Promise<void> {
    const {
      codigo,
      mesRef,
      anoRef,
      previa,
      apagar,
      usuario,
      todas,
      codEmpresa,
      bandeira,
      tipo,
      categoria,
      cpf,
    } = params;

    const flagPrevia = previa ? 'S' : 'N';
    const flagApagar = apagar ? 'S' : 'N';
    const localCpf = cpf || '';

    const query = `
      BEGIN 
        GC.PGK_GLOBAL.P_MCW_FECHA_COMISSAO_GLOBAL(
          P_CODIGO      => :codigo,
          P_MES_REF     => :mesRef,
          P_ANO_REF     => :anoRef,
          P_PREVIA      => :previa,
          P_APAGA       => :apagar,
          P_USUARIO     => :usuario,
          P_TODAS       => :todas,
          P_COD_EMPRESA => :codEmpresa,
          P_COD_BAND    => :codBand,
          P_TIPO        => :tipo,
          P_CATEGORIA   => :categoria,
          P_CPF         => :cpf
        ); 
      END;
    `;

    this.logger.debug('Executando procedure P_MCW_FECHA_COMISSAO_GLOBAL', {
      codigo,
      mesRef,
      anoRef,
      previa: flagPrevia,
      apagar: flagApagar,
      usuario,
      todas,
      codEmpresa, // Se for 'Todas', isso deve ser 0 (definido no UseCase)
      codBand: bandeira,
      tipo,
      categoria,
      cpf: localCpf,
    });

    try {
      await this.databaseService.executeQuery(query, {
        codigo,
        mesRef,
        anoRef,
        previa: flagPrevia,
        apagar: flagApagar,
        usuario,
        todas,
        codEmpresa,
        codBand: bandeira,
        tipo,
        categoria,
        cpf: localCpf,
      });

      this.logger.log(`Procedure executada com sucesso - Código: ${codigo}`);
    } catch (error) {
      this.logger.error(`Erro ao executar procedure ${codigo}:`, error);
      throw error;
    }
  }

  async simularExportacao(params: ExportacaoParams): Promise<{
    colaboradoresAfetados: number;
    valorTotal: number;
    preview: any[];
  }> {
    const { codigo, mesRef, anoRef, codEmpresa, cpf } = params;

    this.logger.log(
      `🔍 SIMULAÇÃO - Buscando dados para preview (código: ${codigo}, empresa: ${codEmpresa}, período: ${mesRef}/${anoRef})`,
    );

    let query = `
      SELECT 
        a.codigo_cpf,
        a.colaborador,
        a.chapa,
        a.cod_empresa,
        a.apelido as sigla_empresa,
        a.mes_ref,
        a.ano_ref,
        a.valor_liquido,
        a.exporta,
        a.export_totvs,
        a.ativo
      FROM gc.vw_uni_resumo_colaborador a
      WHERE a.cod_empresa = :codEmpresa
        AND a.mes_ref = :mesRef
        AND a.ano_ref = :anoRef
        AND a.exporta = 'S'
        AND a.export_totvs = 'S'
        AND a.valor_liquido > 0
    `;

    const binds: any = {
      codEmpresa,
      mesRef,
      anoRef,
    };

    if (cpf) {
      query += ' AND a.codigo_cpf = :cpf';
      binds.cpf = cpf;
    }

    query += ' ORDER BY a.colaborador';

    const result = await this.databaseService.executeQuery<any>(query, binds);

    const colaboradoresAfetados = result.length;
    const valorTotal = result.reduce(
      (sum, row) => sum + (Number(row.VALOR_LIQUIDO) || 0),
      0,
    );

    const preview = result.map((row) => ({
      cpf: row.CODIGO_CPF,
      nome: row.COLABORADOR,
      chapa: row.CHAPA,
      empresa: row.SIGLA_EMPRESA,
      valorLiquido: Number(row.VALOR_LIQUIDO),
      mesRef: row.MES_REF,
      anoRef: row.ANO_REF,
    }));

    this.logger.log(
      `📊 Preview gerado: ${colaboradoresAfetados} colaborador(es), Total: R$ ${valorTotal.toFixed(2)}`,
    );

    return {
      colaboradoresAfetados,
      valorTotal,
      preview,
    };
  }

  async buscarLogsExportacao(params: {
    categoria: string;
    mesRef?: number;
    anoRef?: number;
    codigo?: string;
  }): Promise<ProcessoLog[]> {
    let query = `
      SELECT 
        a.codigo, 
        a.descricao, 
        a.categoria,
        b.usuario,
        b.data_proc,
        b.mes_ref,
        b.ano_ref,
        b.apaga,
        b.previa,
        ROUND((b.hora2 + 0.0001) - b.hora1, 4) AS hora_inicio,
        ROUND(b.hora2 - b.hora1, 4) AS hora_final
      FROM nbs.mcw_processo a
      LEFT OUTER JOIN mcw_processo_log b ON (a.codigo = b.codigo)
      WHERE a.categoria = :categoria
    `;

    const binds: any = { categoria: params.categoria };

    if (params.mesRef) {
      query += ' AND b.mes_ref = :mesRef';
      binds.mesRef = params.mesRef;
    }

    if (params.anoRef) {
      query += ' AND b.ano_ref = :anoRef';
      binds.anoRef = params.anoRef;
    }

    if (params.codigo) {
      query += ' AND a.codigo = :codigo';
      binds.codigo = params.codigo;
    }

    query += ' ORDER BY a.ordem, b.data_proc DESC';

    const rows = await this.databaseService.executeQuery<any>(query, binds);

    return rows.map((row) => ({
      codigo: row.CODIGO,
      descricao: row.DESCRICAO,
      categoria: row.CATEGORIA,
      usuario: row.USUARIO,
      dataProcessamento: row.DATA_PROC,
      mesRef: row.MES_REF,
      anoRef: row.ANO_REF,
      apaga: row.APAGA === 'S',
      previa: row.PREVIA === 'S',
      horaInicio: row.HORA_INICIO,
      horaFinal: row.HORA_FINAL,
    }));
  }
}
