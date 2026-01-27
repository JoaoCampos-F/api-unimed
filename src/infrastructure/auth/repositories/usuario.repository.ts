import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from '../../../database/database.services';
import { UserAuth } from '../types/user-auth.type';

interface CreateUsuarioDto {
  public_id: string;
  nome: string;
  email: string;
  cpf?: string;
  preferred_username?: string;
  cod_empresa?: number;
  codcoligada?: number;
  codfilial?: number;
  ativo: string;
}

interface UpdateUsuarioDto {
  nome?: string;
  email?: string;
  cod_empresa?: number;
  codcoligada?: number;
  codfilial?: number;
  ativo?: string;
}

@Injectable()
export class UsuarioRepository {
  private readonly logger = new Logger(UsuarioRepository.name);

  constructor(private readonly databaseService: DatabaseService) {}

  async findByPublicId(publicId: string): Promise<UserAuth | null> {
    const sql = `
      SELECT 
        id,
        public_id,
        nome,
        email,
        cpf,
        preferred_username,
        ativo,
        cod_empresa,
        codcoligada,
        codfilial
      FROM gc1.planos_saude_usuarios
      WHERE public_id = :publicId
    `;

    try {
      const result = await this.databaseService.executeQuery<any>(sql, {
        publicId,
      });

      if (!result || result.length === 0) {
        return null;
      }

      const row = result[0];
      return {
        id: row.ID,
        public_id: row.PUBLIC_ID,
        nome: row.NOME,
        email: row.EMAIL,
        cpf: row.CPF,
        preferred_username: row.PREFERRED_USERNAME,
        ativo: row.ATIVO,
        cod_empresa: row.COD_EMPRESA,
        codcoligada: row.CODCOLIGADA,
        codfilial: row.CODFILIAL,
        roles: [], // Será preenchido pelo guard
      };
    } catch (error: any) {
      this.logger.error(
        `Erro ao buscar usuário por public_id: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  async findById(id: number): Promise<UserAuth | null> {
    const sql = `
      SELECT 
        id,
        public_id,
        nome,
        email,
        cpf,
        preferred_username,
        ativo,
        cod_empresa,
        codcoligada,
        codfilial
      FROM gc1.planos_saude_usuarios
      WHERE id = :id
    `;

    try {
      const result = await this.databaseService.executeQuery<any>(sql, { id });

      if (!result || result.length === 0) {
        return null;
      }

      const row = result[0];
      return {
        id: row.ID,
        public_id: row.PUBLIC_ID,
        nome: row.NOME,
        email: row.EMAIL,
        cpf: row.CPF,
        preferred_username: row.PREFERRED_USERNAME,
        ativo: row.ATIVO,
        cod_empresa: row.COD_EMPRESA,
        codcoligada: row.CODCOLIGADA,
        codfilial: row.CODFILIAL,
        roles: [],
      };
    } catch (error: any) {
      this.logger.error(
        `Erro ao buscar usuário por id: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  async create(data: CreateUsuarioDto): Promise<UserAuth> {
    const sql = `
      INSERT INTO gc1.planos_saude_usuarios (
        public_id,
        nome,
        email,
        cpf,
        preferred_username,
        ativo,
        cod_empresa,
        codcoligada,
        codfilial
      ) VALUES (
        :public_id,
        :nome,
        :email,
        :cpf,
        :preferred_username,
        :ativo,
        :cod_empresa,
        :codcoligada,
        :codfilial
      ) RETURNING id INTO :id
    `;

    const params = {
      public_id: data.public_id,
      nome: data.nome,
      email: data.email,
      cpf: data.cpf || null,
      preferred_username: data.preferred_username || null,
      ativo: data.ativo,
      cod_empresa: data.cod_empresa || null,
      codcoligada: data.codcoligada || null,
      codfilial: data.codfilial || null,
      id: {
        dir: this.databaseService.oracledb.BIND_OUT,
        type: this.databaseService.oracledb.NUMBER,
      },
    };

    try {
      const result: any = await this.databaseService.executeQuery<any>(
        sql,
        params,
      );

      const userId = result.outBinds?.id?.[0] as number;

      if (!userId) {
        throw new Error('Falha ao criar usuário: ID não retornado');
      }

      this.logger.log(`Usuário criado com sucesso: ${userId}`);

      // Busca o usuário recém-criado
      const user = await this.findById(userId);
      if (!user) {
        throw new Error('Usuário criado mas não encontrado');
      }
      return user;
    } catch (error: any) {
      this.logger.error(`Erro ao criar usuário: ${error.message}`, error.stack);
      throw error;
    }
  }

  async update(id: number, data: UpdateUsuarioDto): Promise<void> {
    const fields: string[] = [];
    const params: Record<string, any> = { id };

    if (data.nome !== undefined) {
      fields.push('nome = :nome');
      params.nome = data.nome;
    }
    if (data.email !== undefined) {
      fields.push('email = :email');
      params.email = data.email;
    }
    if (data.cod_empresa !== undefined) {
      fields.push('cod_empresa = :cod_empresa');
      params.cod_empresa = data.cod_empresa;
    }
    if (data.codcoligada !== undefined) {
      fields.push('codcoligada = :codcoligada');
      params.codcoligada = data.codcoligada;
    }
    if (data.codfilial !== undefined) {
      fields.push('codfilial = :codfilial');
      params.codfilial = data.codfilial;
    }
    if (data.ativo !== undefined) {
      fields.push('ativo = :ativo');
      params.ativo = data.ativo;
    }

    if (fields.length === 0) {
      return;
    }

    fields.push('data_atualizacao = SYSDATE');

    const sql = `
      UPDATE gc1.planos_saude_usuarios 
      SET ${fields.join(', ')}
      WHERE id = :id
    `;

    try {
      await this.databaseService.executeQuery(sql, params);
      this.logger.log(`Usuário atualizado com sucesso: ${id}`);
    } catch (error: any) {
      this.logger.error(
        `Erro ao atualizar usuário: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }
}
