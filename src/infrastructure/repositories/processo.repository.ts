import { Injectable } from '@nestjs/common';
import { DatabaseService } from 'src/database/database.services';
import { Processo } from 'src/domain/entities/processo.entity';
import { ProcessoLog } from 'src/domain/entities/processo-log';
import { IProcessoRepository } from 'src/domain/repositories/processo.repository.interface';

interface ProcessoRow {
  CODIGO: string;
  DESCRICAO: string;
  CATEGORIA: string;
  ORDEM: number;
  DIAS: number;
  ATIVO: 'S' | 'N';
  TIPO_DE_DADO: 'S' | 'C';
}

interface ProcessoLogRow {
  ID: number;
  CODIGO: string;
  DESCRICAO: string;
  CATEGORIA: string;
  MES_REF: number;
  ANO_REF: number;
  USUARIO: string;
  DATA_PROC: string;
  APAGA: 'S' | 'N';
  PREVIA: 'S' | 'N';
  DURACAO: number;
  ERRO: string | null;
}

interface ExecutarProcessoParams {
  processo: string;
  mesRef: number;
  anoRef: number;
  previa: 'S' | 'N';
  apaga: 'S' | 'N';
  usuario: string;
  todasEmpresas: 'S' | 'N';
  codEmpresa?: number;
  codColigada?: number;
  codFilial?: number;
  codBand?: number;
  tipoComissao: 'S' | 'C';
  cpf?: string;
}

interface BuscarHistoricoParams {
  categoria: string;
  mesRef?: number;
  anoRef?: number;
  codigo?: string;
}

type bindParmas = {
  categoria: string;
  mesRef?: number;
  anoRef?: number;
  codigo?: string;
};
@Injectable()
export class ProcessoRepository implements IProcessoRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  async listarProcessos(categoria?: string): Promise<ProcessoRow[]> {
    let query = `
      SELECT 
        codigo,
        descricao,
        categoria,
        ordem,
        dias,
        ativo,
        tipo_de_dado
      FROM gc.mcw_processo
      WHERE ativo = 'S'
    `;

    const binds: any = {};

    if (categoria) {
      query += ` AND categoria = :categoria`;
      binds.categoria = categoria;
    }

    query += ` ORDER BY categoria, ordem`;

