# 📋 Pendências do Módulo de Importação

**Data:** 21 de Janeiro de 2026  
**Versão:** 1.0  
**Status Atual:** 75% completo (funcional em ambiente de teste)

---

## ✅ O QUE JÁ ESTÁ FUNCIONANDO

### 1. **Endpoints Implementados (4/4 essenciais)**

- ✅ `GET /importacao/dados-periodo-cnpj` - Importação por CNPJ
- ✅ `GET /importacao/dados-periodo-contrato` - Importação por Contrato
- ✅ `GET /importacao/empresas-unimed` - Listar empresas ativas
- ✅ `GET /importacao/executar-resumo` - Executar resumo (stored procedure)

### 2. **Arquitetura Clean Architecture**

- ✅ Use Cases implementados e testados manualmente
- ✅ Repositories funcionando (unimed-cobranca.repository.ts é o único ativo)
- ✅ Entities e Value Objects criados
- ✅ DTOs com validações básicas
- ✅ Factory Pattern (BeneficiarioFactory)

### 3. **Integração com API Externa**

- ✅ UnimedApiService conectando com sucesso
- ✅ Token JWT refresh automático em 401
- ✅ Tratamento de erros por empresa (não para tudo se uma falhar)
- ✅ Timeout de 30 segundos configurado

### 4. **Operações de Banco de Dados**

- ✅ Limpeza de dados antigos antes de importar (DELETE CASCADE)
- ✅ Batch insert performático (INSERT ALL ... SELECT 1 FROM DUAL)
- ✅ Stored Procedure P_UNI_INSERT_EXTRATO funcionando
- ✅ Cálculo de MES_REF e ANO_REF correto

---

## ⚠️ O QUE FALTA PARA PRODUÇÃO (4-6 dias)

### 🔴 CRÍTICO - Obrigatório antes de deploy

#### 1. **Remover Hardcodes de Teste**

**Tempo estimado:** 1-2 horas

**Arquivos afetados:**

- [src/infrastructure/repositories/empresa.repository.ts](src/infrastructure/repositories/empresa.repository.ts#L39)
- [src/infrastructure/external-apis/unimed-api.service.ts](src/infrastructure/external-apis/unimed-api.service.ts)

**O que fazer:**

**a) CNPJ Hardcoded (empresa.repository.ts linha 39)**

```typescript
// ❌ REMOVER ESTA LINHA
AND ef.CNPJ='28941028000142'

// ✅ DEIXAR APENAS
WHERE ef.processa_unimed = 'S'
```

**b) Token Hardcoded (unimed-api.service.ts)**

```typescript
// ❌ ATUAL - Token fixo
private token = 'eyJ0eXAiOiJKV1QiLCJhbGc...';

// ✅ IMPLEMENTAR - Token do banco de dados
private async getTokenFromDatabase(): Promise<string> {
  const query = `
    SELECT senha
    FROM gc.api_gc_servicos
    WHERE nome = 'UNIMED_API'
    AND ativo = 'S'
  `;
  const result = await this.databaseService.execute(query);
  return result[0]?.SENHA;
}

// Usar no ensureValidToken()
private async ensureValidToken(): Promise<void> {
  if (!this.token || this.isTokenExpired()) {
    this.token = await this.getTokenFromDatabase();
  }
}
```

**Por que?**

- Token hardcoded vai expirar e quebrar o sistema
- CNPJ hardcoded impede outras empresas de importar dados

---

#### 2. **Ativar Validações de Data Comentadas**

**Tempo estimado:** 30 minutos

**Arquivo:** [src/application/factories/beneficiario.factory.ts](src/application/factories/beneficiario.factory.ts#L45-L52)

**Problema identificado:**

```typescript
// ❌ CÓDIGO COMENTADO (linhas 45-52)
/*
if (!this.isValidDate(dto.dataInclusao)) {
  throw new BadRequestException(`Data inclusão inválida: ${dto.dataInclusao}`);
}
if (!this.isValidDate(dto.dataExclusao)) {
  throw new BadRequestException(`Data exclusão inválida: ${dto.dataExclusao}`);
}
*/
```

**Ação necessária:**

1. Descomentar validações de data
2. Testar com dados reais da API para garantir que formatos estão corretos
3. Ajustar `isValidDate()` se necessário para aceitar formatos da Unimed API

**Por que?**

- Datas inválidas podem causar erros silenciosos no banco Oracle
- Melhor falhar rápido com erro claro do que inserir lixo

---

#### 3. **Fortalecer DTOs com Validações Numéricas**

**Tempo estimado:** 1 hora

**Arquivo:** [src/application/dtos/importar-dados-unimed.dto.ts](src/application/dtos/importar-dados-unimed.dto.ts)

**Status atual:**

```typescript
export class ImportarDadosUnimedDto {
  @IsNumberString() // ✅ OK mas pode melhorar
  @IsNotEmpty()
  @Matches(/^(0[1-9]|1[0-2])$/)
  mes: string;

  @IsNumberString() // ✅ OK mas pode melhorar
  @IsNotEmpty()
  @Matches(/^(202[0-9]|203[0-9])$/)
  ano: string;
}
```

**Melhorias sugeridas:**

```typescript
import { IsInt, Min, Max } from 'class-validator';

export class ImportarDadosUnimedDto {
  @IsInt({ message: 'Mês deve ser um número inteiro' })
  @Min(1, { message: 'Mês deve ser no mínimo 1' })
  @Max(12, { message: 'Mês deve ser no máximo 12' })
  @Transform(({ value }) => parseInt(value, 10))
  mes: number;

  @IsInt({ message: 'Ano deve ser um número inteiro' })
  @Min(2020, { message: 'Ano deve ser no mínimo 2020' })
  @Max(2039, { message: 'Ano deve ser no máximo 2039' })
  @Transform(({ value }) => parseInt(value, 10))
  ano: number;
}
```

**Por que?**

- Validações mais fortes previnem erros de tipo no controller
- Melhor mensagens de erro para usuários/outros desenvolvedores

---

#### 4. **Documentação OpenAPI/Swagger**

**Tempo estimado:** 2-3 horas

**O que fazer:**

**a) Instalar dependência:**

