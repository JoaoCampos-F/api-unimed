# EXEMPLO PRÁTICO - PRIMEIROS PASSOS

## 🎯 Objetivo

Implementar e testar a primeira funcionalidade: **Importação de Dados por CNPJ**

## ⏱️ Tempo Estimado: 4-6 horas

---

## PASSO 1: Preparar Ambiente (30 minutos)

### 1.1 Instalar Dependências

```bash
cd c:\Users\JOAO-TI-DEV\Documents\api\api-unimed

# Instalar pacotes principais
pnpm add @nestjs/config @nestjs/jwt @nestjs/passport passport passport-jwt
pnpm add oracledb axios soap
pnpm add class-validator class-transformer

# Instalar types
pnpm add -D @types/node @types/passport-jwt @types/soap
```

### 1.2 Configurar Oracle Client

**⚠️ IMPORTANTE:** Baixe e instale o Oracle Instant Client antes de continuar

1. Acesse: https://www.oracle.com/database/technologies/instant-client/winx64-64-downloads.html
2. Baixe "Basic Package"
3. Extraia para: `C:\oracle\instantclient_21_12`
4. Adicione ao PATH do Windows:
   - Clique com botão direito em "Este Computador" → Propriedades
   - Configurações Avançadas do Sistema
   - Variáveis de Ambiente
   - Na seção "Variáveis do Sistema", edite "Path"
   - Adicione: `C:\oracle\instantclient_21_12`
   - Clique OK em tudo

5. **REINICIE o terminal** para aplicar mudanças

### 1.3 Criar arquivo .env

Crie o arquivo `.env` na raiz do projeto:

```env
# Application
NODE_ENV=development
PORT=3000
API_PREFIX=api/v1

# Oracle Database (SUBSTITUA PELOS SEUS DADOS)
DB_USER=seu_usuario_oracle
DB_PASSWORD=sua_senha_oracle
DB_CONNECT_STRING=seu_host:1521/seu_service_name
DB_POOL_MIN=2
DB_POOL_MAX=10
DB_POOL_INCREMENT=2

# JWT
JWT_SECRET=meu_secret_super_seguro_12345
JWT_EXPIRATION=24h

# Unimed API (REST)
UNIMED_API_URL=https://ws.unimedcuiaba.coop.br/api
UNIMED_API_USER=cometa
UNIMED_API_PASSWORD=C0m3t42019

# Logs
LOG_LEVEL=debug
```

---

## PASSO 2: Criar Estrutura Base (1 hora)

### 2.1 Criar diretórios

```bash
# No terminal do VSCode
mkdir -p src/database
mkdir -p src/config
mkdir -p src/modules/unimed/controllers
mkdir -p src/modules/unimed/services
mkdir -p src/modules/unimed/dto
mkdir -p src/modules/unimed/entities
mkdir -p src/modules/unimed/interfaces
```

### 2.2 Criar DatabaseService

Crie o arquivo: `src/database/database.service.ts`

Copie o código do GUIA_IMPLEMENTACAO_COMPLETO.md (seção Passo 1.1)

### 2.3 Criar DatabaseModule

Crie o arquivo: `src/database/database.module.ts`

Copie o código do GUIA_IMPLEMENTACAO_COMPLETO.md (seção Passo 1.1)

### 2.4 Atualizar AppModule

Edite: `src/app.module.ts`

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

### 2.5 Atualizar main.ts

Edite: `src/main.ts`

Copie o código do GUIA_IMPLEMENTACAO_COMPLETO.md (seção Passo 1.3)

---

## PASSO 3: Testar Conexão com Banco (30 minutos)

### 3.1 Criar endpoint de teste

Edite `src/app.controller.ts`:

```typescript
import { Controller, Get } from '@nestjs/common';
import { DatabaseService } from './database/database.service';

@Controller()
export class AppController {
  constructor(private readonly databaseService: DatabaseService) {}

  @Get('health')
  async health() {
    try {
      const result = await this.databaseService.executeQuery(
        'SELECT 1 as test FROM DUAL',
      );
      return {
        status: 'OK',
        database: 'Connected',
        result,
      };
    } catch (error) {
      return {
        status: 'ERROR',
        database: 'Disconnected',
        error: error.message,
      };
    }
  }

  @Get('test-empresas')
  async testEmpresas() {
    try {
      const sql = `
        SELECT 
          cod_empresa,
          codcoligada,
          codfilial,
          sigla,
          cnpj,
          processa_unimed
        FROM gc.empresa_filial
        WHERE processa_unimed = 'S'
        AND ROWNUM <= 5
      `;

      const empresas = await this.databaseService.executeQuery(sql);

      return {
        status: 'OK',
        total: empresas.length,
        empresas,
      };
    } catch (error) {
      return {
        status: 'ERROR',
        error: error.message,
      };
    }
  }
}
```

### 3.2 Testar a aplicação

```bash
# Iniciar servidor
pnpm start:dev

# Aguarde mensagem:
# 🚀 Aplicação rodando em: http://localhost:3000/api/v1
```

