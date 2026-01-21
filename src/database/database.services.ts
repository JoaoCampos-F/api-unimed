/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as oracledb from 'oracledb';

@Injectable()
export class DatabaseService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(DatabaseService.name);

  private pool: oracledb.Pool;

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    try {
      oracledb.initOracleClient({ libDir: 'C:\\oracle\\instantclient_21_10' });

      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      this.pool = await oracledb.createPool({
        user: this.configService.get<string>('DB_USER'),
        password: this.configService.get<string>('DB_PASSWORD'),
        connectString: this.configService.get<string>('DB_CONNECT_STRING'),
        poolMin: 2,
        poolMax: 10,
        poolIncrement: 2,
      });
    } catch (error) {
      this.logger.error('Error creating Oracle DB connection pool', error);
    }
  }

  async onModuleDestroy() {
    try {
      await this.pool.close(10);
    } catch (error) {
      this.logger.error('Error closing Oracle DB connection pool', error);
    }
  }

  async executeQuery<T = any>(
    sql: string,
    binds: any[] | Record<string, any> = [],
    options: oracledb.ExecuteOptions = {},
  ): Promise<T[]> {
    let connection: oracledb.Connection;

    try {
      connection = await this.pool.getConnection();
      const result = await connection.execute(sql, binds, {
        outFormat: oracledb.OUT_FORMAT_OBJECT,
        autoCommit: true,
        ...options,
      });

      this.logger.log(
        `✅ Query executada - rowsAffected: ${result.rowsAffected || 0}`,
      );

      return result.rows as T[];
    } catch (error) {
      this.logger.error(
        `Erro ao executar query: ${error.message}`,
        error.stack,
      );
      throw error;
    } finally {
      if (connection) {
        try {
          await connection.close();
        } catch (err) {
          this.logger.error('Erro ao fechar conexão', err);
        }
      }
    }
  }

  async executeMany(
    sql: string,
    binds: any[][],
    options: oracledb.ExecuteManyOptions = {},
  ): Promise<oracledb.Result<any>> {
    let connection: oracledb.Connection;

    try {
      connection = await this.pool.getConnection();

      const result = await connection.executeMany(sql, binds, {
        autoCommit: true,
        ...options,
      });

      return result;
    } catch (error) {
      this.logger.error(
        `Erro ao executar executeMany: ${error.message}`,
        error.stack,
      );
      throw error;
    } finally {
      if (connection) {
        try {
          await connection.close();
        } catch (err) {
          this.logger.error('Erro ao fechar conexão', err);
        }
      }
    }
  }

  async executeProcedure(plsql: string, binds: any = {}): Promise<any> {
    let connection: oracledb.Connection;

    try {
      connection = await this.pool.getConnection();

      const result = await connection.execute(plsql, binds, {
        autoCommit: true,
      });

      return result;
    } catch (error) {
      this.logger.error(
        `Erro ao executar procedure: ${error.message}`,
        error.stack,
      );
      throw error;
    } finally {
      if (connection) {
        try {
          await connection.close();
        } catch (err) {
          this.logger.error('Erro ao fechar conexão', err);
        }
      }
    }
  }

  async getRowCount(sql: string, binds: any[] = []): Promise<number> {
    const result = await this.executeQuery(sql, binds);
    return result.length;
  }

  async executeDelete(
    sql: string,
    binds: any[] | Record<string, any> = [],
  ): Promise<number> {
    let connection: oracledb.Connection;

    try {
      connection = await this.pool.getConnection();
      const result = await connection.execute(sql, binds, {
        autoCommit: true,
      });

      return result.rowsAffected || 0;
    } catch (error) {
      this.logger.error(
        `Erro ao executar delete: ${error.message}`,
        error.stack,
      );
      throw error;
    } finally {
      if (connection) {
        try {
          await connection.close();
        } catch (err) {
          this.logger.error('Erro ao fechar conexão', err);
        }
      }
    }
  }
}
