# Análise de Problemas Arquiteturais - API Unimed

## 📋 Resumo Executivo

**Data da Análise**: 04/02/2026  
**Contexto**: Adição de endpoints de listagem (empresas, contratos, colaboradores, processos) para alimentar formulários do frontend.

**Problema Identificado**: Violação dos princípios de Separação de Responsabilidades (SRP) e Coesão. As listagens genéricas foram incorretamente acopladas ao módulo de Importação.

---

## 🔴 Problemas Críticos Identificados

### 1. **Acoplamento Incorreto no ImportacaoController**

**Arquivo**: `src/presentation/controllers/importacao.controller.ts`

**Problema**:

```typescript
@Controller('importacao')
export class ImportacaoController {
  constructor(
    // ✅ Dependências CORRETAS (relacionadas à importação)
    private readonly importarDadosUnimedUseCase: ImportarDadosUnimedUseCase,
    private readonly executarResumoUnimedUseCase: ExecutarResumoUnimedUseCase,
    private readonly buscarEmpresasUnimedUseCase: BuscarEmpresasUnimedUseCase,
    private readonly importarDadosContratoUseCase: ImportarUnimedPorContratoUseCase,
    private readonly importarPeriodoCompletoUseCase: ImportarPeriodoCompletoUseCase,

    // ❌ Dependências INCORRETAS (listagens genéricas sem relação com importação)
    private readonly listarEmpresasUseCase: ListarEmpresasUseCase,
    private readonly listarContratosUseCase: ListarContratosUseCase,
    private readonly listarColaboradoresUseCase: ListarColaboradoresUseCase,
    private readonly listarProcessosUseCase: ListarProcessosUseCase,
  ) {}
}
```

**Por que está errado?**

- **ImportacaoController** é responsável por operações de **importação de dados da Unimed** (regra de negócio específica)
- **Listar empresas/contratos/colaboradores** são operações de **consulta genéricas** que podem ser usadas em QUALQUER módulo (relatórios, exportação, processos, etc.)
- Viola o **Single Responsibility Principle** - o controller agora tem 2 responsabilidades distintas

**Impacto**:

- Forte acoplamento entre módulos não relacionados
- Dificuldade de manutenção e testes
- Reutilização impossível - se Exportação ou Relatórios precisar listar empresas, teria que chamar endpoint de Importação?

---

### 2. **Endpoints Mal Localizados**

**Problema**: Endpoints de listagem genéricos estão sob o prefixo `/importacao`

```typescript
// ❌ INCORRETO - Listagens genéricas com prefixo de importação
GET /importacao/listar-empresas
GET /importacao/listar-contratos
GET /importacao/listar-colaboradores?codEmpresa=X&codColigada=Y
GET /importacao/listar-processos?categoria=X
```

**Por que está errado?**

- Semanticamente incorreto - listar empresas NÃO é uma operação de importação
- Confunde a API - um desenvolvedor novo pensaria que esses endpoints importam dados
- Dificulta documentação e descoberta de endpoints

**O que deveria ser**:

```typescript
// ✅ CORRETO - Endpoints genéricos de recursos
GET /empresas
GET /contratos
GET /colaboradores?codEmpresa=X&codColigada=Y
GET /processos?categoria=X

// Ou em um controller compartilhado
GET /common/empresas
GET /common/contratos
GET /common/colaboradores
GET /common/processos
```

---

### 3. **Confusão entre BuscarColaboradoresUseCase e ListarColaboradoresUseCase**

**Arquivos**:

- `src/application/use-cases/colaborador/buscar-colaboradores.use-case.ts` (EXISTENTE, CORRETO)
- `src/application/use-cases/colaborador/listar-colaboradores.use-case.ts` (NOVO, PROBLEMÁTICO)

#### BuscarColaboradoresUseCase (Correto)

```typescript
// ✅ CORRETO - Regra de negócio específica
// Busca colaboradores da view vw_uni_resumo_colaborador
// Retorna dados com valores calculados da Unimed
async execute(request: BuscarColaboradoresRequest): Promise<BuscarColaboradoresResponse> {
  // Retorna: valorTitular, valorDependente, valorConsumo,
  //          valorEmpresa, valorTotal, valorLiquido, exporta, etc.
}
```