### 3.3 Testar endpoints

Abra o navegador ou use o Thunder Client (extensão VSCode):

```
GET http://localhost:3000/api/v1/health
```

**Resposta esperada:**

```json
{
  "status": "OK",
  "database": "Connected",
  "result": [
    {
      "TEST": 1
    }
  ]
}
```

```
GET http://localhost:3000/api/v1/test-empresas
```

**Resposta esperada:**

```json
{
  "status": "OK",
  "total": 2,
  "empresas": [
    {
      "COD_EMPRESA": 1,
      "CODCOLIGADA": 1,
      "CODFILIAL": 1,
      "SIGLA": "CML",
      "CNPJ": "12345678000190",
      "PROCESSA_UNIMED": "S"
    }
  ]
}
```

✅ **Se chegou aqui, sua base está funcionando!**

---

## PASSO 4: Implementar Módulo Unimed (2-3 horas)

### 4.1 Criar DTOs

**Arquivo:** `src/modules/unimed/dto/import-unimed.dto.ts`

```typescript
import { IsNumberString, IsNotEmpty, Length } from 'class-validator';

export class ImportUnimedDto {
  @IsNumberString({}, { message: 'Mês deve ser um número' })
  @IsNotEmpty({ message: 'Mês é obrigatório' })
  @Length(1, 2, { message: 'Mês deve ter 1 ou 2 dígitos' })
  mes: string;

  @IsNumberString({}, { message: 'Ano deve ser um número' })
  @IsNotEmpty({ message: 'Ano é obrigatório' })
  @Length(4, 4, { message: 'Ano deve ter 4 dígitos' })
  ano: string;
}
```

### 4.2 Criar Interface da API

**Arquivo:** `src/modules/unimed/interfaces/unimed-api-response.interface.ts`

Copie o código do GUIA_IMPLEMENTACAO_COMPLETO.md (seção Passo 2.3)

### 4.3 Criar UnimedApiService

**Arquivo:** `src/modules/unimed/services/unimed-api.service.ts`

Copie o código do GUIA_IMPLEMENTACAO_COMPLETO.md (seção Passo 3.1)

### 4.4 Criar UnimedImportService (versão simplificada)

**Arquivo:** `src/modules/unimed/services/unimed-import.service.ts`

```typescript
import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from '../../../database/database.service';
import { UnimedApiService } from './unimed-api.service';
import { ImportUnimedDto } from '../dto/import-unimed.dto';

@Injectable()
export class UnimedImportService {
  private readonly logger = new Logger(UnimedImportService.name);

  constructor(
    private databaseService: DatabaseService,
    private unimedApiService: UnimedApiService,
  ) {}

  /**
   * Importa dados por CNPJ - VERSÃO SIMPLIFICADA PARA TESTE
   */
  async importarPorCnpj(dto: ImportUnimedDto) {
    const periodo = `${dto.mes.padStart(2, '0')}${dto.ano}`;

    try {
      this.logger.log(`🔄 Iniciando importação - Período: ${periodo}`);

      // 1. Buscar empresas
      const empresas = await this.buscarEmpresasUnimed();

      if (empresas.length === 0) {
        return {
          result: false,
          msg: 'Nenhuma empresa configurada',
        };
      }

      this.logger.log(`✅ ${empresas.length} empresa(s) encontrada(s)`);

      // 2. Processar primeira empresa (TESTE)
      const empresa = empresas[0];
      this.logger.log(
        `🏢 Processando: ${empresa.SIGLA} - CNPJ: ${empresa.CNPJ}`,
      );

      // 3. Buscar dados na API Unimed
      const dadosUnimed = await this.unimedApiService.buscarPorPeriodoCnpj(
        periodo,
        empresa.CNPJ,
      );

      // 4. Contar registros
      let totalRegistros = 0;
      if (dadosUnimed.mensalidades) {
        dadosUnimed.mensalidades.forEach((m) => {
          if (m.fatura?.fatura) {
            totalRegistros += m.fatura.fatura.length;
          }
        });
      }

      this.logger.log(`📊 ${totalRegistros} registros obtidos da API`);

      return {
        result: true,
        msg: `Teste OK! ${totalRegistros} registros encontrados.`,
        data: {
          empresa: empresa.SIGLA,
          cnpj: empresa.CNPJ,
          periodo,
          registros: totalRegistros,
          mensalidades: dadosUnimed.mensalidades?.length || 0,
        },
      };
    } catch (error) {
      this.logger.error(`❌ Erro: ${error.message}`);
      return {
        result: false,
        msg: `Erro: ${error.message}`,
      };
    }
  }

  /**
   * Busca empresas configuradas
   */
  private async buscarEmpresasUnimed(): Promise<any[]> {
    const sql = `
      SELECT 
        a.cod_empresa,
        a.codcoligada,
        a.codfilial,
        a.cod_band,
        a.sigla,
        a.cnpj
      FROM gc.empresa_filial a
      WHERE a.processa_unimed = 'S'
      ORDER BY a.cod_empresa
    `;

    return this.databaseService.executeQuery(sql);
  }
}
```

