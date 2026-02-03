import { Injectable } from '@nestjs/common';
import { IEmpresaRepository } from '../../domain/repositories/empresa.repository.interface';
import { Empresa } from '../../domain/entities/empresa.entity';
import { CNPJ } from '../../domain/value-objects/cnpj.value-object';
import { DocumentoFiscal } from '../../domain/value-objects/documento-fiscal.value-object';
import { DatabaseService } from '../../database/database.services';
import { EmpresaFilialDto } from 'src/application/dtos/importacao/empresa-filial.dto';
import { EmpresaDadosContratoDto } from 'src/application/dtos/importacao/empresa-dados-contrato.dto';
interface EmpresaDadosCodigo {
  COD_EMPRESA: number;
  CODCOLIGADA: number;
  CODFILIAL: number;
  COD_BAND: number;
  CNPJ: string;
  PROCESSA_UNIMED: string;
}

interface EmpresaDadosCompleto extends EmpresaDadosCodigo {
  APELIDO?: string;
}

interface EmpresaCompletaRow {
  COD_EMPRESA: number;
  CODCOLIGADA: number;
  CODFILIAL: number;
  COD_BAND: number;
  CNPJ: string;
  APELIDO: string;
  PROCESSA_UNIMED: string;
  ATIVO: string;
}

@Injectable()
export class EmpresaRepository implements IEmpresaRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  async buscarEmpresasAtivasUnimed(): Promise<Empresa[]> {
    const sql = `
      SELECT 
        ef.cod_empresa,
        ef.codcoligada,
        ef.codfilial,
        ef.cod_band,
        ef.cnpj
      FROM gc.empresa_filial ef
      WHERE ef.processa_unimed = 'S'
      AND ef.CNPJ='24958142000124'
      ORDER BY ef.cod_band, ef.cod_empresa
    `;

    const resultado =
      await this.databaseService.executeQuery<EmpresaFilialDto>(sql);

    return resultado.map(
      (row) =>
        new Empresa(
          row.COD_EMPRESA,
          row.CODCOLIGADA,
          row.CODFILIAL,
          row.COD_BAND,
          new DocumentoFiscal(row.CNPJ), // 🔥 Aceita CPF ou CNPJ automaticamente
          true,
        ),
    );
  }

  async buscarPorCodigo(codEmpresa: number): Promise<Empresa | null> {
    const sql = `
      SELECT 
        ef.cod_empresa,
        ef.codcoligada,
        ef.codfilial,
        ef.cod_band,
        ef.cnpj,
        ef.processa_unimed
      FROM gc.empresa_filial ef
      WHERE ef.cod_empresa = :codEmpresa
    `;

    const resultado =
      await this.databaseService.executeQuery<EmpresaDadosCodigo>(sql, {
        codEmpresa,
      });

    if (resultado.length === 0) return null;

    const row = resultado[0];

    return new Empresa(
      row.COD_EMPRESA,
      row.CODCOLIGADA,
      row.CODFILIAL,
      row.COD_BAND,
      new DocumentoFiscal(row.CNPJ), // 🔥 Aceita CPF ou CNPJ automaticamente
      row.PROCESSA_UNIMED === 'S',
    );
  }

  async buscarPorSigla(sigla: string): Promise<Empresa | null> {
    const sql = `
      SELECT 
        ef.cod_empresa,
        ef.codcoligada,
        ef.codfilial,
        ef.cod_band,
        ef.cnpj,
        ef.processa_unimed
      FROM gc.empresa_filial ef
      WHERE UPPER(ef.apelido) = UPPER(:sigla)
        AND ef.processa_unimed = 'S'
    `;

    const resultado =
      await this.databaseService.executeQuery<EmpresaDadosCodigo>(sql, {
        sigla,
      });

    if (resultado.length === 0) return null;

    const row = resultado[0];

    return new Empresa(
      row.COD_EMPRESA,
      row.CODCOLIGADA,
      row.CODFILIAL,
      row.COD_BAND,
      new DocumentoFiscal(row.CNPJ), // 🔥 Aceita CPF ou CNPJ automaticamente
      row.PROCESSA_UNIMED === 'S',
    );
  }

  async buscarPorBandeira(codBand: string): Promise<Empresa[]> {
    const sql = `
      SELECT 
        ef.cod_empresa,
        ef.codcoligada,
        ef.codfilial,
        ef.cod_band,
        ef.cnpj,
        ef.processa_unimed
      FROM gc.empresa_filial ef
      WHERE ef.cod_band = :codBand
        AND ef.processa_unimed = 'S'
      ORDER BY ef.cod_empresa
    `;

    const resultado =
      await this.databaseService.executeQuery<EmpresaDadosCodigo>(sql, {
        codBand,
      });

    return resultado.map(
      (row) =>
        new Empresa(
          row.COD_EMPRESA,
          row.CODCOLIGADA,
          row.CODFILIAL,
          row.COD_BAND,
          new DocumentoFiscal(row.CNPJ), // 🔥 Aceita CPF ou CNPJ automaticamente
          row.PROCESSA_UNIMED === 'S',
        ),
    );
  }

  async buscarContratosAtivos(): Promise<EmpresaDadosContratoDto[]> {
    const sql = `
      SELECT 
        a.cod_empresa,
        a.codcoligada,
        a.codfilial,              
        a.cod_band,
        a.cnpj,
        a.contrato
      FROM gc.uni_dados_contrato a
      WHERE a.ativo = 'S'       
      ORDER BY a.cod_band, a.cod_empresa
    `;

    return this.databaseService.executeQuery(sql);
  }

  async validarExistencia(
    codEmpresa: number,
    codColigada: number,
    codFilial: number,
  ): Promise<boolean> {
    const sql = `
      SELECT 1
      FROM gc.empresa_filial ef
      WHERE ef.cod_empresa = :codEmpresa
        AND ef.codcoligada = :codColigada
        AND ef.codfilial = :codFilial
    `;

    const resultado = await this.databaseService.executeQuery(sql, {
      codEmpresa,
      codColigada,
      codFilial,
    });

    return resultado.length > 0;
  }

  async listarEmpresasCompletas(): Promise<EmpresaCompletaRow[]> {
    const sql = `
      SELECT 
        ef.cod_empresa,
        ef.codcoligada,
        ef.codfilial,
        ef.cod_band,
        ef.cnpj,
        ef.apelido,
        ef.processa_unimed,
        ef.ativo
      FROM gc.empresa_filial ef
      WHERE ef.ativo = 'S'
        AND ef.processa_unimed = 'S'
      ORDER BY ef.apelido, ef.cod_empresa
    `;

    return this.databaseService.executeQuery<EmpresaCompletaRow>(sql);
  }
}
