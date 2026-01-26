import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from 'src/database/database.services';
import { Colaborador } from 'src/domain/entities/colaborador.entity';
import {
  IColaboradorRepository,
  AtualizarColaboradorParams,
  AtualizarTodosParams,
  AtualizarValorEmpresaParams,
  BuscarColaboradoresParams,
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
}

@Injectable()
export class ColaboradorRepository implements IColaboradorRepository {
  private readonly logger = new Logger(ColaboradorRepository.name);

  constructor(private readonly databaseService: DatabaseService) {}

  async buscarColaboradores(
    params: BuscarColaboradoresParams,
  ): Promise<Colaborador[]> {
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

    const binds: IBindsBuscarColaboradores = {
      codEmpresa: params.codEmpresa,
      codColigada: params.codColigada,
    };

    if (params.mes) {
      query += ` AND a.mes_ref = :mes`;
      binds.mes = params.mes;
    }

    if (params.ano) {
      query += ` AND a.ano_ref = :ano`;
      binds.ano = params.ano;
    }

    if (params.cpf) {
      query += ` AND ltrim(a.codigo_cpf, '0000') = ltrim(:cpf, '0000')`;
      binds.cpf = params.cpf;
    }

    query += ` ORDER BY a.cod_band, a.apelido, a.colaborador`;

    this.logger.debug(
      `Executando busca de colaboradores: ${JSON.stringify(params)}`,
    );

    const rows = await this.databaseService.executeQuery<ColaboradorRow>(
      query,
      binds,
    );

    return rows
      .filter((row) => {
        // Filtra registros sem CPF
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
          // IMPORTANTE: A tabela uni_resumo_colaborador armazena CPFs sem zeros à esquerda
          // Ex: "12345678" ao invés de "00012345678"
          // Fazemos LPAD para normalizar antes de criar o Value Object
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
  }

  async atualizarExporta(params: AtualizarColaboradorParams): Promise<void> {
    const query = `
      UPDATE gc.uni_resumo_colaborador
      SET exporta = :exporta
      WHERE codigo_cpf = :cpf
        AND mes_ref = :mesRef
        AND ano_ref = :anoRef
    `;

    const binds = {
      exporta: params.exporta,
      cpf: params.cpf,
      mesRef: params.mesRef,
      anoRef: params.anoRef,
    };

    this.logger.debug(
      `Atualizando exporta colaborador: ${JSON.stringify(params)}`,
    );

    await this.databaseService.executeQuery(query, binds);
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
  ): Promise<void> {
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

    await this.databaseService.executeQuery(query, binds);
  }
}