```bash
pnpm add @nestjs/swagger swagger-ui-express
```

**b) Configurar em [src/main.ts](src/main.ts):**

```typescript
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Configuração Swagger
  const config = new DocumentBuilder()
    .setTitle('API Unimed - NPD')
    .setDescription('API para importação e gestão de dados Unimed')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  await app.listen(3000);
}
```

**c) Decorar controller [src/presentation/controllers/importacao.controller.ts](src/presentation/controllers/importacao.controller.ts):**

```typescript
import { ApiTags, ApiOperation, ApiQuery, ApiResponse } from '@nestjs/swagger';

@ApiTags('Importação Unimed')
@Controller('importacao')
export class ImportacaoController {
  @Get('dados-periodo-cnpj')
  @ApiOperation({ summary: 'Importar dados por período e CNPJ' })
  @ApiQuery({ name: 'mes', example: '01', description: 'Mês (01-12)' })
  @ApiQuery({ name: 'ano', example: '2026', description: 'Ano (2020-2039)' })
  @ApiResponse({ status: 200, description: 'Importação realizada com sucesso' })
  @ApiResponse({ status: 500, description: 'Erro na importação' })
  async importarDadosPeriodo(@Query() params: ImportarDadosUnimedDto) {
    // ... código existente
  }
}
```

**d) Decorar DTOs:**

```typescript
import { ApiProperty } from '@nestjs/swagger';

export class ImportarDadosUnimedDto {
  @ApiProperty({ example: '01', description: 'Mês (01-12)' })
  @IsNumberString()
  mes: string;

  @ApiProperty({ example: '2026', description: 'Ano (2020-2039)' })
  @IsNumberString()
  ano: string;
}
```

**Por que?**

- Documentação automática acessível em http://localhost:3000/api
- Facilita integração de frontend/mobile
- Permite testar endpoints diretamente no navegador

---

### 🟡 IMPORTANTE - Recomendado mas não bloqueante

#### 5. **Suporte a Transações**

**Tempo estimado:** 2-3 horas

**Problema:** Se importação falhar no meio (ex: API cai após limpar dados mas antes de inserir), dados antigos foram deletados e não foram substituídos.

**Solução:**

```typescript
// Em importar-dados-unimed.use-case.ts
import { DataSource } from 'typeorm'; // Se usar TypeORM
// OU usar transações do oracledb diretamente

async execute(request: ImportarDadosUnimedRequest): Promise<any> {
  const connection = await this.dataSource.createQueryRunner();
  await connection.startTransaction();

  try {
    // 1. Limpar dados antigos
    await connection.query('DELETE FROM uni_dados_cobranca WHERE ...');

    // 2. Buscar da API
    const dadosApi = await this.unimedApiService.buscar(...);

    // 3. Inserir novos dados
    await connection.query('INSERT ALL ...');

    // ✅ Tudo OK - commita
    await connection.commitTransaction();

  } catch (error) {
    // ❌ Erro - rollback
    await connection.rollbackTransaction();
    throw error;
  } finally {
    await connection.release();
  }
}
```

**Por que?**

- Garante atomicidade: ou importa tudo ou nada
- Evita perda de dados em caso de falha

---

#### 6. **Logging Estruturado**

**Tempo estimado:** 1 hora

**Status atual:** Logs básicos com `Logger` do NestJS (OK mas pode melhorar)

**Melhoria sugerida:**

```typescript
// Adicionar logs detalhados em pontos críticos
this.logger.log(`[IMPORTAÇÃO] Iniciando para período ${mes}/${ano}`);
this.logger.log(`[IMPORTAÇÃO] Encontradas ${empresas.length} empresas ativas`);
this.logger.log(
  `[IMPORTAÇÃO] Empresa ${cnpj}: ${beneficiarios.length} beneficiários`,
);
this.logger.warn(`[IMPORTAÇÃO] Empresa ${cnpj} falhou: ${error.message}`);
this.logger.error(`[IMPORTAÇÃO] Erro crítico: ${error.stack}`);
```

**Por que?**

- Facilita debug em produção
- Auditoria de importações
- Monitoramento de performance