### 4.5 Criar Controller

**Arquivo:** `src/modules/unimed/controllers/unimed-import.controller.ts`

```typescript
import { Controller, Post, Body } from '@nestjs/common';
import { UnimedImportService } from '../services/unimed-import.service';
import { ImportUnimedDto } from '../dto/import-unimed.dto';

@Controller('unimed/import')
export class UnimedImportController {
  constructor(private readonly importService: UnimedImportService) {}

  @Post('cnpj')
  async importarPorCnpj(@Body() dto: ImportUnimedDto) {
    return this.importService.importarPorCnpj(dto);
  }
}
```

### 4.6 Criar UnimedModule

**Arquivo:** `src/modules/unimed/unimed.module.ts`

```typescript
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { UnimedImportController } from './controllers/unimed-import.controller';
import { UnimedApiService } from './services/unimed-api.service';
import { UnimedImportService } from './services/unimed-import.service';

@Module({
  imports: [ConfigModule],
  controllers: [UnimedImportController],
  providers: [UnimedApiService, UnimedImportService],
  exports: [UnimedApiService, UnimedImportService],
})
export class UnimedModule {}
```

### 4.7 Registrar no AppModule

Edite `src/app.module.ts`:

```typescript
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database/database.module';
import { UnimedModule } from './modules/unimed/unimed.module'; // ← ADICIONAR

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    DatabaseModule,
    UnimedModule, // ← ADICIONAR
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
```

---

## PASSO 5: Testar Importação (30 minutos)

### 5.1 Reiniciar servidor

```bash
# Ctrl+C para parar
pnpm start:dev
```

### 5.2 Testar endpoint de importação

**Usando Thunder Client (extensão VSCode):**

```
POST http://localhost:3000/api/v1/unimed/import/cnpj
Content-Type: application/json

{
  "mes": "12",
  "ano": "2024"
}
```

**Ou usando cURL:**

```bash
curl -X POST http://localhost:3000/api/v1/unimed/import/cnpj \
  -H "Content-Type: application/json" \
  -d "{\"mes\":\"12\",\"ano\":\"2024\"}"
```

### 5.3 Verificar logs

No terminal, você deve ver:

```
[UnimedImportService] 🔄 Iniciando importação - Período: 122024
[UnimedImportService] ✅ 2 empresa(s) encontrada(s)
[UnimedImportService] 🏢 Processando: CML - CNPJ: 12345678000190
[UnimedApiService] Gerando token de autenticação Unimed...
[UnimedApiService] ✅ Token gerado com sucesso
[UnimedApiService] Buscando dados para CNPJ: 12345678000190, Período: 122024
[UnimedApiService] ✅ Dados obtidos com sucesso para CNPJ: 12345678000190
[UnimedImportService] 📊 45 registros obtidos da API
```

### 5.4 Resposta esperada

```json
{
  "result": true,
  "msg": "Teste OK! 45 registros encontrados.",
  "data": {
    "empresa": "CML",
    "cnpj": "12345678000190",
    "periodo": "122024",
    "registros": 45,
    "mensalidades": 5
  }
}
```

---

## ✅ CHECKPOINT 1 CONCLUÍDO!

Parabéns! Você:

1. ✅ Configurou o ambiente NestJS
2. ✅ Conectou com Oracle sem ORM
3. ✅ Criou estrutura de módulos
4. ✅ Integrou com API Unimed
5. ✅ Testou a primeira funcionalidade

---

## 🎯 PRÓXIMOS PASSOS

### Opção A: Continuar com Importação Completa

- Implementar inserção no banco (versão completa do ImportService)
- Adicionar importação por Contrato
- Adicionar execução da procedure de resumo

### Opção B: Implementar Consulta de Colaboradores

- Criar serviço de busca
- Implementar filtros
- Formatar resposta para DataTables

### Opção C: Implementar Atualização de Colaboradores

- Criar endpoints de update
- Validar permissões
- Registrar logs

---

## 🐛 TROUBLESHOOTING

### Erro: ORA-12154 TNS:could not resolve

**Solução:** Verifique o `DB_CONNECT_STRING` no `.env`

### Erro: DPI-1047: Cannot locate Oracle Client

**Solução:** Instale Oracle Instant Client e adicione ao PATH

### Erro: 401 Unauthorized (API Unimed)

**Solução:** Verifique credenciais no `.env`

### Servidor não inicia

**Solução:**

```bash
pnpm install
rm -rf dist
pnpm start:dev
```

---

## 📞 SUPORTE

Se encontrar problemas:

1. Verifique os logs no terminal
2. Consulte o GUIA_IMPLEMENTACAO_COMPLETO.md
3. Revise as configurações do .env
4. Teste a conexão com o banco separadamente

---

**Pronto para o próximo passo? Continue com a implementação completa! 🚀**
