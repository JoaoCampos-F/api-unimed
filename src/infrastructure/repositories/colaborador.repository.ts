import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from 'src/database/database.services';
import { Colaborador } from 'src/domain/entities/colaborador.entity';
import {
  IColaboradorRepository,
  AtualizarColaboradorParams,
  AtualizarTodosParams,
  AtualizarValorEmpresaParams,
  BuscarColaboradoresParams,
  BuscarColaboradoresResult,
} from 'src/domain/repositories/colaborador.repository.interface';
import { CPF } from 'src/domain/value-objects/cpf.value-object';

interface ColaboradorRow {
  COD_EMPRESA: number;
  CODCOLIGADA: number;
  CODFILIAL: number;
  COD_BAND: number;
  CODIGO_CPF: string;
  COLABORADOR: string;
  APELIDO: string;
  MES_REF: string;
  ANO_REF: string;
  M_TITULAR: number;
  M_DEPENDENTE: number;
  VALOR_CONSUMO: number;
  PERC_EMPRESA: number;
  VALOR_TOTAL: number;
  VALOR_LIQUIDO: number;
  EXPORTA: 'S' | 'N';
  ATIVO: 'S' | 'N';
}

interface IBindsBuscarColaboradores {
  codEmpresa: number;
  codColigada: number;
  mes?: string;
  ano?: string;
  cpf?: string;
  search?: string;
  offset?: number;
  pageSize?: number;
}

interface DadosBasicosColaborador {
  cod_empresa: number;
  codcoligada: number;
  codfilial: number;
  cod_band: number;
}

@Injectable()
export class ColaboradorRepository implements IColaboradorRepository {
  private readonly logger = new Logger(ColaboradorRepository.name);

  constructor(private readonly databaseService: DatabaseService) {}