**Responsabilidade**: Regra de negócio do módulo de colaboradores - buscar colaboradores com seus valores da Unimed para exibição/edição.

#### ListarColaboradoresUseCase (Problemático)

```typescript
// ❌ PROBLEMÁTICO - Listagem genérica mal posicionada
// Busca colaboradores de gc.colaboradores (tabela básica)
// Usa buscarColaboradores() do repository (pageSize: 10000)
async execute(codEmpresa: number, codColigada: number): Promise<ColaboradorSimplificadoDto[]> {
  const resultado = await this.colaboradorRepository.buscarColaboradores({
    codEmpresa,
    codColigada,
    page: 1,
    pageSize: 10000, // 😱 Buscar TODOS (anti-pattern)
  });

  // Remove duplicatas por CPF
  // Retorna apenas: cpf, nome, apelido (dados básicos)
}
```

**Problemas**:

1. **Reutiliza método do repository com propósito diferente** - `buscarColaboradores()` foi criado para a regra de negócio de colaboradores (com paginação, filtros, valores da Unimed)
2. **PageSize 10000** - Anti-pattern, força buscar todos os registros
3. **Processamento na aplicação** - Remove duplicatas por CPF no código quando deveria ser feito no SQL
4. **Responsabilidade confusa** - Por que está no módulo de colaboradores se não é regra de negócio?

---

### 4. **Métodos Adicionados aos Repositories Sem Coesão**

#### EmpresaRepository

```typescript
// ✅ Métodos CORRETOS (relacionados à regra de negócio)
buscarEmpresasUnimed(): Promise<EmpresaUnimedRow[]>
buscarContratosAtivos(): Promise<ContratoAtivoRow[]>

// ❌ Método ADICIONADO sem coesão
listarEmpresasCompletas(): Promise<EmpresaCompletaRow[]>
```

**Problema**:

- `listarEmpresasCompletas()` é uma query genérica que poderia estar em qualquer lugar
- Não faz parte da lógica de negócio de empresa
- Deveria estar em um repository genérico ou de leitura

#### ProcessoRepository

```typescript
// ✅ Métodos CORRETOS (regras de negócio de processos)
listarProcessosDisponiveis(params): Promise<Processo[]>
executarProcesso(params): Promise<void>
buscarHistorico(params): Promise<ProcessoLog[]>
validarPrazoExecucao(params): Promise<ValidacaoResult>
buscarPorCodigo(codigo): Promise<Processo | null>

// ❌ Método ADICIONADO sem coesão
listarProcessos(categoria?: string): Promise<ProcessoRow[]>
```

**Problema**:

- `listarProcessos()` é redundante com `listarProcessosDisponiveis()`
- Retorna `ProcessoRow[]` (tipo de infraestrutura) em vez de `Processo[]` (entidade de domínio)
- Viola Clean Architecture - expõe detalhes de implementação

---

## 🏗️ Análise da Estrutura Existente (Antes das Mudanças)

### Módulos Bem Definidos

#### 1. **Módulo de Importação**

**Propósito**: Importar dados da API externa da Unimed e processar resumos

**Use Cases**:

- ✅ `ImportarDadosUnimedUseCase` - Importa dados por CPF
- ✅ `ImportarUnimedPorContratoUseCase` - Importa dados por contrato
- ✅ `ImportarPeriodoCompletoUseCase` - Importa período completo
- ✅ `ExecutarResumoUnimedUseCase` - Executa resumo dos dados
- ✅ `BuscarEmpresasUnimedUseCase` - Busca empresas que processam Unimed (FAZ SENTIDO aqui)

**Controller**: `ImportacaoController` em `/importacao/*`

#### 2. **Módulo de Colaboradores**

**Propósito**: Gerenciar colaboradores e seus valores da Unimed

**Use Cases**:

- ✅ `BuscarColaboradoresUseCase` - Busca colaboradores com valores calculados
- ✅ `AtualizarColaboradorUseCase` - Atualiza exportação de colaborador
- ✅ `AtualizarTodosColaboradoresUseCase` - Atualiza todos de uma empresa
- ✅ `AtualizarValorEmpresaUseCase` - Atualiza valor empresa