---

#### 7. **Rate Limiting para API Externa**

**Tempo estimado:** 1 hora

**Problema:** API Unimed pode ter limite de requests por minuto. Se importar 50 empresas simultaneamente, pode ser bloqueado.

**Solução:**

```typescript
// Em unimed-api.service.ts
import pLimit from 'p-limit';

private limit = pLimit(5); // Máximo 5 requisições simultâneas

async buscarMultiplasEmpresas(empresas: Empresa[]): Promise<any[]> {
  const promises = empresas.map(empresa =>
    this.limit(() => this.buscarPorPeriodoCnpj(empresa.cnpj, mes, ano))
  );
  return Promise.all(promises);
}
```

**Instalar:**

```bash
pnpm add p-limit
pnpm add -D @types/p-limit
```

**Por que?**

- Evita bloqueio por rate limit da API Unimed
- Controla carga no servidor

---

## 📊 RESUMO EXECUTIVO

| Item                      | Status      | Tempo  | Prioridade    |
| ------------------------- | ----------- | ------ | ------------- |
| Remover CNPJ hardcode     | ⚠️ Pendente | 30 min | 🔴 Crítico    |
| Token do banco de dados   | ⚠️ Pendente | 1-2h   | 🔴 Crítico    |
| Ativar validações de data | ⚠️ Pendente | 30 min | 🔴 Crítico    |
| Melhorar DTOs             | ⚠️ Pendente | 1h     | 🔴 Crítico    |
| Swagger/OpenAPI           | ⚠️ Pendente | 2-3h   | 🔴 Crítico    |
| Suporte a transações      | ⚠️ Pendente | 2-3h   | 🟡 Importante |
| Logging estruturado       | ⚠️ Pendente | 1h     | 🟡 Importante |
| Rate limiting             | ⚠️ Pendente | 1h     | 🟡 Importante |

**Total Crítico:** ~4-6 horas (1 dia de trabalho)  
**Total Importante:** ~4-5 horas (meio dia)  
**Total Geral:** ~8-11 horas (1.5 dias)

---

## 🎯 RECOMENDAÇÃO FINAL

### ✅ PODE SEGUIR PARA OUTROS MÓDULOS SE:

1. **Você está OK em continuar com token/CNPJ hardcoded temporariamente** ✅
2. **Vai fazer as correções críticas depois (antes de produção)** ✅
3. **Precisa demonstrar progresso em outros módulos primeiro** ✅

### ⚠️ DEVE TERMINAR IMPORTAÇÃO SE:

1. **Vai colocar em produção em breve (< 2 semanas)** ❌
2. **Outros desenvolvedores vão usar esses endpoints** ❌
3. **Cliente vai testar com dados reais de múltiplas empresas** ❌

---

## 🚀 PRÓXIMOS MÓDULOS (SE DECIDIR SEGUIR EM FRENTE)

### Prioridade Sugerida:

1. **Módulo Colaboradores** (5 dias)
   - ✅ É bloqueio para fechamento de comissão
   - Endpoints: buscar, atualizar individual, atualizar todos, atualizar valor empresa
   - Usa dados importados (depende de importação estar funcionando)

2. **Sistema de Processos** (3-4 dias)
   - ✅ Integra com stored procedure crítica
   - Endpoints: listar processos, executar, histórico
   - Orquestra importação + colaboradores + exportação

3. **Exportação TOTVS** (2-3 dias)
   - Integração com ERP
   - Depende de colaboradores e processos

4. **Relatórios PDF** (2-3 dias - pode postergar)
   - Menos crítico, pode ser último

---

## 📝 NOTAS TÉCNICAS

### Arquivos que precisam ser modificados (críticos):

1. [src/infrastructure/repositories/empresa.repository.ts](src/infrastructure/repositories/empresa.repository.ts#L39) - Remover CNPJ hardcode
2. [src/infrastructure/external-apis/unimed-api.service.ts](src/infrastructure/external-apis/unimed-api.service.ts) - Token do banco
3. [src/application/factories/beneficiario.factory.ts](src/application/factories/beneficiario.factory.ts#L45-L52) - Descomentar validações
4. [src/application/dtos/importar-dados-unimed.dto.ts](src/application/dtos/importar-dados-unimed.dto.ts) - Melhorar validações
5. [src/main.ts](src/main.ts) - Configurar Swagger
6. [src/presentation/controllers/importacao.controller.ts](src/presentation/controllers/importacao.controller.ts) - Decorators Swagger

### Comandos úteis para testar:

```bash
# Testar importação por CNPJ
curl "http://localhost:3000/importacao/dados-periodo-cnpj?mes=01&ano=2026"

# Testar importação por contrato
curl "http://localhost:3000/importacao/dados-periodo-contrato?mes=01&ano=2026"

# Testar resumo
curl "http://localhost:3000/importacao/executar-resumo?mes=01&ano=2026"

# Listar empresas
curl "http://localhost:3000/importacao/empresas-unimed"
```

---

**Última atualização:** 21/01/2026  
**Responsável:** Análise técnica automatizada  
**Próxima revisão:** Após implementação de melhorias críticas
