# GUIA COMPLETO DE IMPLEMENTAÇÃO - MÓDULO UNIMED EM NESTJS

## 📋 ÍNDICE

1. [Visão Geral do Sistema](#1-visão-geral-do-sistema)
2. [Arquitetura do Sistema Legacy (PHP)](#2-arquitetura-do-sistema-legacy-php)
3. [Estrutura de Banco de Dados](#3-estrutura-de-banco-de-dados)
4. [Arquitetura NestJS Proposta](#4-arquitetura-nestjs-proposta)
5. [Configuração Inicial do Projeto](#5-configuração-inicial-do-projeto)
6. [Implementação Passo a Passo](#6-implementação-passo-a-passo)
7. [Checklist de Funcionalidades](#7-checklist-de-funcionalidades)

---

## 1. VISÃO GERAL DO SISTEMA

### Objetivo do Sistema

O módulo **UNI** (Unimed) é responsável por gerenciar planos de saúde da operadora Unimed para colaboradores de diferentes empresas. O sistema realiza:

- ✅ Importação de dados de cobranças da Unimed (via SOAP e REST API)
- ✅ Gerenciamento de colaboradores e beneficiários
- ✅ Controle de valores e faturas
- ✅ Exportação de dados para sistemas de RH (Totvs/RM)
- ✅ Geração de relatórios gerenciais (JasperReports)
- ✅ Processamento de fechamentos mensais
- ✅ Integração com DIRF (Declaração de Imposto de Renda)

### Fluxo Principal

```
1. Importação de Dados da Unimed (API/SOAP)
   ↓
2. Armazenamento no Oracle
   ↓
3. Processamento e Cálculos (Stored Procedures)
   ↓
4. Consulta e Ajustes pelos Usuários
   ↓
5. Exportação para Folha de Pagamento
   ↓
6. Geração de Relatórios
```

---

## 2. ARQUITETURA DO SISTEMA LEGACY (PHP)

### 2.1 Estrutura de Arquivos Analisada

```
npd-legacy/com/modules/uni/
├── controller/
│   └── UnimedController.php (665 linhas - 20 endpoints)
├── model/
│   ├── Unimed.php (330 linhas - Entity/DTO)
│   └── UnimedDAO.php (1004 linhas - Data Access)
└── view/
    └── Unimed.php (interface HTML/PHP)

npd-legacy/js/com/uni/
└── Unimed.js (756 linhas - Frontend)
```

### 2.2 Principais Funcionalidades Identificadas

#### **A) IMPORTAÇÃO DE DADOS**

| Ação                 | Descrição                       | Fonte                   |
| -------------------- | ------------------------------- | ----------------------- |
| `saveUnimed2`        | Importa dados via SOAP (antigo) | WebService SOAP         |
| `saveUnimedCnpj`     | Importa por CNPJ                | API REST Unimed Cuiabá  |
| `saveUnimedContrato` | Importa por Contrato            | API REST Unimed Cuiabá  |
| `save`               | Executa procedure de resumo     | Stored Procedure Oracle |

#### **B) CONSULTAS E LISTAGENS**

| Ação                | Descrição                            | Retorno         |
| ------------------- | ------------------------------------ | --------------- |
| `Buscar`            | Lista colaboradores com dados Unimed | DataTables JSON |
| `Buscarprocesso`    | Lista processos de fechamento        | Array JSON      |
| `H_unimed`          | Histórico de processamentos          | Array JSON      |
| `HistoricoProcesso` | Histórico detalhado                  | Array JSON      |

#### **C) ATUALIZAÇÕES**

| Ação                     | Descrição                                   | Impacto                     |
| ------------------------ | ------------------------------------------- | --------------------------- |
| `update`                 | Atualiza flag de exportação por colaborador | `gc.uni_resumo_colaborador` |
| `updateTodosColaborador` | Atualiza todos colaboradores de uma empresa | Massa                       |
| `updateValor`            | Atualiza valor pago pela empresa            | `nbs.mcw_colaborador`       |

#### **D) PROCESSAMENTOS E EXPORTAÇÕES**

| Ação         | Descrição                       | Complexidade |
| ------------ | ------------------------------- | ------------ |
| `Execute`    | Executa processos de fechamento | ⭐⭐⭐ Alta  |
| `ExUnimed`   | Exporta dados para Totvs        | ⭐⭐⭐ Alta  |
| `unimedDIRF` | Gera dados para DIRF            | ⭐⭐ Média   |

#### **E) RELATÓRIOS (JasperReports)**

| Ação                          | Arquivo Jasper                       | Parâmetros                       |
| ----------------------------- | ------------------------------------ | -------------------------------- |
| `RelatorioColaborador`        | RelatorioColaborador.jasper          | empresa, cpf, contrato, mês, ano |
| `RelatorioEmpresaColaborador` | relatorioCobranca_por_empresa.jasper | empresa, contrato, mês, ano      |
| `RelatorioPagamento`          | relatorioPagamentos.jasper           | empresa, mês, ano                |
| `RelatorioNaoPagamento`       | relatorioNaolancamento.jasper        | empresa, mês, ano                |
| `resumoDept`                  | resumoCentro.jasper                  | empresa, mês, ano                |
| `resumoCentroCust`            | relatorioCentroCusto.jasper          | empresa, mês, ano                |

---

## 3. ESTRUTURA DE BANCO DE DADOS

### 3.1 Tabelas Principais Identificadas

#### **Tabela: `gc.UNI_DADOS_COBRANCA`**

```sql
-- Tabela de importação direta da API Unimed
CREATE TABLE gc.UNI_DADOS_COBRANCA (
    cod_empresa         NUMBER,
    codcoligada         NUMBER,
    codfilial           NUMBER,
    cod_band            NUMBER,
    contrato            VARCHAR2(50),
    cnpj                VARCHAR2(20),
    contratante         VARCHAR2(200),
    nomeplano           VARCHAR2(200),
    abrangencia         VARCHAR2(50),
    codfatura           VARCHAR2(50),
    valorFatura         NUMBER(10,2),
    periodo             VARCHAR2(10),
    codtitular          VARCHAR2(50),
    titular             VARCHAR2(200),
    cpftitular          VARCHAR2(14),
    matricula           VARCHAR2(50),
    acomodacao          VARCHAR2(100),
    codbeneficiario     VARCHAR2(50),
    beneficiario        VARCHAR2(200),
    idade               NUMBER,
    nascimento          VARCHAR2(10),
    inclusao            VARCHAR2(10),
    dependencia         VARCHAR2(50),
    cpf                 VARCHAR2(14),
    valor               NUMBER(10,2),
    descricao           VARCHAR2(500),
    mes_import          VARCHAR2(2),
    ano_import          VARCHAR2(4),
    mes_ref             VARCHAR2(2),
    ano_ref             VARCHAR2(4),
    data_import         DATE
);
```

#### **Tabela: `gc.uni_resumo_colaborador`**

```sql
-- Tabela processada com resumo por colaborador
-- (Populada via Stored Procedure)
CREATE TABLE gc.uni_resumo_colaborador (
    cod_empresa         NUMBER,
    codcoligada         NUMBER,
    codfilial           NUMBER,
    cod_band            NUMBER,
    codigo_cpf          VARCHAR2(14),
    colaborador         VARCHAR2(200),
    apelido             VARCHAR2(50),
    mes_ref             VARCHAR2(2),
    ano_ref             VARCHAR2(4),
    m_titular           NUMBER(10,2),
    m_dependente        NUMBER(10,2),
    valor_consumo       NUMBER(10,2),
    perc_empresa        NUMBER(10,2),
    valor_total         NUMBER(10,2),
    valor_liquido       NUMBER(10,2),
    exporta             CHAR(1) DEFAULT 'S', -- Flag para exportação
    ativo               CHAR(1)
);
```

#### **Tabela: `nbs.UNI_DADOS_COBRANCA` (Antiga - SOAP)**

```sql
-- Tabela antiga do WebService SOAP
CREATE TABLE nbs.UNI_DADOS_COBRANCA (
    contrato            VARCHAR2(50),
    cnpj                VARCHAR2(20),
    contratante         VARCHAR2(200),
    planomod            VARCHAR2(50),
    modalidade          VARCHAR2(100),
    abrangencia         VARCHAR2(50),
    fatura              VARCHAR2(50),
    venda               VARCHAR2(50),
    valor_total         NUMBER(10,2),
    titular             VARCHAR2(50),
    matricula           VARCHAR2(50),
    plano               VARCHAR2(50),
    codigo              VARCHAR2(50),
    beneficiario        VARCHAR2(200),
    idade               NUMBER,
    nascimento          VARCHAR2(10),
    inclusao            VARCHAR2(10),
    situacao            VARCHAR2(50),
    dependencia         VARCHAR2(50),
    lancamento          VARCHAR2(200),
    debito              NUMBER(10,2),
    credito             NUMBER(10,2),
    valor               NUMBER(10,2),
    ben_lotacao         VARCHAR2(100),
    periodo             VARCHAR2(4),
    codlanc             VARCHAR2(50),
    codtitular          VARCHAR2(50),
    cpf                 VARCHAR2(14),
    mes                 VARCHAR2(2),
    cpf_titular         VARCHAR2(14),
    codigo_increment    NUMBER,
    ano_uni             VARCHAR2(4),
    mes_uni             VARCHAR2(2)
);
```

#### **Outras Tabelas Relacionadas**

```sql
-- Contratos Unimed cadastrados
gc.uni_dados_contrato (cod_empresa, codcoligada, codfilial, cod_band, cnpj, contrato, ativo)

-- Tokens/Hash de Autenticação
gc.api_gc_servicos (hash, tipo, ativo, data_atualizacao)

-- Processos de Fechamento
gc.mcw_processo (codigo, descricao, categoria, procedure, ordem, dias, ativo, tipo_dado)
gc.mcw_processo_log (codigo, mes_ref, ano_ref, usuario, data_proc, apaga, previa, hora1, hora2)

-- Período de Fechamento
gc.mcw_periodo (mes_ref, ano_ref, data_final)
gc.mcw_periodo_fechamento (mes_ref, ano_ref, data_final)

-- Empresas e Filiais
gc.empresa_filial (cod_empresa, codcoligada, codfilial, cod_band, cnpj, processa_unimed)

-- Colaboradores
nbs.mcw_colaborador (cod_empresa, codcoligada, codfilial, cpf, nome, ativo, unimed)

-- Views
gc.vw_uni_resumo_colaborador (view materializada)
gc.vw_uni_dados_contratos (view de contratos)
gc.vw_mcw_processo_log (view de logs)
```

### 3.2 Stored Procedures Principais

```sql
-- Procedure principal de processamento
gc.PKG_UNI_SAUDE.p_uni_resumo(p_mes_ref NUMBER, p_ano_ref NUMBER)

-- Procedure global de fechamento
GC.PGK_GLOBAL.P_MCW_FECHA_COMISSAO_GLOBAL(
    p_codigo VARCHAR2,
    p_mes_ref NUMBER,
    p_ano_ref NUMBER,
    p_previa VARCHAR2,
    p_apaga VARCHAR2,
    p_usuario VARCHAR2,
    p_todas_empresas VARCHAR2,
    p_cod_empresa VARCHAR2,
    p_cod_band VARCHAR2,
    p_tipo_dado VARCHAR2,
    p_categoria VARCHAR2,
    p_cpf VARCHAR2
)
```

---

## 4. ARQUITETURA NESTJS PROPOSTA

### 4.1 Estrutura de Diretórios

```
api-unimed/
├── src/
│   ├── main.ts
│   ├── app.module.ts
│   ├── common/
│   │   ├── decorators/
│   │   ├── filters/
│   │   ├── guards/
│   │   ├── interceptors/
│   │   └── pipes/
│   ├── config/
│   │   ├── database.config.ts
│   │   ├── app.config.ts
│   │   └── unimed-api.config.ts
│   ├── database/
│   │   ├── database.module.ts
│   │   └── database.service.ts
│   ├── modules/
│   │   ├── auth/
│   │   │   ├── auth.module.ts
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.service.ts
│   │   │   └── strategies/
│   │   │       └── jwt.strategy.ts
│   │   ├── unimed/
│   │   │   ├── unimed.module.ts
│   │   │   ├── controllers/
│   │   │   │   ├── unimed.controller.ts
│   │   │   │   ├── unimed-import.controller.ts
│   │   │   │   ├── unimed-colaborador.controller.ts
│   │   │   │   ├── unimed-processo.controller.ts
│   │   │   │   └── unimed-relatorio.controller.ts
│   │   │   ├── services/
│   │   │   │   ├── unimed.service.ts
│   │   │   │   ├── unimed-api.service.ts
│   │   │   │   ├── unimed-soap.service.ts
│   │   │   │   ├── unimed-import.service.ts
│   │   │   │   ├── unimed-colaborador.service.ts
│   │   │   │   ├── unimed-processo.service.ts
│   │   │   │   └── unimed-database.service.ts
│   │   │   ├── dto/
│   │   │   │   ├── import-unimed.dto.ts
│   │   │   │   ├── colaborador.dto.ts
│   │   │   │   ├── processo.dto.ts
│   │   │   │   └── busca-colaborador.dto.ts
│   │   │   ├── entities/
│   │   │   │   ├── uni-dados-cobranca.entity.ts
│   │   │   │   ├── uni-resumo-colaborador.entity.ts
│   │   │   │   └── mcw-processo.entity.ts
│   │   │   └── interfaces/
│   │   │       ├── unimed-api-response.interface.ts
│   │   │       └── processo.interface.ts
│   │   ├── empresa/
│   │   │   ├── empresa.module.ts
│   │   │   ├── empresa.controller.ts
│   │   │   └── empresa.service.ts
│   │   └── relatorios/
│   │       ├── relatorios.module.ts
│   │       ├── relatorios.controller.ts
│   │       └── relatorios.service.ts
│   └── utils/
│       ├── date.util.ts
│       ├── string.util.ts
│       └── oracle.util.ts
├── test/
├── .env
├── .env.example
├── nest-cli.json
├── package.json
└── tsconfig.json
```

### 4.2 Tecnologias e Dependências

```json
{
  "dependencies": {
    "@nestjs/common": "^10.0.0",
    "@nestjs/core": "^10.0.0",
    "@nestjs/platform-express": "^10.0.0",
    "@nestjs/config": "^3.1.1",
    "@nestjs/jwt": "^10.2.0",
    "@nestjs/passport": "^10.0.3",
    "passport": "^0.7.0",
    "passport-jwt": "^4.0.1",
    "oracledb": "^6.3.0",
    "axios": "^1.6.0",
    "soap": "^1.0.0",
    "class-validator": "^0.14.0",
    "class-transformer": "^0.5.1",
    "rxjs": "^7.8.1"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "@types/passport-jwt": "^4.0.0",
    "typescript": "^5.0.0"
  }
}
```

---

## 5. CONFIGURAÇÃO INICIAL DO PROJETO

### 5.1 Estrutura do package.json Atual

O projeto já está criado com NestJS básico. Vamos adicionar as dependências necessárias.

### 5.2 Instalação de Dependências

```bash
# Navegue até o diretório do projeto
cd c:\Users\JOAO-TI-DEV\Documents\api\api-unimed

# Instale as dependências principais
pnpm add @nestjs/config @nestjs/jwt @nestjs/passport passport passport-jwt
pnpm add oracledb axios soap
pnpm add class-validator class-transformer

# Instale as dependências de desenvolvimento
pnpm add -D @types/node @types/passport-jwt @types/soap
```

### 5.3 Configuração do Oracle Client

**⚠️ IMPORTANTE:** O OracleDB requer o Oracle Instant Client instalado no sistema.

**Windows:**

```bash
# 1. Baixar Oracle Instant Client Basic
# Link: https://www.oracle.com/database/technologies/instant-client/winx64-64-downloads.html

# 2. Extrair para: C:\oracle\instantclient_21_12

# 3. Adicionar ao PATH do sistema
# Variável de Ambiente: PATH
# Valor: C:\oracle\instantclient_21_12
```

### 5.4 Variáveis de Ambiente (.env)

```env
# Application
NODE_ENV=development
PORT=3000
API_PREFIX=api/v1

# Oracle Database
DB_USER=seu_usuario
DB_PASSWORD=sua_senha
DB_CONNECT_STRING=localhost:1521/ORCL
DB_POOL_MIN=2
DB_POOL_MAX=10
DB_POOL_INCREMENT=2

# JWT
JWT_SECRET=seu_secret_super_seguro_aqui
JWT_EXPIRATION=24h

# Unimed API (REST)
UNIMED_API_URL=https://ws.unimedcuiaba.coop.br/api
UNIMED_API_USER=cometa
UNIMED_API_PASSWORD=C0m3t42019

# Unimed SOAP (Legado)
UNIMED_SOAP_URL=http://200.167.191.244/wsbhzwebsempre/clientes/servicerelatoriosunimed.asmx?wsdl
UNIMED_SOAP_LOGIN=32950875000140
UNIMED_SOAP_PASSWORD=MzI5NTA4NzUwMDAxNDA=

# Logs
LOG_LEVEL=debug
```

---

## 6. IMPLEMENTAÇÃO PASSO A PASSO

### FASE 1: CONFIGURAÇÃO DA BASE (Dias 1-2)

#### Passo 1.1: Configurar Módulo de Database

**Arquivo:** `src/database/database.service.ts`

```typescript
import {
  Injectable,
  OnModuleDestroy,
  OnModuleInit,
  Logger,
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
      // Configurações do pool de conexões
      this.pool = await oracledb.createPool({
        user: this.configService.get<string>('DB_USER'),
        password: this.configService.get<string>('DB_PASSWORD'),
        connectString: this.configService.get<string>('DB_CONNECT_STRING'),
        poolMin: this.configService.get<number>('DB_POOL_MIN', 2),
        poolMax: this.configService.get<number>('DB_POOL_MAX', 10),
        poolIncrement: this.configService.get<number>('DB_POOL_INCREMENT', 2),
      });

      this.logger.log('✅ Pool de conexões Oracle criado com sucesso');
    } catch (error) {
      this.logger.error('❌ Erro ao criar pool Oracle:', error);
      throw error;
    }
  }

  async onModuleDestroy() {
    try {
      await this.pool.close(10);
      this.logger.log('Pool de conexões Oracle fechado');
    } catch (error) {
      this.logger.error('Erro ao fechar pool:', error);
    }
  }

  /**
   * Executa uma query SELECT
   */
  async executeQuery<T = any>(
    sql: string,
    binds: any[] = [],
    options: oracledb.ExecuteOptions = {},
  ): Promise<T[]> {
    let connection: oracledb.Connection;

    try {
      connection = await this.pool.getConnection();

      const result = await connection.execute(sql, binds, {
        outFormat: oracledb.OUT_FORMAT_OBJECT,
        ...options,
      });

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

  /**
   * Executa múltiplas queries (INSERT/UPDATE/DELETE)
   */
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

  /**
   * Executa uma Stored Procedure PL/SQL
   */
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

  /**
   * Obtém o número de linhas de uma query
   */
  async getRowCount(sql: string, binds: any[] = []): Promise<number> {
    const result = await this.executeQuery(sql, binds);
    return result.length;
  }
}
```

**Arquivo:** `src/database/database.module.ts`

```typescript
import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseService } from './database.service';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [DatabaseService],
  exports: [DatabaseService],
})
export class DatabaseModule {}
```

#### Passo 1.2: Configurar AppModule

**Arquivo:** `src/app.module.ts`

```typescript
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database/database.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    DatabaseModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
```

#### Passo 1.3: Atualizar main.ts

**Arquivo:** `src/main.ts`

```typescript
import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT', 3000);
  const apiPrefix = configService.get<string>('API_PREFIX', 'api/v1');

  // Configurações globais
  app.setGlobalPrefix(apiPrefix);
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // CORS para o frontend futuro
  app.enableCors({
    origin: '*', // Ajustar para produção
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  await app.listen(port);
  logger.log(`🚀 Aplicação rodando em: http://localhost:${port}/${apiPrefix}`);
}

bootstrap();
```

#### Passo 1.4: Criar arquivo .env

Crie o arquivo `.env` na raiz do projeto com as configurações do seu banco Oracle.

---

### FASE 2: MÓDULO UNIMED - ESTRUTURA BASE (Dias 3-4)

#### Passo 2.1: Criar DTOs

**Arquivo:** `src/modules/unimed/dto/busca-colaborador.dto.ts`

```typescript
import { IsString, IsOptional, IsNumberString } from 'class-validator';
import { Transform } from 'class-transformer';

export class BuscaColaboradorDto {
  @IsString()
  @IsOptional()
  busca_empresa?: string;

  @IsString()
  @IsOptional()
  busca_usuario?: string;

  @IsNumberString()
  @IsOptional()
  busca_mes?: string;

  @IsNumberString()
  @IsOptional()
  busca_ano?: string;

  @IsString()
  @IsOptional()
  busca_contrato?: string;

  @IsString()
  @IsOptional()
  departamento?: string;

  @IsString()
  @IsOptional()
  funcao?: string;
}
```

**Arquivo:** `src/modules/unimed/dto/import-unimed.dto.ts`

```typescript
import { IsNumberString, IsNotEmpty } from 'class-validator';

export class ImportUnimedDto {
  @IsNumberString()
  @IsNotEmpty({ message: 'Mês é obrigatório' })
  mes: string;

  @IsNumberString()
  @IsNotEmpty({ message: 'Ano é obrigatório' })
  ano: string;
}
```

**Arquivo:** `src/modules/unimed/dto/update-colaborador.dto.ts`

```typescript
import { IsString, IsNotEmpty, IsIn } from 'class-validator';

export class UpdateColaboradorDto {
  @IsString()
  @IsNotEmpty()
  busca_usuario: string;

  @IsString()
  @IsNotEmpty()
  busca_mes: string;

  @IsString()
  @IsNotEmpty()
  busca_ano: string;

  @IsString()
  @IsIn(['S', 'N'])
  ckeckbox: 'S' | 'N';
}
```

#### Passo 2.2: Criar Entities/Interfaces

**Arquivo:** `src/modules/unimed/entities/uni-dados-cobranca.entity.ts`

```typescript
export interface UniDadosCobranca {
  cod_empresa: number;
  codcoligada: number;
  codfilial: number;
  cod_band: number;
  contrato: string;
  cnpj: string;
  contratante: string;
  nomeplano: string;
  abrangencia: string;
  codfatura: string;
  valorFatura: number;
  periodo: string;
  codtitular: string;
  titular: string;
  cpftitular: string;
  matricula: string;
  acomodacao: string;
  codbeneficiario: string;
  beneficiario: string;
  idade: number;
  nascimento: string;
  inclusao: string;
  dependencia: string;
  cpf: string;
  valor: number;
  descricao: string;
  mes_import: string;
  ano_import: string;
  mes_ref: string;
  ano_ref: string;
  data_import?: Date;
}
```

**Arquivo:** `src/modules/unimed/entities/uni-resumo-colaborador.entity.ts`

```typescript
export interface UniResumoColaborador {
  cod_empresa: number;
  codcoligada: number;
  codfilial: number;
  cod_band: number;
  codigo_cpf: string;
  colaborador: string;
  apelido: string;
  mes_ref: string;
  ano_ref: string;
  m_titular: number;
  m_dependente: number;
  valor_consumo: number;
  perc_empresa: number;
  valor_total: number;
  valor_liquido: number;
  exporta: 'S' | 'N';
  ativo: 'S' | 'N';
}
```

#### Passo 2.3: Interface da API Unimed

**Arquivo:** `src/modules/unimed/interfaces/unimed-api-response.interface.ts`

```typescript
export interface UnimedBeneficiario {
  codbeneficiario: string;
  beneficiario: string;
  idade: number;
  nascimento: string;
  inclusao: string;
  dependencia: string;
  cpf: string;
  valorcobrado: number;
  descricao: string;
  acomodacao: string;
  codtitular: string;
  titular: string;
  cpftitular: string;
  matricula: string;
}

export interface UnimedFatura {
  fatura: UnimedBeneficiario[];
}

export interface UnimedMensalidade {
  contrato: string;
  contratante: string;
  nomeplano: string;
  abrangencia: string;
  codfatura: string;
  valor_fatura: number;
  periodo: string;
  fatura: UnimedFatura;
}

export interface UnimedApiResponse {
  mensalidades: UnimedMensalidade[];
}
```

---

### FASE 3: SERVICES - INTEGRAÇÃO COM API UNIMED (Dias 5-7)

#### Passo 3.1: Service de API REST Unimed

**Arquivo:** `src/modules/unimed/services/unimed-api.service.ts`

```typescript
import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';
import { UnimedApiResponse } from '../interfaces/unimed-api-response.interface';

@Injectable()
export class UnimedApiService {
  private readonly logger = new Logger(UnimedApiService.name);
  private readonly apiClient: AxiosInstance;
  private readonly apiUrl: string;
  private readonly apiUser: string;
  private readonly apiPassword: string;
  private token: string | null = null;

  constructor(private configService: ConfigService) {
    this.apiUrl = this.configService.get<string>('UNIMED_API_URL');
    this.apiUser = this.configService.get<string>('UNIMED_API_USER');
    this.apiPassword = this.configService.get<string>('UNIMED_API_PASSWORD');

    this.apiClient = axios.create({
      baseURL: this.apiUrl,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Gera token de autenticação
   */
  async getToken(): Promise<string> {
    try {
      this.logger.log('Gerando token de autenticação Unimed...');

      const response = await this.apiClient.post(
        '/Token/geratoken',
        {},
        {
          headers: {
            usuario: this.apiUser,
            senha: this.apiPassword,
          },
        },
      );

      this.token = response.data;
      this.logger.log('✅ Token gerado com sucesso');

      return this.token;
    } catch (error) {
      this.logger.error('❌ Erro ao gerar token:', error.message);
      throw new HttpException(
        'Erro ao autenticar com API Unimed',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Busca demonstrativo por período e CNPJ
   */
  async buscarPorPeriodoCnpj(
    periodo: string,
    cnpj: string,
  ): Promise<UnimedApiResponse> {
    try {
      if (!this.token) {
        await this.getToken();
      }

      this.logger.log(`Buscando dados para CNPJ: ${cnpj}, Período: ${periodo}`);

      const response = await this.apiClient.get(
        `/Demonstrativo/buscaporperiodocnpj`,
        {
          params: { periodo, cnpj },
          headers: {
            Authorization: `Bearer ${this.token}`,
          },
        },
      );

      this.logger.log(`✅ Dados obtidos com sucesso para CNPJ: ${cnpj}`);
      return response.data;
    } catch (error) {
      if (error.response?.status === 401) {
        // Token expirado, renovar
        this.token = null;
        return this.buscarPorPeriodoCnpj(periodo, cnpj);
      }

      this.logger.error(`❌ Erro ao buscar por CNPJ: ${error.message}`);
      throw new HttpException(
        `Erro ao buscar dados da Unimed para CNPJ ${cnpj}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Busca demonstrativo por período e Contrato
   */
  async buscarPorPeriodoContrato(
    periodo: string,
    contrato: string,
  ): Promise<UnimedApiResponse> {
    try {
      if (!this.token) {
        await this.getToken();
      }

      this.logger.log(
        `Buscando dados para Contrato: ${contrato}, Período: ${periodo}`,
      );

      const response = await this.apiClient.get(
        `/Demonstrativo/buscaporperiodocontrato`,
        {
          params: { periodo, contrato },
          headers: {
            Authorization: `Bearer ${this.token}`,
          },
        },
      );

      this.logger.log(
        `✅ Dados obtidos com sucesso para Contrato: ${contrato}`,
      );
      return response.data;
    } catch (error) {
      if (error.response?.status === 401) {
        // Token expirado, renovar
        this.token = null;
        return this.buscarPorPeriodoContrato(periodo, contrato);
      }

      this.logger.error(`❌ Erro ao buscar por Contrato: ${error.message}`);
      throw new HttpException(
        `Erro ao buscar dados da Unimed para Contrato ${contrato}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
```

#### Passo 3.2: Service de Importação

**Arquivo:** `src/modules/unimed/services/unimed-import.service.ts`

```typescript
import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from '../../../database/database.service';
import { UnimedApiService } from './unimed-api.service';
import { ImportUnimedDto } from '../dto/import-unimed.dto';
import { UnimedApiResponse } from '../interfaces/unimed-api-response.interface';

@Injectable()
export class UnimedImportService {
  private readonly logger = new Logger(UnimedImportService.name);

  constructor(
    private databaseService: DatabaseService,
    private unimedApiService: UnimedApiService,
  ) {}

  /**
   * Importa dados por CNPJ
   */
  async importarPorCnpj(
    dto: ImportUnimedDto,
  ): Promise<{ result: boolean; msg: string }> {
    const periodo = `${dto.mes.padStart(2, '0')}${dto.ano}`;

    try {
      this.logger.log(`Iniciando importação por CNPJ - Período: ${periodo}`);

      // 1. Buscar empresas que processam Unimed
      const empresas = await this.buscarEmpresasUnimed();

      if (empresas.length === 0) {
        return {
          result: false,
          msg: 'Nenhuma empresa configurada para processar Unimed',
        };
      }

      let totalImportado = 0;

      // 2. Para cada empresa, buscar dados na API
      for (const empresa of empresas) {
        try {
          const dadosUnimed = await this.unimedApiService.buscarPorPeriodoCnpj(
            periodo,
            empresa.CNPJ,
          );

          // 3. Limpar dados antigos da empresa
          await this.limparDadosImportacao(
            empresa.COD_EMPRESA,
            empresa.CODCOLIGADA,
            empresa.CODFILIAL,
            dto.mes,
            dto.ano,
          );

          // 4. Inserir novos dados
          const qtdInserida = await this.inserirDadosCobranca(
            dadosUnimed,
            empresa,
            dto.mes,
            dto.ano,
          );

          totalImportado += qtdInserida;

          this.logger.log(
            `✅ Empresa ${empresa.COD_EMPRESA} - ${qtdInserida} registros importados`,
          );
        } catch (error) {
          this.logger.error(
            `Erro ao processar empresa ${empresa.COD_EMPRESA}: ${error.message}`,
          );
        }
      }

      return {
        result: true,
        msg: `Importação concluída! Total de ${totalImportado} registros importados para ${empresas.length} empresa(s).`,
      };
    } catch (error) {
      this.logger.error(`Erro na importação por CNPJ: ${error.message}`);
      return {
        result: false,
        msg: `Erro ao importar dados: ${error.message}`,
      };
    }
  }

  /**
   * Busca empresas configuradas para processar Unimed
   */
  private async buscarEmpresasUnimed(): Promise<any[]> {
    const sql = `
      SELECT 
        a.cod_empresa,
        a.codcoligada,
        a.codfilial,
        a.cod_band,
        a.cnpj
      FROM gc.empresa_filial a
      WHERE a.processa_unimed = 'S'
      ORDER BY a.cod_band, a.cod_empresa
    `;

    return this.databaseService.executeQuery(sql);
  }

  /**
   * Limpa dados de importação anterior
   */
  private async limparDadosImportacao(
    codEmpresa: number,
    codColigada: number,
    codFilial: number,
    mes: string,
    ano: string,
  ): Promise<void> {
    const sql = `
      DELETE FROM gc.uni_dados_cobranca
      WHERE cod_empresa = :codEmpresa
        AND codcoligada = :codColigada
        AND codfilial = :codFilial
        AND mes_import = :mes
        AND ano_import = :ano
    `;

    const binds = {
      codEmpresa,
      codColigada,
      codFilial,
      mes: mes.padStart(2, '0'),
      ano,
    };

    await this.databaseService.executeQuery(sql, binds);
  }

  /**
   * Insere dados de cobrança no banco
   */
  private async inserirDadosCobranca(
    dadosUnimed: UnimedApiResponse,
    empresa: any,
    mes: string,
    ano: string,
  ): Promise<number> {
    if (!dadosUnimed.mensalidades || dadosUnimed.mensalidades.length === 0) {
      return 0;
    }

    const sql = `
      INSERT INTO gc.UNI_DADOS_COBRANCA (
        cod_empresa, codcoligada, codfilial, cod_band,
        contrato, cnpj, contratante, nomeplano, abrangencia,
        codfatura, valorFatura, periodo,
        codtitular, titular, cpftitular, matricula, acomodacao,
        codbeneficiario, beneficiario, idade, nascimento, inclusao,
        dependencia, cpf, valor, descricao,
        mes_import, ano_import, mes_ref, ano_ref, data_import
      ) VALUES (
        :cod_empresa, :codcoligada, :codfilial, :cod_band,
        :contrato, :cnpj, :contratante, :nomeplano, :abrangencia,
        :codfatura, :valorFatura, :periodo,
        :codtitular, :titular, :cpftitular, :matricula, :acomodacao,
        :codbeneficiario, :beneficiario, :idade, :nascimento, :inclusao,
        :dependencia, :cpf, :valor, :descricao,
        :mes_import, :ano_import, :mes_ref, :ano_ref, SYSDATE
      )
    `;

    const binds = [];
    let count = 0;

    for (const mensalidade of dadosUnimed.mensalidades) {
      if (mensalidade.fatura && mensalidade.fatura.fatura) {
        for (const beneficiario of mensalidade.fatura.fatura) {
          binds.push({
            cod_empresa: empresa.COD_EMPRESA,
            codcoligada: empresa.CODCOLIGADA,
            codfilial: empresa.CODFILIAL,
            cod_band: empresa.COD_BAND,
            contrato: mensalidade.contrato,
            cnpj: empresa.CNPJ,
            contratante: mensalidade.contratante,
            nomeplano: mensalidade.nomeplano,
            abrangencia: mensalidade.abrangencia,
            codfatura: mensalidade.codfatura,
            valorFatura: mensalidade.valor_fatura,
            periodo: mensalidade.periodo,
            codtitular: beneficiario.codtitular,
            titular: beneficiario.titular,
            cpftitular: beneficiario.cpftitular,
            matricula: beneficiario.matricula,
            acomodacao: beneficiario.acomodacao,
            codbeneficiario: beneficiario.codbeneficiario,
            beneficiario: beneficiario.beneficiario,
            idade: beneficiario.idade,
            nascimento: beneficiario.nascimento,
            inclusao: beneficiario.inclusao,
            dependencia: beneficiario.dependencia?.trim(),
            cpf: beneficiario.cpf,
            valor: beneficiario.valorcobrado,
            descricao: this.removerAcentos(beneficiario.descricao),
            mes_import: mes.padStart(2, '0'),
            ano_import: ano,
            mes_ref: this.calcularMesRef(mensalidade.periodo),
            ano_ref: this.calcularAnoRef(mensalidade.periodo),
          });
          count++;
        }
      }
    }

    if (binds.length > 0) {
      await this.databaseService.executeMany(sql, binds);
    }

    return count;
  }

  /**
   * Calcula mês de referência (mês anterior ao período)
   */
  private calcularMesRef(periodo: string): string {
    // Formato: MM-YYYY
    const [mes] = periodo.split('-');
    const mesNum = parseInt(mes, 10) - 1;
    return mesNum === 0 ? '12' : mesNum.toString().padStart(2, '0');
  }

  /**
   * Calcula ano de referência
   */
  private calcularAnoRef(periodo: string): string {
    const [mes, ano] = periodo.split('-');
    const mesNum = parseInt(mes, 10);
    return mesNum === 1 ? (parseInt(ano) - 1).toString() : ano;
  }

  /**
   * Remove acentos de uma string
   */
  private removerAcentos(str: string): string {
    const acentos = {
      À: 'A',
      Á: 'A',
      Â: 'A',
      Ã: 'A',
      Ä: 'A',
      Å: 'A',
      à: 'a',
      á: 'a',
      â: 'a',
      ã: 'a',
      ä: 'a',
      å: 'a',
      È: 'E',
      É: 'E',
      Ê: 'E',
      Ë: 'E',
      è: 'e',
      é: 'e',
      ê: 'e',
      ë: 'e',
      Ì: 'I',
      Í: 'I',
      Î: 'I',
      Ï: 'I',
      ì: 'i',
      í: 'i',
      î: 'i',
      ï: 'i',
      Ò: 'O',
      Ó: 'O',
      Ô: 'O',
      Õ: 'O',
      Ö: 'O',
      ò: 'o',
      ó: 'o',
      ô: 'o',
      õ: 'o',
      ö: 'o',
      Ù: 'U',
      Ú: 'U',
      Û: 'U',
      Ü: 'U',
      ù: 'u',
      ú: 'u',
      û: 'u',
      ü: 'u',
      Ç: 'C',
      ç: 'c',
      Ñ: 'N',
      ñ: 'n',
    };

    return str
      .replace(/[À-ÿ]/g, (match) => acentos[match] || match)
      .toUpperCase();
  }

  /**
   * Executa procedure de resumo
   */
  async executarResumo(
    dto: ImportUnimedDto,
  ): Promise<{ result: boolean; msg: string }> {
    try {
      const plsql = `
        BEGIN
          gc.PKG_UNI_SAUDE.p_uni_resumo(:mes_ref, :ano_ref);
        END;
      `;

      const binds = {
        mes_ref: parseInt(dto.mes, 10),
        ano_ref: parseInt(dto.ano, 10),
      };

      await this.databaseService.executeProcedure(plsql, binds);

      return {
        result: true,
        msg: 'Resumo de dados executado com sucesso!',
      };
    } catch (error) {
      this.logger.error(`Erro ao executar resumo: ${error.message}`);
      return {
        result: false,
        msg: `Erro ao executar resumo: ${error.message}`,
      };
    }
  }
}
```

---

## 7. CHECKLIST DE FUNCIONALIDADES

### ✅ Módulos Principais

- [ ] **Módulo de Database** - Conexão Oracle sem ORM
- [ ] **Módulo de Autenticação** - JWT
- [ ] **Módulo Unimed** - Funcionalidades principais
- [ ] **Módulo de Empresas** - Gerenciamento de empresas
- [ ] **Módulo de Relatórios** - Geração de relatórios

### ✅ Funcionalidades de Importação

- [ ] Importar dados por CNPJ (API REST)
- [ ] Importar dados por Contrato (API REST)
- [ ] Importar dados via SOAP (legado)
- [ ] Gerenciamento de token da API
- [ ] Limpar dados antes de importar
- [ ] Validação de período

### ✅ Funcionalidades de Colaboradores

- [ ] Listar colaboradores (DataTables)
- [ ] Buscar colaborador específico
- [ ] Atualizar flag de exportação (individual)
- [ ] Atualizar todos colaboradores (massa)
- [ ] Atualizar valor pago pela empresa

### ✅ Funcionalidades de Processos

- [ ] Listar processos disponíveis
- [ ] Executar processos de fechamento
- [ ] Verificar histórico de processos
- [ ] Validar período de fechamento
- [ ] Exportar para Totvs/RM

### ✅ Relatórios

- [ ] Relatório por colaborador
- [ ] Relatório por empresa
- [ ] Relatório de pagamentos
- [ ] Relatório de não lançamentos
- [ ] Resumo por departamento
- [ ] Resumo por centro de custo
- [ ] Dados para DIRF

---

## 📝 PRÓXIMOS PASSOS

Este guia cobre a base do projeto. Continue com:

1. **Dias 8-10**: Implementar Services de Colaboradores e Processos
2. **Dias 11-12**: Criar Controllers e Rotas
3. **Dias 13-14**: Implementar autenticação JWT
4. **Dias 15-16**: Testes e ajustes
5. **Dia 17**: Documentação da API (Swagger)
6. **Dia 18+**: Deploy e homologação

---

## ⚠️ OBSERVAÇÕES IMPORTANTES

1. **Sem ORM**: Utilizamos queries SQL diretas conforme solicitado
2. **Procedures**: Mantidas no banco, chamadas via `executeProcedure`
3. **Transações**: Gerenciadas manualmente quando necessário
4. **Logs**: Logger do NestJS para rastreabilidade
5. **Validação**: Class-validator nos DTOs
6. **Erros**: HttpException padronizado

---

**Este é um guia vivo. Atualize conforme avança na implementação! 🚀**