**Controller**: `ColaboradorController` em `/colaboradores/*`

**Repository**: `IColaboradorRepository` com métodos específicos:

```typescript
buscarColaboradores(params): Promise<BuscarColaboradoresResult>
atualizarExporta(params): Promise<number>
atualizarTodosExporta(params): Promise<number>
atualizarValorEmpresa(params): Promise<number>
```

#### 3. **Módulo de Processos**

**Propósito**: Executar processos de fechamento de comissão

**Use Cases**:

- ✅ `BuscarHistoricoUseCase`
- ✅ `ExecutarProcessoUseCase`
- ✅ `BuscarProcessosAtivosUseCase`

**Controller**: `ProcessoController` em `/processos/*`

#### 4. **Módulo de Exportação**

**Propósito**: Exportar dados para TOTVS

**Use Cases**:

- ✅ `ExportarParaTOTVSUseCase`
- ✅ `BuscarProcessosParaExportacaoUseCase`

**Controller**: `ExportacaoController` em `/exportacao/*`

#### 5. **Módulo de Relatórios**

**Propósito**: Gerar relatórios em PDF (JasperReports)

**Controller**: `RelatorioController` em `/relatorios/*`

---

## 🎯 Qual é a Natureza das Listagens?

### Listagens NÃO são Regras de Negócio

As listagens criadas (`listar-empresas`, `listar-contratos`, `listar-colaboradores`, `listar-processos`) são:

**❌ NÃO SÃO**:

- Regras de negócio de importação
- Regras de negócio de colaboradores
- Regras de negócio de empresas
- Regras de negócio de processos

**✅ SÃO**:

- **Queries genéricas de leitura** (CQRS - Query Side)
- **Dados mestres** (Master Data)
- **Recursos compartilhados** (Shared Resources)
- **Utilitários de UI** (para preencher dropdowns/autocompletes)

### Onde Podem Ser Usadas?

Essas listagens podem ser necessárias em:

- ✅ **Formulário de Relatórios** (filtrar por empresa, contrato, colaborador)
- ✅ **Formulário de Exportação** (selecionar empresa, colaborador específico)
- ✅ **Formulário de Processos** (selecionar processo, empresa)
- ✅ **Formulário de Importação** (selecionar empresa, contrato)
- ✅ **Qualquer outro formulário futuro**

**Conclusão**: São recursos **transversais/cross-cutting** que não pertencem a nenhum módulo específico.

---

## 📊 Impacto Atual (Bugs Identificados)

### 1. **Nenhum Bug Funcional Crítico**

✅ O código funciona, os endpoints retornam dados corretamente

### 2. **Problemas Arquiteturais (Dívida Técnica)**

#### Alto Acoplamento

```
ImportacaoController
  ├── ImportarDadosUnimedUseCase ✅
  ├── ExecutarResumoUnimedUseCase ✅
  ├── BuscarEmpresasUnimedUseCase ✅
  ├── ListarEmpresasUseCase ❌ (não deveria estar aqui)
  ├── ListarContratosUseCase ❌ (não deveria estar aqui)
  ├── ListarColaboradoresUseCase ❌ (não deveria estar aqui)
  └── ListarProcessosUseCase ❌ (não deveria estar aqui)
```

#### Confusão Conceitual

- Desenvolvedores não sabem onde adicionar novos endpoints de listagem
- Endpoints de listagem estão "escondidos" em `/importacao/*`
- Documentação da API fica confusa

#### Dificuldade de Manutenção

- Mudança em listagem de empresas afeta módulo de Importação
- Testes do ImportacaoController precisam mockar 9 dependências (4 delas sem relação)
- Violação do princípio de **Low Coupling, High Cohesion**

#### Performance Potencial

```typescript
// ❌ Anti-pattern no ListarColaboradoresUseCase
const resultado = await this.colaboradorRepository.buscarColaboradores({
  codEmpresa,
  codColigada,
  page: 1,
  pageSize: 10000, // Busca TODOS os registros
});
```

