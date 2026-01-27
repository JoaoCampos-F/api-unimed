import { Injectable } from '@nestjs/common';
import { DatabaseService } from 'src/database/database.services';
import { Processo } from 'src/domain/entities/processo.entity';
import { ProcessoLog } from 'src/domain/entities/processo-log';
import { IProcessoRepository } from 'src/domain/repositories/processo.repository.interface';

// Tipos para rows do banco de dados
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

@Injectable()
export class ProcessoRepository implements IProcessoRepository {
  constructor(private readonly databaseService: DatabaseService) {}

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
      FROM nbs.mcw_processo
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
          row.DESCRICAO,
          row.CATEGORIA,
          row.ORDEM,
          row.DIAS,
          row.ATIVO,
          row.TIPO_DE_DADO,
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

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const binds: any = { categoria: params.categoria };

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
      FROM nbs.mcw_processo
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
}