  async buscarColaboradores(
    params: BuscarColaboradoresParams,
  ): Promise<BuscarColaboradoresResult> {
    let countQuery = `
      SELECT COUNT(*) as TOTAL
      FROM gc.vw_uni_resumo_colaborador a
      WHERE 1=1
        AND a.cod_empresa = :codEmpresa
        AND a.codcoligada = :codColigada
    `;

    const binds: IBindsBuscarColaboradores = {
      codEmpresa: params.codEmpresa,
      codColigada: params.codColigada,
    };

    if (params.mes) {
      countQuery += ` AND a.mes_ref = :mes`;
      binds.mes = params.mes;
    }

    if (params.ano) {
      countQuery += ` AND a.ano_ref = :ano`;
      binds.ano = params.ano;
    }

    if (params.cpf) {
      countQuery += ` AND ltrim(a.codigo_cpf, '0000') = ltrim(:cpf, '0000')`;
      binds.cpf = params.cpf;
    }

    const totalRows = await this.databaseService.executeQuery<{
      TOTAL: number;
    }>(countQuery, binds);
    const totalRecords = totalRows[0]?.TOTAL || 0;

    // 🔹 STEP 2: Count filtered records (com search, sem paginação)
    let filteredCountQuery = countQuery;
    if (params.search) {
      filteredCountQuery += ` AND (
        UPPER(a.colaborador) LIKE UPPER(:search) 
        OR UPPER(a.apelido) LIKE UPPER(:search)
        OR ltrim(a.codigo_cpf, '0000') LIKE :search
      )`;
      binds.search = `%${params.search}%`;
    }

    const filteredRows = await this.databaseService.executeQuery<{
      TOTAL: number;
    }>(filteredCountQuery, binds);
    const filteredRecords = filteredRows[0]?.TOTAL || 0;

    // 🔹 STEP 3: Buscar dados paginados
    let query = `
      SELECT 
        a.cod_empresa,
        a.codcoligada,
        a.codfilial,
        a.cod_band,
        a.codigo_cpf,
        a.colaborador,
        a.apelido,
        a.mes_ref,
        a.ano_ref,
        a.m_titular,
        a.m_dependente,
        a.valor_consumo,
        a.perc_empresa,
        a.valor_total,
        a.valor_liquido,
        a.exporta,
        a.ativo
      FROM gc.vw_uni_resumo_colaborador a
      WHERE 1=1
        AND a.cod_empresa = :codEmpresa
        AND a.codcoligada = :codColigada
    `;

    if (params.mes) {
      query += ` AND a.mes_ref = :mes`;
    }

    if (params.ano) {
      query += ` AND a.ano_ref = :ano`;
    }

    if (params.cpf) {
      query += ` AND ltrim(a.codigo_cpf, '0000') = ltrim(:cpf, '0000')`;
    }

    if (params.search) {
      query += ` AND (
        UPPER(a.colaborador) LIKE UPPER(:search) 
        OR UPPER(a.apelido) LIKE UPPER(:search)
        OR ltrim(a.codigo_cpf, '0000') LIKE :search
      )`;
    }

    query += ` ORDER BY a.cod_band, a.apelido, a.colaborador`;

    const page = params.page || 1;
    const pageSize = params.pageSize || 50;
    const offset = (page - 1) * pageSize;

    query += ` OFFSET :offset ROWS FETCH NEXT :pageSize ROWS ONLY`;
    binds.offset = offset;
    binds.pageSize = pageSize;

    this.logger.debug(
      `Buscando colaboradores com paginação: page=${page}, pageSize=${pageSize}, search="${params.search || ''}"`,
    );

    const rows = await this.databaseService.executeQuery<ColaboradorRow>(
      query,
      binds,
    );

    const colaboradores = rows
      .filter((row) => {
        if (!row.CODIGO_CPF || row.CODIGO_CPF.trim() === '') {
          this.logger.warn(
            `Colaborador ${row.COLABORADOR} (empresa ${row.COD_EMPRESA}) sem CPF - ignorado`,
          );
          return false;
        }
        return true;
      })
      .map((row) => {
        try {
          const cpfNormalizado = row.CODIGO_CPF.padStart(11, '0');

          return new Colaborador(
            row.COD_EMPRESA,
            row.CODCOLIGADA,
            row.CODFILIAL,
            row.COD_BAND,
            new CPF(cpfNormalizado),
            row.COLABORADOR,
            row.APELIDO,
            row.MES_REF,
            row.ANO_REF,
            row.M_TITULAR,
            row.M_DEPENDENTE,
            row.VALOR_CONSUMO,
            row.PERC_EMPRESA,
            row.VALOR_TOTAL,
            row.VALOR_LIQUIDO,
            row.EXPORTA,
            row.ATIVO,
          );
        } catch (error) {
          this.logger.error(
            `Erro ao criar colaborador ${row.COLABORADOR} (CPF: ${row.CODIGO_CPF}): ${error.message}`,
          );
          throw error;
        }
      });

    return {
      data: colaboradores,
      totalRecords,
      filteredRecords,
      page,
      pageSize,
    };
  }

  async atualizarExporta(params: AtualizarColaboradorParams): Promise<number> {
    const query = `
      UPDATE gc.uni_resumo_colaborador
      SET exporta = :exporta
      WHERE ltrim(codigo_cpf, '0000') = ltrim(:cpf, '0000')
        AND mes_ref = :mesRef
        AND ano_ref = :anoRef
    `;

    const binds: Record<string, any> = {
      exporta: params.exporta,
      cpf: params.cpf,
      mesRef: params.mesRef,
      anoRef: params.anoRef,
    };

    this.logger.debug(
      `Atualizando exporta colaborador: ${JSON.stringify(params)}`,
    );

    const rowsAffected = await this.databaseService.executeUpdate(query, binds);

    if (rowsAffected === 0) {
      this.logger.warn(
        `Nenhum colaborador encontrado com CPF ${params.cpf} para período ${params.mesRef}/${params.anoRef}`,
      );
    }

    return rowsAffected;
  }