- Se uma empresa tem 10.000+ colaboradores, vai estourar memória
- Remove duplicatas no código (deveria ser no SQL)

---

## ✅ Estrutura Correta Sugerida

### Opção 1: Controller Compartilhado (Recomendado)

**Criar**: `CommonController` ou `MasterDataController`

```typescript
// src/presentation/controllers/common.controller.ts
@Controller('common')
export class CommonController {
  constructor(
    private readonly listarEmpresasQuery: ListarEmpresasQuery,
    private readonly listarContratosQuery: ListarContratosQuery,
    private readonly listarColaboradoresQuery: ListarColaboradoresQuery,
    private readonly listarProcessosQuery: ListarProcessosQuery,
  ) {}

  @Get('empresas')
  async listarEmpresas() {
    /* ... */
  }

  @Get('contratos')
  async listarContratos() {
    /* ... */
  }

  @Get('colaboradores')
  async listarColaboradores(@Query() query) {
    /* ... */
  }

  @Get('processos')
  async listarProcessos(@Query('categoria') categoria?: string) {
    /* ... */
  }
}
```

**Endpoints**:

```
GET /common/empresas
GET /common/contratos
GET /common/colaboradores?codEmpresa=X&codColigada=Y
GET /common/processos?categoria=X
```

### Opção 2: Controllers por Recurso

```typescript
// src/presentation/controllers/empresa.controller.ts
@Controller('empresas')
export class EmpresaController {
  @Get()
  async listarEmpresas() {
    /* ... */
  }

  @Get('contratos')
  async listarContratos() {
    /* ... */
  }
}

// src/presentation/controllers/colaborador-query.controller.ts
@Controller('colaboradores')
export class ColaboradorQueryController {
  @Get()
  async listarColaboradores() {
    /* ... */
  }
}

// src/presentation/controllers/processo-query.controller.ts
@Controller('processos')
export class ProcessoQueryController {
  @Get()
  async listarProcessos() {
    /* ... */
  }
}
```

**Endpoints**:

```
GET /empresas
GET /empresas/contratos
GET /colaboradores?codEmpresa=X&codColigada=Y
GET /processos?categoria=X
```

### Opção 3: CQRS Pattern (Mais Avançado)

Separar **Commands** (escrita) de **Queries** (leitura):

```
src/application/
  ├── commands/          # Use Cases de escrita (importar, atualizar, etc.)
  │   ├── importacao/
  │   ├── colaborador/
  │   └── processo/
  └── queries/           # Queries de leitura (listar, buscar, etc.)
      ├── empresa/
      │   ├── listar-empresas.query.ts
      │   └── listar-contratos.query.ts
      ├── colaborador/
      │   └── listar-colaboradores.query.ts
      └── processo/
          └── listar-processos.query.ts
```

**Vantagem**: Separação clara entre operações que mudam estado vs. operações de consulta.

---

## 🔧 Refatoração Recomendada

### Passo 1: Criar Queries Genéricas

```typescript
// src/application/queries/empresa/listar-empresas.query.ts
@Injectable()
export class ListarEmpresasQuery {
  constructor(
    @Inject('IDatabaseService')
    private readonly db: IDatabaseService,
  ) {}

  async execute(): Promise<EmpresaListagemDto[]> {
    const sql = `
      SELECT cod_empresa, codcoligada, codfilial, cod_band, 
             cnpj, apelido
      FROM gc.empresa_filial
      WHERE ativo = 'S' AND processa_unimed = 'S'
      ORDER BY apelido
    `;
    // Query direta, sem passar por repository de domínio
    return this.db.executeQuery<EmpresaRow>(sql);
  }
}
```

### Passo 2: Criar Controller Compartilhado

```typescript
// src/presentation/controllers/common.controller.ts
@Controller('common')
export class CommonController {
  constructor(
    private readonly listarEmpresasQuery: ListarEmpresasQuery,
    private readonly listarContratosQuery: ListarContratosQuery,
    private readonly listarColaboradoresQuery: ListarColaboradoresQuery,
    private readonly listarProcessosQuery: ListarProcessosQuery,
  ) {}

  @Get('empresas')
  @Roles('DP', 'ADMIN')
  async listarEmpresas() {
    const empresas = await this.listarEmpresasQuery.execute();
    return { sucesso: true, dados: empresas };
  }

  // ... outros endpoints
}
```

