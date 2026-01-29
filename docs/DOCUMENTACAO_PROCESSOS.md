# ⚙️ DOCUMENTAÇÃO COMPLETA - MÓDULO DE PROCESSOS UNIMED

**Módulo:** Processos de Fechamento e Consolidação  
**Status:** ✅ 100% Implementado (Aguardando Testes)  
**Versão:** 1.0  
**Data:** 27 de Janeiro de 2026

---

## 📋 ÍNDICE

1. [O Que São Processos?](#1-o-que-são-processos)
2. [Por Que Precisamos Deste Módulo?](#2-por-que-precisamos-deste-módulo)
3. [Como Funciona?](#3-como-funciona)
4. [Endpoints da API](#4-endpoints-da-api)
5. [Fluxo Completo de Uso](#5-fluxo-completo-de-uso)
6. [Regras de Negócio Importantes](#6-regras-de-negócio-importantes)
7. [Exemplos Práticos](#7-exemplos-práticos)
8. [Troubleshooting](#8-troubleshooting)

---

## 1. O QUE SÃO PROCESSOS?

### 🎯 Definição Simples

**Processos** são rotinas automáticas que **consolidam e fecham** os dados da Unimed antes de exportar para o sistema TOTVS.

### 📊 Analogia

Imagine que você importou dados brutos de vendas (colaboradores e valores da Unimed). Os processos são como:

1. **Contador** que soma tudo e gera o "fechamento do mês"
2. **Auditor** que valida se tudo está correto
3. **Preparador** que deixa dados prontos para enviar ao financeiro (TOTVS)

### 🔄 Fluxo do Sistema

```
┌─────────────────────────────────────────────────────────────┐
│ 1. IMPORTAÇÃO                                               │
│    └─> Busca dados na API Unimed                           │
│    └─> Salva em uni_dados_cobranca (dados brutos)          │
└─────────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. EXECUTAR RESUMO                                          │
│    └─> Procedure p_uni_resumo                              │
│    └─> Cria uni_resumo_colaborador (dados resumidos)       │
└─────────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. GESTÃO COLABORADORES                                     │
│    └─> Ajusta flag exporta='S'/'N'                         │
│    └─> Define quem vai para folha de pagamento             │
└─────────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────────┐
│ 4. PROCESSOS (ESTE MÓDULO) ⬅️ VOCÊ ESTÁ AQUI              │
│    └─> Executa P_MCW_FECHA_COMISSAO_GLOBAL                │
│    └─> Consolida dados                                     │
│    └─> Calcula totais por empresa                          │
│    └─> Marca período como "fechado"                        │
│    └─> Prepara para exportação                             │
└─────────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────────┐
│ 5. EXPORTAÇÃO TOTVS (Próximo módulo)                       │
│    └─> Gera arquivo com colaboradores exporta='S'          │
│    └─> Envia para TOTVS                                    │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. POR QUE PRECISAMOS DESTE MÓDULO?

### ❌ Sem Processos:

- Dados ficam "soltos" no banco
- Não tem controle de período fechado
- Risco de exportar dados inconsistentes
- Sem histórico de quem processou e quando

### ✅ Com Processos:

- ✅ Dados consolidados e validados
- ✅ Período marcado como "fechado"
- ✅ Histórico completo (quem, quando, quanto tempo levou)
- ✅ Validação de prazos (evita processar fora da data)
- ✅ Modo "prévia" para testar sem comitar

---

## 3. COMO FUNCIONA?

### 📦 Cadastro de Processos

Existe uma tabela `mcw_processo` com processos pré-cadastrados:

| Código | Descrição  | Categoria | Ordem | Dias Limite | Ativo |
| ------ | ---------- | --------- | ----- | ----------- | ----- |
| UNIED  | Educação   | UNI       | 1     | 5           | S     |
| UNIEF  | Fechamento | UNI       | 2     | 7           | S     |
| UNIEX  | Exportação | UNI       | 3     | 10          | S     |

**O que significa cada campo:**

- **Código:** Identificador único do processo
- **Descrição:** Nome legível para o usuário
- **Categoria:** Agrupamento (UNI = Unimed, DIRF = IR, etc)
- **Ordem:** Sequência de execução (1 primeiro, 2 depois...)
- **Dias Limite:** Quantos dias após o fechamento do mês pode executar
- **Ativo:** Se 'S', aparece para execução

### 🔧 Procedure Oracle (Coração do Sistema)

```sql
GC.PGK_GLOBAL.P_MCW_FECHA_COMISSAO_GLOBAL(
    p_processo         VARCHAR2,  -- Ex: 'UNIED', 'UNIEF'
    p_mes              NUMBER,    -- Mês: 10
    p_ano              NUMBER,    -- Ano: 2025
    p_previa           CHAR(1),   -- 'S' = teste, 'N' = definitivo
    p_apaga            CHAR(1),   -- 'S' = limpa dados antigos
    p_usuario          VARCHAR2,  -- Quem está executando
    p_todas_empresas   CHAR(1),   -- 'S' = todas, 'N' = específica
    p_cod_empresa      VARCHAR2,  -- Código da empresa (ou 'T')
    p_cod_band         VARCHAR2,  -- Bandeira (ou 'T')
    p_tipo_comissao    VARCHAR2,  -- 'S' = simplificado
    p_cpf              VARCHAR2   -- CPF específico (opcional)
)
```

**O que essa procedure faz:**

1. ✅ Valida se o período está fechado
2. ✅ Se `p_apaga='S'`: Limpa dados antigos do período
3. ✅ Processa dados conforme o tipo do processo
4. ✅ Calcula totais, consolida informações
5. ✅ Atualiza tabelas de fechamento
6. ✅ Registra log de execução
7. ✅ Se `p_previa='S'`: Apenas simula (não comita)

### 📅 Controle de Período

**Tabela:** `mcw_periodo_fechamento`

```sql
CREATE TABLE mcw_periodo_fechamento (
    mes_ref       NUMBER(2),      -- Ex: 10
    ano_ref       NUMBER(4),      -- Ex: 2025
    data_inicial  DATE,           -- 01/10/2025
    data_final    DATE,           -- 31/10/2025
    status        VARCHAR2(20)    -- 'ABERTO', 'FECHADO', 'PROCESSADO'
);
```

**Cálculo de Prazo:**

```
Data Final do Período: 31/10/2025
Dias Limite do Processo: 7 dias
Data Máxima para Executar: 07/11/2025

Se hoje é 05/11/2025: ✅ DENTRO DO PRAZO
Se hoje é 10/11/2025: ❌ FORA DO PRAZO (precisa permissão especial)
```

### 📝 Histórico de Execuções

**Tabela:** `mcw_processo_log`

Registra cada vez que um processo é executado:

```sql
INSERT INTO mcw_processo_log (
    codigo,        -- 'UNIED'
    categoria,     -- 'UNI'
    mes_ref,       -- 10
    ano_ref,       -- 2025
    usuario,       -- 'joao.silva'
    data_proc,     -- '2026-01-27 14:30:00'
    hora1,         -- 1706367000 (início)
    hora2,         -- 1706367045 (fim)
    duracao,       -- 45 segundos
    apaga,         -- 'N'
    previa,        -- 'S'
    erro           -- NULL (sucesso)
);
```

---

## 4. ENDPOINTS DA API

### 📍 **Base URL:** `http://localhost:3000/api/v1/processos`

---

### **1. GET /disponiveis** 📋

**Descrição:** Lista processos disponíveis para execução

**Quando usar:**

- Usuário quer saber quais processos pode executar
- Antes de executar, para mostrar opções

**Query Parameters:**

| Parâmetro    | Tipo   | Obrigatório | Valores       | Descrição                  |
| ------------ | ------ | ----------- | ------------- | -------------------------- |
| `categoria`  | string | ✅ Sim      | 'UNI', 'DIRF' | Categoria do processo      |
| `tipoDeDado` | string | ✅ Sim      | 'S', 'C'      | S=Simplificado, C=Completo |

**Exemplo Request:**

```http
GET /api/v1/processos/disponiveis?categoria=UNI&tipoDeDado=S
```

**Response 200 OK:**

```json
{
  "processos": [
    {
      "codigo": "UNIED",
      "descricao": "Educação",
      "categoria": "UNI",
      "ordem": 1,
      "dias": 5,
      "ativo": "S"
    },
    {
      "codigo": "UNIEF",
      "descricao": "Fechamento",
      "categoria": "UNI",
      "ordem": 2,
      "dias": 7,
      "ativo": "S"
    },
    {
      "codigo": "UNIEX",
      "descricao": "Exportação",
      "categoria": "UNI",
      "ordem": 3,
      "dias": 10,
      "ativo": "S"
    }
  ],
  "total": 3
}
```

**Regras:**

- ✅ Retorna apenas processos com `ativo='S'`
- ✅ Ordenados por campo `ordem`
- ✅ Filtra por categoria e tipo de dado

---

### **2. POST /executar** ⚡

**Descrição:** Executa um processo específico

**Quando usar:**

- Após importar dados da Unimed
- Após ajustar colaboradores
- Para consolidar dados do mês

**⚠️ ATENÇÃO:** Esta operação chama procedure Oracle que modifica dados!

**Request Body:**

```json
{
  "processo": "UNIED",
  "mesRef": 10,
  "anoRef": 2025,
  "categoria": "UNI",
  "tipoComissao": "S",
  "previa": "S",
  "apaga": "N",
  "codEmpresa": 71,
  "codColigada": 19,
  "codFilial": 1,
  "codBand": 1,
  "cpf": null
}
```

**Campos Obrigatórios:**

| Campo          | Tipo   | Descrição                  | Exemplo |
| -------------- | ------ | -------------------------- | ------- |
| `processo`     | string | Código do processo         | "UNIED" |
| `mesRef`       | number | Mês (1-12)                 | 10      |
| `anoRef`       | number | Ano (2020+)                | 2025    |
| `categoria`    | string | Categoria                  | "UNI"   |
| `tipoComissao` | string | S=Simplificado, C=Completo | "S"     |

**Campos Opcionais:**

| Campo         | Tipo   | Padrão | Descrição                              |
| ------------- | ------ | ------ | -------------------------------------- |
| `previa`      | string | "N"    | "S"=Teste (não comita), "N"=Definitivo |
| `apaga`       | string | "N"    | "S"=Limpa dados antigos, "N"=Mantém    |
| `codEmpresa`  | number | null   | Se null: processa todas as empresas    |
| `codColigada` | number | null   | Coligada (requer empresa)              |
| `codFilial`   | number | null   | Filial (requer empresa)                |
| `codBand`     | number | null   | Bandeira (se todas empresas)           |
| `cpf`         | string | null   | CPF específico (requer empresa)        |

**Exemplo Request (Todas Empresas):**

```http
POST /api/v1/processos/executar
Content-Type: application/json

{
  "processo": "UNIEF",
  "mesRef": 10,
  "anoRef": 2025,
  "categoria": "UNI",
  "tipoComissao": "S",
  "previa": "N",
  "apaga": "N"
}
```

**Exemplo Request (Empresa Específica):**

```http
POST /api/v1/processos/executar
Content-Type: application/json

{
  "processo": "UNIED",
  "mesRef": 10,
  "anoRef": 2025,
  "categoria": "UNI",
  "tipoComissao": "S",
  "codEmpresa": 71,
  "codColigada": 19,
  "codFilial": 1
}
```

**Response 200 OK (Sucesso):**

```json
{
  "sucesso": true,
  "mensagem": "Processo UNIED executado com sucesso"
}
```

**Response 400 Bad Request (Fora do Prazo):**

```json
{
  "statusCode": 400,
  "message": "Processo fora do prazo. Data máxima: 2025-11-07",
  "error": "Bad Request"
}
```

**Response 400 Bad Request (CPF sem Empresa):**

```json
{
  "statusCode": 400,
  "message": "É necessário informar empresa ao processar CPF específico",
  "error": "Bad Request"
}
```

**Response 500 Internal Server Error (Erro na Procedure):**

```json
{
  "statusCode": 500,
  "message": "Erro ao executar processo: ORA-XXXXX",
  "error": "Internal Server Error"
}
```

**Validações Automáticas:**

1. ✅ **Validação de Prazo:**
   - Busca data final do período
   - Soma dias limite do processo
   - Compara com data atual
   - Se fora do prazo: **REJEITA** (futuramente: verificar permissão)

2. ✅ **Validação de Empresa:**
   - Se `cpf` informado: exige `codEmpresa`
   - Se `codEmpresa` informado: processa apenas essa empresa
   - Se null: processa todas as empresas

3. ✅ **Validação de Dados:**
   - Mês entre 1 e 12
   - Ano >= 2020
   - `previa` e `apaga`: apenas 'S' ou 'N'

---

### **3. GET /historico** 📚

**Descrição:** Busca histórico de processos executados

**Quando usar:**

- Auditar quem processou e quando
- Verificar se processo já foi executado
- Ver tempo de duração de execuções anteriores
- Investigar erros passados

**Query Parameters:**

| Parâmetro   | Tipo   | Obrigatório | Descrição            | Exemplo |
| ----------- | ------ | ----------- | -------------------- | ------- |
| `categoria` | string | ✅ Sim      | Categoria            | "UNI"   |
| `mesRef`    | number | ❌ Não      | Filtrar por mês      | 10      |
| `anoRef`    | number | ❌ Não      | Filtrar por ano      | 2025    |
| `codigo`    | string | ❌ Não      | Filtrar por processo | "UNIED" |

**Exemplo Request (Todos de UNI):**

```http
GET /api/v1/processos/historico?categoria=UNI
```

**Exemplo Request (Outubro/2025):**

```http
GET /api/v1/processos/historico?categoria=UNI&mesRef=10&anoRef=2025
```

**Exemplo Request (Processo Específico):**

```http
GET /api/v1/processos/historico?categoria=UNI&codigo=UNIED&mesRef=10&anoRef=2025
```

**Response 200 OK:**

```json
{
  "historico": [
    {
      "id": 1234,
      "codigo": "UNIED",
      "descricao": "Educação",
      "categoria": "UNI",
      "mesRef": 10,
      "anoRef": 2025,
      "usuario": "joao.silva",
      "dataProc": "2026-01-27T14:30:00.000Z",
      "apaga": "N",
      "previa": "S",
      "duracao": 45,
      "erro": null
    },
    {
      "id": 1233,
      "codigo": "UNIEF",
      "descricao": "Fechamento",
      "categoria": "UNI",
      "mesRef": 10,
      "anoRef": 2025,
      "usuario": "maria.santos",
      "dataProc": "2026-01-26T10:15:00.000Z",
      "apaga": "N",
      "previa": "N",
      "duracao": 120,
      "erro": "ORA-00001: unique constraint violated"
    }
  ],
  "total": 2
}
```

**Campos do Response:**

| Campo       | Tipo   | Descrição                               |
| ----------- | ------ | --------------------------------------- |
| `id`        | number | ID único da execução                    |
| `codigo`    | string | Código do processo executado            |
| `descricao` | string | Descrição do processo                   |
| `categoria` | string | Categoria (UNI, DIRF, etc)              |
| `mesRef`    | number | Mês processado                          |
| `anoRef`    | number | Ano processado                          |
| `usuario`   | string | Quem executou                           |
| `dataProc`  | string | Data/hora da execução (ISO 8601)        |
| `apaga`     | string | Se apagou dados antigos ('S' ou 'N')    |
| `previa`    | string | Se foi prévia ('S') ou definitivo ('N') |
| `duracao`   | number | Tempo de execução em segundos           |
| `erro`      | string | Mensagem de erro (null se sucesso)      |

**Ordenação:**

- ✅ Sempre ordenado por `dataProc DESC` (mais recente primeiro)

---

## 5. FLUXO COMPLETO DE USO

### 📋 Cenário Típico: Fechamento Mensal

**Objetivo:** Fechar o mês de Outubro/2025 da empresa GSV (cod 71)

#### **Passo 1: Importar Dados** ✅ (Já implementado)

```http
GET /api/v1/importacao/dados-periodo-cnpj?mes=10&ano=2025
```

**Resultado:** Dados em `uni_dados_cobranca`

---

#### **Passo 2: Executar Resumo** ✅ (Já implementado)

```http
GET /api/v1/importacao/executar-resumo?mes=10&ano=2025
```

**Resultado:** Dados em `uni_resumo_colaborador`

---

#### **Passo 3: Ajustar Colaboradores** ✅ (Já implementado)

```http
GET /api/v1/colaboradores?codEmpresa=71&codColigada=19&mes=09&ano=2025
```

Revisar lista, marcar quem **não** deve ser exportado:

```http
PATCH /api/v1/colaboradores/atualizar
Content-Type: application/json

{
  "cpf": "12345678901",
  "mesRef": "09",
  "anoRef": "2025",
  "exporta": "N"
}
```

---

#### **Passo 4: Listar Processos Disponíveis** (Novo!)

```http
GET /api/v1/processos/disponiveis?categoria=UNI&tipoDeDado=S
```

**Response:**

```json
{
  "processos": [
    { "codigo": "UNIED", "descricao": "Educação", "ordem": 1, "dias": 5 },
    { "codigo": "UNIEF", "descricao": "Fechamento", "ordem": 2, "dias": 7 },
    { "codigo": "UNIEX", "descricao": "Exportação", "ordem": 3, "dias": 10 }
  ],
  "total": 3
}
```

---

#### **Passo 5: Executar Processos** (Novo!)

**5.1. Primeiro: PRÉVIA (para testar)**

```http
POST /api/v1/processos/executar
Content-Type: application/json

{
  "processo": "UNIED",
  "mesRef": 10,
  "anoRef": 2025,
  "categoria": "UNI",
  "tipoComissao": "S",
  "previa": "S",         // ← PRÉVIA!
  "apaga": "N",
  "codEmpresa": 71,
  "codColigada": 19,
  "codFilial": 1
}
```

✅ **Resultado:** Simula execução, não comita. Você pode revisar os dados.

---

**5.2. Depois: DEFINITIVO**

```http
POST /api/v1/processos/executar
Content-Type: application/json

{
  "processo": "UNIED",
  "mesRef": 10,
  "anoRef": 2025,
  "categoria": "UNI",
  "tipoComissao": "S",
  "previa": "N",         // ← DEFINITIVO!
  "apaga": "N",
  "codEmpresa": 71,
  "codColigada": 19,
  "codFilial": 1
}
```

✅ **Resultado:** Dados consolidados e comitados.

---

**5.3. Repetir para Próximos Processos:**

```http
POST /api/v1/processos/executar
{"processo": "UNIEF", "mesRef": 10, "anoRef": 2025, ...}
```

```http
POST /api/v1/processos/executar
{"processo": "UNIEX", "mesRef": 10, "anoRef": 2025, ...}
```

---

#### **Passo 6: Verificar Histórico** (Novo!)

```http
GET /api/v1/processos/historico?categoria=UNI&mesRef=10&anoRef=2025
```

**Response:**

```json
{
  "historico": [
    {
      "codigo": "UNIEX",
      "usuario": "joao.silva",
      "dataProc": "2026-01-27T15:00:00.000Z",
      "duracao": 90,
      "erro": null
    },
    {
      "codigo": "UNIEF",
      "usuario": "joao.silva",
      "dataProc": "2026-01-27T14:45:00.000Z",
      "duracao": 120,
      "erro": null
    },
    {
      "codigo": "UNIED",
      "usuario": "joao.silva",
      "dataProc": "2026-01-27T14:30:00.000Z",
      "duracao": 45,
      "erro": null
    }
  ],
  "total": 3
}
```

✅ **Verificação:** Todos processos executados com sucesso!

---

#### **Passo 7: Exportar para TOTVS** ⏳ (Próximo módulo)

```http
POST /api/v1/exportacao/gerar-arquivo
Content-Type: application/json

{
  "codEmpresa": 71,
  "mesRef": 10,
  "anoRef": 2025
}
```

---

## 6. REGRAS DE NEGÓCIO IMPORTANTES

### 🔐 **1. Validação de Prazo**

**Como Funciona:**

```typescript
// Busca data final do período
dataFinal = 31/10/2025

// Busca dias limite do processo
diasLimite = 7

// Calcula data máxima
dataMaxima = dataFinal + diasLimite = 07/11/2025

// Compara com hoje
hoje = 05/11/2025

if (hoje <= dataMaxima) {
  ✅ PERMITIDO
} else {
  ❌ REJEITADO (ou requer permissão especial)
}
```

**Por que existe:**

- Evita processar dados muito tempo depois do fechamento
- Mantém consistência temporal dos dados
- Permite auditoria e controle gerencial

**Exceções:**

- 🔓 Usuários com **permissão 78005** podem forçar execução fora do prazo

---

### 🧪 **2. Modo Prévia**

**O que é:**

- Quando `previa='S'`, a procedure executa mas **NÃO comita** as alterações
- É como um "teste" ou "simulação"

**Quando usar:**

- ✅ Primeira vez executando processo
- ✅ Depois de mudanças no banco
- ✅ Para validar se não haverá erros
- ✅ Para ver tempo de execução

**Como funciona:**

```sql
BEGIN
  -- Faz todo o processamento
  -- Calcula, valida, atualiza tabelas temporárias

  IF p_previa = 'S' THEN
    ROLLBACK; -- Desfaz tudo!
  ELSE
    COMMIT; -- Salva definitivo
  END IF;
END;
```

---

### 🗑️ **3. Apagar Dados Antigos**

**O que é:**

- Quando `apaga='S'`, a procedure limpa dados do período antes de processar

**Quando usar:**

- ✅ Reprocessar mês que já foi processado
- ✅ Corrigir dados após erro
- ✅ Limpar processamento de teste

**⚠️ Atenção:**

- Requer **permissão 78004**
- Ação irreversível (se comitar)
- Sempre teste com `previa='S'` primeiro!

**Como funciona:**

```sql
IF p_apaga = 'S' THEN
  DELETE FROM tabela_processamento
  WHERE mes_ref = p_mes
    AND ano_ref = p_ano
    AND cod_empresa = p_cod_empresa;
END IF;
```

---

### 🏢 **4. Todas Empresas vs Empresa Específica**

**Todas Empresas:**

```json
{
  "codEmpresa": null,
  "codColigada": null,
  "codFilial": null,
  "codBand": 1 // Opcional: filtrar por bandeira
}
```

**Empresa Específica:**

```json
{
  "codEmpresa": 71,
  "codColigada": 19,
  "codFilial": 1
}
```

**Regra:**

- Se `codEmpresa` é **null**: processa TODAS as empresas ativas
- Se `codEmpresa` é informado: processa APENAS essa empresa

**⚠️ Validação:**

- Se `cpf` é informado: **OBRIGATÓRIO** informar `codEmpresa`

---

### 📊 **5. Ordem de Execução**

Os processos devem ser executados **NA ORDEM** definida pelo campo `ordem`:

```
1. UNIED (Educação)
2. UNIEF (Fechamento)
3. UNIEX (Exportação)
```

**Por que:**

- Processos podem depender uns dos outros
- UNIED prepara dados que UNIEF precisa
- UNIEF consolida para UNIEX exportar

**⚠️ Não pular etapas!** Execute todos os processos da categoria em sequência.

---

### ⏱️ **6. Duração e Performance**

**Tempos Típicos:**

| Processo | Empresas | Tempo Médio | Observação            |
| -------- | -------- | ----------- | --------------------- |
| UNIED    | 1        | 30-60s      | Rápido                |
| UNIEF    | 1        | 1-3 min     | Cálculos complexos    |
| UNIEX    | 1        | 1-2 min     | Gera arquivos         |
| UNIED    | Todas    | 5-15 min    | Depende da quantidade |

**Dica:** Execute empresa por empresa em horário de pico.

---

## 7. EXEMPLOS PRÁTICOS

### 🎯 **Exemplo 1: Processar Empresa Específica (Modo Seguro)**

**Cenário:** Primeira vez processando dados de outubro/2025 da empresa GSV

```bash
# 1. Listar processos disponíveis
curl "http://localhost:3000/api/v1/processos/disponiveis?categoria=UNI&tipoDeDado=S"

# 2. Executar UNIED em modo prévia (teste)
curl -X POST "http://localhost:3000/api/v1/processos/executar" \
  -H "Content-Type: application/json" \
  -d '{
    "processo": "UNIED",
    "mesRef": 10,
    "anoRef": 2025,
    "categoria": "UNI",
    "tipoComissao": "S",
    "previa": "S",
    "apaga": "N",
    "codEmpresa": 71,
    "codColigada": 19,
    "codFilial": 1
  }'

# ✅ Se tudo OK, executar definitivo
curl -X POST "http://localhost:3000/api/v1/processos/executar" \
  -H "Content-Type: application/json" \
  -d '{
    "processo": "UNIED",
    "mesRef": 10,
    "anoRef": 2025,
    "categoria": "UNI",
    "tipoComissao": "S",
    "previa": "N",
    "apaga": "N",
    "codEmpresa": 71,
    "codColigada": 19,
    "codFilial": 1
  }'

# 3. Repetir para UNIEF
curl -X POST "http://localhost:3000/api/v1/processos/executar" \
  -H "Content-Type: application/json" \
  -d '{
    "processo": "UNIEF",
    "mesRef": 10,
    "anoRef": 2025,
    "categoria": "UNI",
    "tipoComissao": "S",
    "previa": "N",
    "apaga": "N",
    "codEmpresa": 71,
    "codColigada": 19,
    "codFilial": 1
  }'

# 4. Verificar histórico
curl "http://localhost:3000/api/v1/processos/historico?categoria=UNI&mesRef=10&anoRef=2025"
```

---

### 🎯 **Exemplo 2: Reprocessar Mês (Com Limpeza)**

**Cenário:** Outubro/2025 foi processado com erro, precisa reprocessar

```bash
# ⚠️ CUIDADO! Vai apagar dados antigos

# 1. Testar com prévia + apaga (simula limpeza)
curl -X POST "http://localhost:3000/api/v1/processos/executar" \
  -H "Content-Type: application/json" \
  -d '{
    "processo": "UNIED",
    "mesRef": 10,
    "anoRef": 2025,
    "categoria": "UNI",
    "tipoComissao": "S",
    "previa": "S",
    "apaga": "S",
    "codEmpresa": 71,
    "codColigada": 19,
    "codFilial": 1
  }'

# ✅ Se prévia OK, executar definitivo
curl -X POST "http://localhost:3000/api/v1/processos/executar" \
  -H "Content-Type: application/json" \
  -d '{
    "processo": "UNIED",
    "mesRef": 10,
    "anoRef": 2025,
    "categoria": "UNI",
    "tipoComissao": "S",
    "previa": "N",
    "apaga": "S",
    "codEmpresa": 71,
    "codColigada": 19,
    "codFilial": 1
  }'
```

---

### 🎯 **Exemplo 3: Processar Todas as Empresas**

**Cenário:** Fechamento mensal de todas as empresas ativas

```bash
# Processar todas as empresas de uma vez
curl -X POST "http://localhost:3000/api/v1/processos/executar" \
  -H "Content-Type: application/json" \
  -d '{
    "processo": "UNIED",
    "mesRef": 10,
    "anoRef": 2025,
    "categoria": "UNI",
    "tipoComissao": "S",
    "previa": "N",
    "apaga": "N"
  }'

# ⚠️ Pode demorar vários minutos!
# Verifique o histórico para ver duração
curl "http://localhost:3000/api/v1/processos/historico?categoria=UNI&codigo=UNIED&mesRef=10&anoRef=2025"
```

---

### 🎯 **Exemplo 4: Processar CPF Específico**

**Cenário:** Reprocessar apenas 1 colaborador que teve ajuste

```bash
curl -X POST "http://localhost:3000/api/v1/processos/executar" \
  -H "Content-Type: application/json" \
  -d '{
    "processo": "UNIED",
    "mesRef": 10,
    "anoRef": 2025,
    "categoria": "UNI",
    "tipoComissao": "S",
    "codEmpresa": 71,
    "codColigada": 19,
    "codFilial": 1,
    "cpf": "12345678901"
  }'
```

---

## 8. TROUBLESHOOTING

### ❌ **Erro: "Processo fora do prazo"**

**Causa:**

```
Data atual > Data final do período + Dias limite
```

**Soluções:**

1. **Verificar se período está correto:**

   ```sql
   SELECT * FROM gc.mcw_periodo_fechamento
   WHERE mes_ref = 10 AND ano_ref = 2025;
   ```

2. **Verificar dias limite do processo:**

   ```sql
   SELECT codigo, descricao, dias
   FROM nbs.mcw_processo
   WHERE codigo = 'UNIED';
   ```

3. **Se realmente precisa processar fora do prazo:**
   - Solicitar permissão 78005 ao administrador
   - Ou ajustar `data_final` no período (não recomendado)

---

### ❌ **Erro: "Período não encontrado"**

**Causa:** Não existe registro em `mcw_periodo_fechamento` para o mês/ano

**Solução:**

```sql
INSERT INTO gc.mcw_periodo_fechamento (
    mes_ref, ano_ref, data_inicial, data_final, status
) VALUES (
    10, 2025,
    TO_DATE('01/10/2025', 'DD/MM/YYYY'),
    TO_DATE('31/10/2025', 'DD/MM/YYYY'),
    'ABERTO'
);
```

---

### ❌ **Erro: "É necessário informar empresa ao processar CPF específico"**

**Causa:** Você passou `cpf` mas não informou `codEmpresa`

**Solução:**

```json
{
  "cpf": "12345678901",
  "codEmpresa": 71, // ← Adicionar
  "codColigada": 19, // ← Adicionar
  "codFilial": 1 // ← Adicionar
}
```

---

### ❌ **Erro Oracle: "ORA-XXXXX"**

**Causa:** Erro na procedure `P_MCW_FECHA_COMISSAO_GLOBAL`

**Debug:**

1. **Ver log completo:**

   ```http
   GET /api/v1/processos/historico?codigo=UNIED&mesRef=10&anoRef=2025
   ```

   Verificar campo `erro` no response

2. **Executar procedure manualmente:**

   ```sql
   BEGIN
     GC.PGK_GLOBAL.P_MCW_FECHA_COMISSAO_GLOBAL(
       'UNIED', 10, 2025, 'S', 'N', 'teste', 'N', '71', '1', 'S', ''
     );
   END;
   /
   ```

3. **Verificar logs do banco Oracle:**
   ```sql
   SELECT * FROM gc.mcw_processo_log
   WHERE codigo = 'UNIED'
   ORDER BY data_proc DESC
   FETCH FIRST 1 ROW ONLY;
   ```

---

### ⏱️ **Processo Demora Muito**

**Causas Comuns:**

- Processando muitas empresas
- Banco com muitos dados
- Procedure com lógica pesada

**Soluções:**

1. **Processar empresa por empresa:**

   ```bash
   # Em vez de todas as empresas:
   for empresa in {71,72,73}; do
     curl -X POST "http://localhost:3000/api/v1/processos/executar" \
       -d "{\"codEmpresa\": $empresa, ...}"
   done
   ```

2. **Verificar tempo no histórico:**

   ```http
   GET /api/v1/processos/historico?categoria=UNI
   ```

   Campo `duracao` mostra segundos

3. **Otimizar procedure (se necessário):**
   - Adicionar índices nas tabelas
   - Revisar queries dentro da procedure

---

### 🔍 **Como Saber Se Já Processou?**

```http
GET /api/v1/processos/historico?categoria=UNI&mesRef=10&anoRef=2025&codigo=UNIED
```

Se retornar registros:

- ✅ Já processou
- Verificar campo `erro`:
  - `null` = Sucesso
  - Com texto = Erro na execução

---

## 📚 RESUMO EXECUTIVO

### ✅ **O que você precisa lembrar:**

1. **Processos consolidam e fecham dados** antes de exportar para TOTVS
2. **Execute NA ORDEM:** UNIED → UNIEF → UNIEX
3. **Sempre teste com `previa='S'`** primeiro
4. **Valide prazo** antes de executar (data final + dias limite)
5. **Consulte histórico** para auditar execuções
6. **Cuidado com `apaga='S'`** - apaga dados antigos!

### 🎯 **Fluxo Ideal:**

```
1. Importar dados
2. Executar resumo
3. Ajustar colaboradores
4. Listar processos disponíveis
5. Executar cada processo:
   a) Primeiro com prévia='S' (teste)
   b) Depois com prévia='N' (definitivo)
6. Verificar histórico (garantir sucesso)
7. Exportar para TOTVS
```

### ⚠️ **Cuidados:**

- ❌ **NÃO** executar em produção sem testar antes
- ❌ **NÃO** pular processos da sequência
- ❌ **NÃO** usar `apaga='S'` sem prévia
- ✅ **SEMPRE** consultar histórico após executar
- ✅ **SEMPRE** validar prazo antes de processar

---

**Próximo Passo:** Módulo de Exportação TOTVS (gerar arquivo para folha)

**Dúvidas?** Consulte os logs do histórico ou execute em modo prévia primeiro!

---

**Documento atualizado em:** 27 de Janeiro de 2026  
**Versão:** 1.0  
**Autor:** Documentação Técnica API-UNIMED
