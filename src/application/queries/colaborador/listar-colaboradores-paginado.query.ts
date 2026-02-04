import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from '../../../database/database.services';

export interface ListarColaboradoresPaginadoParams {
  codEmpresa?: number;
  codColigada?: number;
  mesRef?: string;
  anoRef?: string;
  cpf?: string;
  codContrato?: string;
  nome?: string;
  page?: number;
  pageSize?: number;
  orderBy?: string;
  orderDirection?: 'asc' | 'desc';
}

export interface ColaboradorResumoDto {
  apelido: string;
  colaborador: string;
  ativo: 'S' | 'N';
  exporta: 'S' | 'N';
  mesRef: string;
  anoRef: string;
  mTitular: string;
  mDependente: string;
  valorConsumo: string;
  percEmpresa: string;
  valorTotal: string;
  valorLiquido: string;
  codigoCpf: string;
  codEmpresa: number;
  codColigada: number;
  codFilial: number;
  codBand: number;
}

export interface ListarColaboradoresPaginadoResponse {
  dados: ColaboradorResumoDto[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

interface ColaboradorRow {
  APELIDO: string;
  COLABORADOR: string;
  ATIVO: 'S' | 'N';
  EXPORTA: 'S' | 'N';
  MES_REF: string;
  ANO_REF: string;
  M_TITULAR: number;
  M_DEPENDENTE: number;
  VALOR_CONSUMO: number;
  PERC_EMPRESA: number;
  VALOR_TOTAL: number;
  VALOR_LIQUIDO: number;
  CODIGO_CPF: string;
  COD_EMPRESA: number;
  CODCOLIGADA: number;
  CODFILIAL: number;
  COD_BAND: number;
}

/**
 * Query para listar colaboradores com paginação e filtros
 * Baseado em: npd-legacy UnimedController.php acao=Buscar (linhas 260-350)
 * View: gc.vw_uni_resumo_colaborador
 */
@Injectable()
export class ListarColaboradoresPaginadoQuery {
  private readonly logger = new Logger(ListarColaboradoresPaginadoQuery.name);

  constructor(private readonly databaseService: DatabaseService) {}

  async execute(
    params: ListarColaboradoresPaginadoParams,
  ): Promise<ListarColaboradoresPaginadoResponse> {
    const {
      codEmpresa,
      codColigada,
      mesRef,
      anoRef,
      cpf,
      codContrato,
      nome,
      page = 1,
      pageSize = 10,
      orderBy = 'COLABORADOR',
      orderDirection = 'asc',
    } = params;

    this.logger.log(
      `Listando colaboradores paginados: page=${page}, size=${pageSize}`,
    );

    // Query base
    let sql = `
      SELECT 
        a.APELIDO,
        a.COLABORADOR,
        a.ATIVO,
        a.EXPORTA,
        a.MES_REF,
        a.ANO_REF,
        a.M_TITULAR,
        a.M_DEPENDENTE,
        a.VALOR_CONSUMO,
        a.PERC_EMPRESA,
        a.VALOR_TOTAL,
        a.VALOR_LIQUIDO,
        a.CODIGO_CPF,
        a.COD_EMPRESA,
        a.CODCOLIGADA,
        a.CODFILIAL,
        a.COD_BAND
      FROM gc.vw_uni_resumo_colaborador a
      WHERE 1=1
    `;

    const binds: any = {};

    // Aplicar filtros conforme legacy (linha 272-276)
    if (codEmpresa) {
      sql += ` AND a.cod_empresa = :codEmpresa`;
      binds.codEmpresa = codEmpresa;
    }

    if (codColigada) {
      sql += ` AND a.codcoligada = :codColigada`;
      binds.codColigada = codColigada;
    }

    if (mesRef) {
      sql += ` AND a.mes_ref = :mesRef`;
      binds.mesRef = mesRef;
    }

    if (anoRef) {
      sql += ` AND a.ano_ref = :anoRef`;
      binds.anoRef = anoRef;
    }

    // Filtro por CPF (com ltrim conforme legacy linha 275)
    if (cpf) {
      sql += ` AND ltrim(a.codigo_cpf, '0000') = ltrim(:cpf, '0000')`;
      binds.cpf = cpf;
    }

    // Filtro por nome (busca parcial)
    if (nome) {
      sql += ` AND UPPER(a.COLABORADOR) LIKE UPPER(:nome)`;
      binds.nome = `%${nome}%`;
    }

    // Contar total de registros
    const countSql = `SELECT COUNT(*) as TOTAL FROM (${sql})`;
    const countResult = await this.databaseService.executeQuery<{
      TOTAL: number;
    }>(countSql, binds);
    const total = countResult[0]?.TOTAL || 0;

    // Adicionar ordenação (conforme legacy linha 278)
    const validOrderColumns = [
      'COD_BAND',
      'APELIDO',
      'COLABORADOR',
      'MES_REF',
      'ANO_REF',
    ];
    const orderColumn = validOrderColumns.includes(orderBy.toUpperCase())
      ? orderBy.toUpperCase()
      : 'COLABORADOR';
    const direction = orderDirection.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

    sql += ` ORDER BY a.COD_BAND, a.APELIDO, a.${orderColumn} ${direction}`;

    // Aplicar paginação (Oracle 12c+)
    const offset = (page - 1) * pageSize;
    sql += ` OFFSET :offset ROWS FETCH NEXT :pageSize ROWS ONLY`;
    binds.offset = offset;
    binds.pageSize = pageSize;

    // Executar query paginada
    const rows = await this.databaseService.executeQuery<ColaboradorRow>(
      sql,
      binds,
    );

    // Mapear para DTO
    const dados: ColaboradorResumoDto[] = rows.map((row) => ({
      apelido: row.APELIDO || '',
      colaborador: row.COLABORADOR || '',
      ativo: row.ATIVO,
      exporta: row.EXPORTA,
      mesRef: row.MES_REF,
      anoRef: row.ANO_REF,
      mTitular: row.M_TITULAR?.toFixed(2) || '0.00',
      mDependente: row.M_DEPENDENTE?.toFixed(2) || '0.00',
      valorConsumo: row.VALOR_CONSUMO?.toFixed(2) || '0.00',
      percEmpresa: row.PERC_EMPRESA?.toFixed(2) || '0.00',
      valorTotal: row.VALOR_TOTAL?.toFixed(2) || '0.00',
      valorLiquido: row.VALOR_LIQUIDO?.toFixed(2) || '0.00',
      codigoCpf: row.CODIGO_CPF,
      codEmpresa: row.COD_EMPRESA,
      codColigada: row.CODCOLIGADA,
      codFilial: row.CODFILIAL,
      codBand: row.COD_BAND,
    }));

    const totalPages = Math.ceil(total / pageSize);

    return {
      dados,
      total,
      page,
      pageSize,
      totalPages,
    };
  }
}