  async atualizarTodosExporta(params: AtualizarTodosParams): Promise<number> {
    const query = `
      UPDATE gc.uni_resumo_colaborador
      SET exporta = :exporta
      WHERE mes_ref = :mesRef
        AND ano_ref = :anoRef
        AND cod_empresa = :codEmpresa
        AND codcoligada = :codColigada
        AND codfilial = :codFilial
    `;

    const binds = {
      exporta: params.exporta,
      mesRef: params.mesRef,
      anoRef: params.anoRef,
      codEmpresa: params.codEmpresa,
      codColigada: params.codColigada,
      codFilial: params.codFilial,
    };

    this.logger.debug(
      `Atualizando todos colaboradores: ${JSON.stringify(params)}`,
    );

    const result = await this.databaseService.executeUpdate(query, binds);

    // Oracle retorna rowsAffected em result.rowsAffected
    return result || 0;
  }

  async atualizarValorEmpresa(
    params: AtualizarValorEmpresaParams,
  ): Promise<number> {
    // IMPORTANTE: Usa vírgula como separador decimal (formato brasileiro)
    const valorFormatado = params.valor.toFixed(2).replace('.', ',');

    const query = `
      UPDATE nbs.mcw_colaborador
      SET unimed = :valor
      WHERE ativo = 'S'
        AND cod_empresa = :codEmpresa
        AND codcoligada = :codColigada
        AND codfilial = :codFilial
    `;

    const binds = {
      valor: valorFormatado,
      codEmpresa: params.codEmpresa,
      codColigada: params.codColigada,
      codFilial: params.codFilial,
    };

    this.logger.debug(`Atualizando valor empresa: ${JSON.stringify(params)}`);

    const rowsAffected = await this.databaseService.executeUpdate(query, binds);

    this.logger.log(
      `Valor empresa atualizado: ${rowsAffected} colaboradores afetados`,
    );

    return rowsAffected;
  }

  async buscarDadosBasicosPorCpf(
    cpf: string,
  ): Promise<DadosBasicosColaborador | null> {
    const query = `
      SELECT DISTINCT
        a.cod_empresa,
        a.codcoligada,
        a.codfilial,
        a.cod_band
      FROM gc.colaborador a
      WHERE ltrim(a.codigo_cpf, '0000') = ltrim(:cpf, '0000')
        AND a.ativo = 'S'
        AND ROWNUM = 1
    `;

    try {
      const rows = await this.databaseService.executeQuery<{
        COD_EMPRESA: number;
        CODCOLIGADA: number;
        CODFILIAL: number;
        COD_BAND: number;
      }>(query, { cpf });

      if (!rows || rows.length === 0) {
        this.logger.debug(`Colaborador não encontrado para CPF: ${cpf}`);
        return null;
      }

      const row = rows[0];
      return {
        cod_empresa: row.COD_EMPRESA,
        codcoligada: row.CODCOLIGADA,
        codfilial: row.CODFILIAL,
        cod_band: row.COD_BAND,
      };
    } catch (error: any) {
      this.logger.error(
        `Erro ao buscar dados básicos do colaborador: ${error.message}`,
        error.stack,
      );
      return null;
    }
  }

  async buscarNomeEmpresa(codEmpresa: number): Promise<string | null> {
    const query = `
      SELECT DISTINCT
        a.apelido
      FROM gc.empresa_filial a
      WHERE a.cod_empresa = :codEmpresa
        AND a.ativo = 'S'
        AND ROWNUM = 1
    `;

    try {
      const rows = await this.databaseService.executeQuery<{
        APELIDO: string;
      }>(query, { codEmpresa });

      if (!rows || rows.length === 0) {
        return null;
      }

      return rows[0].APELIDO;
    } catch (error: any) {
      this.logger.error(
        `Erro ao buscar nome da empresa: ${error.message}`,
        error.stack,
      );
      return null;
    }
  }
}