### Passo 3: Remover do ImportacaoController

```typescript
// src/presentation/controllers/importacao.controller.ts
@Controller('importacao')
export class ImportacaoController {
  constructor(
    // Manter apenas use cases relacionados à importação
    private readonly importarDadosUnimedUseCase: ImportarDadosUnimedUseCase,
    private readonly executarResumoUnimedUseCase: ExecutarResumoUnimedUseCase,
    private readonly buscarEmpresasUnimedUseCase: BuscarEmpresasUnimedUseCase,
    private readonly importarDadosContratoUseCase: ImportarUnimedPorContratoUseCase,
    private readonly importarPeriodoCompletoUseCase: ImportarPeriodoCompletoUseCase,
  ) {}

  // Remover endpoints de listagem genéricos
}
```

### Passo 4: Atualizar Frontend

```typescript
// Antes (ERRADO)
GET / importacao / listar - empresas;
GET / importacao / listar - contratos;
GET / importacao / listar - colaboradores;
GET / importacao / listar - processos;

// Depois (CORRETO)
GET / common / empresas;
GET / common / contratos;
GET / common / colaboradores;
GET / common / processos;
```

---

## 📈 Benefícios da Refatoração

### 1. **Separação de Responsabilidades**

- Cada controller tem uma responsabilidade clara
- Use cases agrupados por contexto de negócio

### 2. **Baixo Acoplamento**

- Módulos independentes
- Mudanças em listagens não afetam importação

### 3. **Alta Coesão**

- Código relacionado fica junto
- Queries de leitura separadas de comandos de escrita

### 4. **Facilita Testes**

- Menos mocks necessários
- Testes mais focados

### 5. **Melhor Performance**

- Queries otimizadas para leitura
- Sem processamento desnecessário na aplicação

### 6. **API Mais Clara**

- Endpoints organizados logicamente
- Documentação intuitiva

---

## 🎯 Conclusão

### ✅ Estado Atual (Funcional mas Problemático)

- Código funciona corretamente
- Endpoints retornam dados esperados
- **MAS**: Arquitetura violada, acoplamento alto, confusão conceitual

### ❌ Problemas Arquiteturais

1. Listagens genéricas acopladas ao módulo de Importação
2. Endpoints mal localizados (`/importacao/listar-*`)
3. Confusão entre `BuscarColaboradoresUseCase` e `ListarColaboradoresUseCase`
4. Métodos adicionados aos repositories sem coesão
5. Anti-pattern (pageSize: 10000)

### 🚀 Recomendação

**Refatorar para uma das 3 opções sugeridas**, sendo a **Opção 1 (CommonController)** a mais simples e direta.

**Prioridade**: Média-Alta (não é bug, mas aumenta dívida técnica significativamente)

**Esforço Estimado**: 2-4 horas de desenvolvimento + 1 hora de testes

---

## 📝 Checklist de Refatoração

```
[ ] Criar pasta src/application/queries/
[ ] Mover ListarEmpresasUseCase para ListarEmpresasQuery
[ ] Mover ListarContratosUseCase para ListarContratosQuery
[ ] Mover ListarColaboradoresUseCase para ListarColaboradoresQuery
[ ] Mover ListarProcessosUseCase para ListarProcessosQuery
[ ] Criar CommonController
[ ] Adicionar endpoints em /common/*
[ ] Remover dependências de listagem do ImportacaoController
[ ] Remover métodos listarEmpresasCompletas() e listarProcessos() dos repositories
[ ] Atualizar ApplicationModule (remover use cases, adicionar queries)
[ ] Atualizar frontend (mudar URLs de /importacao/* para /common/*)
[ ] Atualizar testes
[ ] Atualizar documentação
```

---

**Autor da Análise**: GitHub Copilot  
**Data**: 04/02/2026  
**Versão**: 1.0