    return await this.databaseService.executeQuery<ProcessoRow>(query, binds);
  }

  async listarProcessosDisponiveis(params: {
    categoria: string;
    tipoDeDado: 'S' | 'C';
  }): Promise<Processo[]> {
    const query = `
      SELECT 
        codigo,
        descricao,
        categoria,
        ordem,
        dias,
        ativo,
        tipo_de_dado
      FROM gc.mcw_processo
      WHERE ativo = 'S'
        AND categoria = :categoria
        AND tipo_de_dado = :tipoDeDado
      ORDER BY ordem
    `;

    const rows = await this.databaseService.executeQuery<ProcessoRow>(query, {
      categoria: params.categoria,
      tipoDeDado: params.tipoDeDado,
    });

    return rows.map(
      (row) =>
        new Processo(
          row.CODIGO,
          row.CATEGORIA,
          '', // procedure - não disponível nesta query
          row.DESCRICAO,
          row.ORDEM,
          row.DIAS,
          '', // usuario - não disponível nesta query
          '', // tipoEmpresa - não disponível nesta query
          row.TIPO_DE_DADO,
          row.ATIVO,
          null, // dataUltimaExecucao - não disponível nesta query
        ),
    );
  }

  async executarProcesso(params: ExecutarProcessoParams): Promise<void> {
    const plsql = `
      BEGIN
        GC.PGK_GLOBAL.P_MCW_FECHA_COMISSAO_GLOBAL(
          :p_processo,
          :p_mes,
          :p_ano,
          :p_previa,
          :p_apaga,
          :p_usuario,
          :p_todas_empresas,
          :p_cod_empresa,
          :p_cod_band,
          :p_tipo_comissao,
          :p_cpf
        );
      END;
    `;

    const binds = {
      p_processo: params.processo,
      p_mes: params.mesRef,
      p_ano: params.anoRef,
      p_previa: params.previa,
      p_apaga: params.apaga,
      p_usuario: params.usuario,
      p_todas_empresas: params.todasEmpresas,
      p_cod_empresa: params.codEmpresa?.toString() || 'T',
      p_cod_band: params.codBand?.toString() || 'T',
      p_tipo_comissao: params.tipoComissao,
      p_cpf: params.cpf || '',
    };

    await this.databaseService.executeProcedure(plsql, binds);
  }

  async buscarHistorico(params: BuscarHistoricoParams): Promise<ProcessoLog[]> {
    let query = `
      SELECT *
      FROM gc.vw_mcw_processo_log
      WHERE categoria = :categoria
    `;

    const binds: bindParmas = { categoria: params.categoria };

    if (params.mesRef) {
      query += ` AND mes_ref = :mesRef`;
      binds.mesRef = params.mesRef;
    }

    if (params.anoRef) {
      query += ` AND ano_ref = :anoRef`;
      binds.anoRef = params.anoRef;
    }

    if (params.codigo) {
      query += ` AND codigo = :codigo`;
      binds.codigo = params.codigo;
    }

    query += ` ORDER BY data_proc DESC`;

    const rows = await this.databaseService.executeQuery<ProcessoLogRow>(
      query,
      binds,
    );

    return rows.map(
      (row) =>
        new ProcessoLog(
          row.ID,
          row.CODIGO,
          row.DESCRICAO,
          row.CATEGORIA,
          row.MES_REF,
          row.ANO_REF,
          row.USUARIO,
          new Date(row.DATA_PROC),
          row.APAGA,
          row.PREVIA,
          row.DURACAO,
          row.ERRO,
        ),
    );
  }

  async validarPrazoExecucao(params: {
    mesRef: number;
    anoRef: number;
    processo: string;
  }): Promise<{
    dentroDoPrazo: boolean;
    dataMaxima: Date;
    diasRestantes: number;
  }> {
    // Busca data final do período
    const queryPeriodo = `
      SELECT TO_CHAR(data_final, 'YYYY-MM-DD') as data_final
      FROM gc.mcw_periodo_fechamento
      WHERE mes_ref = :mes
        AND ano_ref = :ano
    `;

    const [periodo] = await this.databaseService.executeQuery<{
      DATA_FINAL: string;
    }>(queryPeriodo, {
      mes: params.mesRef,
      ano: params.anoRef,
    });

    if (!periodo) {
      throw new Error('Período não encontrado');
    }

    // Busca dias limite do processo
    const queryProcesso = `
      SELECT dias
      FROM gc.mcw_processo
      WHERE codigo = :codigo
    `;

    const [processo] = await this.databaseService.executeQuery<{
      DIAS: number;
    }>(queryProcesso, {
      codigo: params.processo,
    });

    if (!processo) {
      throw new Error('Processo não encontrado');
    }

    // Calcula data máxima
    const dataFinal = new Date(periodo.DATA_FINAL);
    const dataMaxima = new Date(dataFinal);
    dataMaxima.setDate(dataMaxima.getDate() + processo.DIAS);

    const hoje = new Date();
    const dentroDoPrazo = hoje <= dataMaxima;
    const diasRestantes = Math.floor(
      (dataMaxima.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24),
    );

    return {
      dentroDoPrazo,
      dataMaxima,
      diasRestantes,
    };
  }

  async buscarPorCodigo(codigo: string): Promise<Processo | null> {
    const query = `
      SELECT 
        codigo,
        categoria,
        procedure_name as procedure,
        descricao,
        ordem,
        dias,
        usuario,
        tipo_empresa,
        tipo_de_dado,
        ativo
      FROM gc.mcw_processo
      WHERE codigo = :codigo
    `;

    const rows = await this.databaseService.executeQuery<{
      CODIGO: string;
      CATEGORIA: string;
      PROCEDURE: string;
      DESCRICAO: string;
      ORDEM: number;
      DIAS: number;
      USUARIO: string;
      TIPO_EMPRESA: string;
      TIPO_DE_DADO: string;
      ATIVO: string;
    }>(query, { codigo });

    if (rows.length === 0) {
      return null;
    }

    const row = rows[0];
    return new Processo(
      row.CODIGO,
      row.CATEGORIA,
      row.PROCEDURE,
      row.DESCRICAO,
      row.ORDEM,
      row.DIAS,
      row.USUARIO,
      row.TIPO_EMPRESA,
      row.TIPO_DE_DADO,
      row.ATIVO,
      null,
    );
  }

  async buscarProcessosDisponiveis(params: {
    categoria: string;
    tipoDado: string;
    mesRef: number;
    anoRef: number;
  }): Promise<Processo[]> {
    const query = `
      SELECT 
        p.codigo,
        p.categoria,
        p.procedure_name as procedure,
        p.descricao,
        p.ordem,
        p.dias,
        p.usuario,
        p.tipo_empresa,
        p.tipo_de_dado,
        p.ativo,
        (
          SELECT MAX(pl.data_proc)
          FROM gc.mcw_processo_log pl
          WHERE pl.codigo = p.codigo
            AND pl.mes_ref = :mesRef
            AND pl.ano_ref = :anoRef
        ) AS data_ultima_execucao
      FROM gc.mcw_processo p
      WHERE p.ativo = 'S'
        AND p.categoria = :categoria
        AND p.tipo_de_dado = :tipoDado
      ORDER BY p.ordem
    `;

    const rows = await this.databaseService.executeQuery<{
      CODIGO: string;
      CATEGORIA: string;
      PROCEDURE: string;
      DESCRICAO: string;
      ORDEM: number;
      DIAS: number;
      USUARIO: string;
      TIPO_EMPRESA: string;
      TIPO_DE_DADO: string;
      ATIVO: string;
      DATA_ULTIMA_EXECUCAO: string | null;
    }>(query, {
      categoria: params.categoria,
      tipoDado: params.tipoDado,
      mesRef: params.mesRef,
      anoRef: params.anoRef,
    });

    return rows.map(
      (row) =>
        new Processo(
          row.CODIGO,
          row.CATEGORIA,
          row.PROCEDURE,
          row.DESCRICAO,
          row.ORDEM,
          row.DIAS,
          row.USUARIO,
          row.TIPO_EMPRESA,
          row.TIPO_DE_DADO,
          row.ATIVO,
          row.DATA_ULTIMA_EXECUCAO ? new Date(row.DATA_ULTIMA_EXECUCAO) : null,
        ),
    );
  }
}
