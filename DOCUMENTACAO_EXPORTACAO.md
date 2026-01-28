# 📤 DOCUMENTAÇÃO COMPLETA - MÓDULO DE EXPORTAÇÃO TOTVS

**Módulo:** Exportação de Dados Unimed para TOTVS RM  
**Status:** ✅ 100% Implementado (Aguardando Testes)  
**Versão:** 1.0  
**Data:** 28 de Janeiro de 2026

---

## 📋 ÍNDICE

1. [O Que É a Exportação TOTVS?](#1-o-que-é-a-exportação-totvs)
2. [Por Que Precisamos Deste Módulo?](#2-por-que-precisamos-deste-módulo)
3. [Como Funciona?](#3-como-funciona)
4. [Ambientes de Execução](#4-ambientes-de-execução)
5. [Endpoints da API](#5-endpoints-da-api)
6. [Fluxo Completo de Uso](#6-fluxo-completo-de-uso)
7. [Regras de Negócio Importantes](#7-regras-de-negócio-importantes)
8. [Exemplos Práticos](#8-exemplos-práticos)
9. [Troubleshooting](#9-troubleshooting)

---

## 1. O QUE É A EXPORTAÇÃO TOTVS?

### 🎯 Definição Simples

**Exportação TOTVS** é o último passo do fluxo da Unimed: **enviar dados processados para o sistema de folha de pagamento TOTVS RM**.

### 📊 Analogia

Imagine que você já:

1. ✅ Importou dados da Unimed (dados brutos)
2. ✅ Executou resumo (dados consolidados)
3. ✅ Ajustou colaboradores (marcou quem exportar)
4. ✅ Executou processos (fechou período)

Agora a **exportação** é como:

- **Carteiro** que pega os dados prontos e entrega no destino final (TOTVS RM)
- **Ponte** entre o sistema de gestão (nosso) e folha de pagamento (TOTVS)
- **Sincronizador** que atualiza lançamentos financeiros na base do RM

### 🔄 Fluxo Completo do Sistema

```
┌─────────────────────────────────────────────────────────────┐
│ 1. IMPORTAÇÃO                                               │
│    └─> Busca dados na API Unimed                           │
│    └─> Salva em uni_dados_cobranca (dados brutos)          │
└─────────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. RESUMO                                                   │
│    └─> Procedure p_uni_resumo                              │
│    └─> Cria uni_resumo_colaborador (dados resumidos)       │
└─────────────────────────────────────────────────────────────┐
                        ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. GESTÃO COLABORADORES                                     │
│    └─> Ajusta flag exporta='S'/'N'                         │
│    └─> Define quem vai para folha de pagamento             │
└─────────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────────┐
│ 4. PROCESSOS                                                │
│    └─> Executa P_MCW_FECHA_COMISSAO_GLOBAL                │
│    └─> Consolida e fecha período                           │
└─────────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────────┐
│ 5. EXPORTAÇÃO TOTVS ⬅️ VOCÊ ESTÁ AQUI                     │
│    └─> Procedure PKG_UNI_SAUDE.P_EXP_PLANO_SAUDE          │
│    └─> Envia para TOTVS RM via DB_LINK                    │
│    └─> Atualiza rm.pffinanc (lançamentos financeiros)      │
│    └─> Atualiza rm.pfperff (períodos de folha)            │
└─────────────────────────────────────────────────────────────┘
                        ↓
            🎯 TOTVS RM ATUALIZADO
```

---

## 2. POR QUE PRECISAMOS DESTE MÓDULO?

### ❌ Sem Exportação Automática:

- Necessário exportar manualmente pelo sistema legado PHP
- Risco de esquecer de exportar
- Sem controle de ambiente (pode afetar produção acidentalmente)
- Difícil rastrear histórico de exportações
- Processo lento e propenso a erros

### ✅ Com Módulo de Exportação:

- ✅ Exportação via API REST (integração fácil)
- ✅ Modo PREVIEW em desenvolvimento (segurança)
- ✅ Suporte a múltiplos ambientes (DEV/TEST/PROD)
- ✅ Histórico completo de exportações
- ✅ Validações de permissão e prazo
- ✅ Modo prévia para testar antes de executar definitivo

---

## 3. COMO FUNCIONA?

### 🔧 Procedure Oracle (Coração da Exportação)

A exportação chama a procedure **dispatcher** que roteia para o processo correto:

```sql
-- 1. Procedure DISPATCHER (roteador)
GC.PGK_GLOBAL.P_MCW_FECHA_COMISSAO_GLOBAL(
    p_codigo           VARCHAR2,  -- '90000001' (código fixo Unimed)
    p_mes              NUMBER,    -- Mês: 1
    p_ano              NUMBER,    -- Ano: 2026
    p_previa           CHAR(1),   -- 'S' = prévia, 'N' = definitivo
    p_apaga            CHAR(1),   -- 'S' = limpa dados antigos
    p_usuario          VARCHAR2,  -- Quem está executando
    p_todas_empresas   CHAR(1),   -- 'N' = empresa específica
    p_cod_empresa      NUMBER,    -- Código da empresa
    p_cod_band         NUMBER,    -- Bandeira da empresa
    p_tipo             VARCHAR2,  -- 'S' = simplificado, 'C' = completo
    p_categoria        VARCHAR2,  -- 'UNI' (fixo)
    p_cpf              VARCHAR2   -- CPF específico (ou null)
)
```

Esta procedure identifica o código `90000001` e chama:

```sql
-- 2. Procedure REAL de Exportação
PKG_UNI_SAUDE.P_EXP_PLANO_SAUDE(
    p_usuario          VARCHAR2,
    p_mes              NUMBER,
    p_ano              NUMBER,
    p_todas_empresas   CHAR(1),
    p_cpf              VARCHAR2
)
```

### 📤 O Que a Exportação Faz?

**Passo a Passo da Procedure `P_EXP_PLANO_SAUDE`:**

#### **1. Limpar Dados Antigos (Se `p_apaga='S'`)**

```sql
DELETE FROM rm.pffinanc@dblrm  -- ou @rmteste em ambiente de teste
WHERE codperFF = 4             -- Período fixo Unimed
  AND ideventofolha = '7611'   -- Evento fixo Unimed
  AND PERIODO = 'AAAAMM'       -- Formato: 202601
  AND chapa IN (
    SELECT chapa FROM vw_uni_resumo_colaborador
    WHERE mes_ref = p_mes AND ano_ref = p_ano
  );
```

#### **2. Atualizar/Inserir Período de Folha**

```sql
-- Tenta atualizar
UPDATE rm.pfperff@dblrm
SET status = 0,                  -- Aberto para lançamentos
    dataabertperf = SYSDATE
WHERE codperFF = 4
  AND PERIODO = 'AAAAMM';

-- Se não existir, insere
INSERT INTO rm.pfperff@dblrm (
    codcoligada, codfilial, nroperiodo, periodo,
    status, dataabertperf, codperFF
)
SELECT codcoligada, codfilial, 4, 'AAAAMM',
       0, SYSDATE, 4
FROM vw_uni_resumo_colaborador
WHERE mes_ref = p_mes AND ano_ref = p_ano;
```

#### **3. Exportar Lançamentos Financeiros**

Para cada colaborador com `exporta='S'` e `export_totvs='S'`:

```sql
-- Tenta atualizar lançamento existente
UPDATE rm.pffinanc@dblrm
SET valor = r.valor_total
WHERE chapa = r.chapa
  AND ideventofolha = '7611'
  AND codperFF = 4
  AND PERIODO = 'AAAAMM';

-- Se não existir, insere novo
INSERT INTO rm.pffinanc@dblrm (
    codcoligada, chapa, codfilial, nroperiodo,
    periodo, ideventofolha, valor,
    codperFF, valororig, situacao
)
VALUES (
    r.codcoligada, r.chapa, r.codfilial, 4,
    'AAAAMM', '7611', r.valor_total,
    4, r.valor_total, 'P'
);
```

### 📊 Tabelas TOTVS RM Afetadas

#### **1. rm.pffinanc** - Lançamentos Financeiros

| Campo           | Descrição                | Valor Fixo |
| --------------- | ------------------------ | ---------- |
| `codcoligada`   | Código da coligada       | Dinâmico   |
| `chapa`         | Matrícula do colaborador | Dinâmico   |
| `codfilial`     | Código da filial         | Dinâmico   |
| `nroperiodo`    | Número do período        | **4**      |
| `periodo`       | Período formato AAAAMM   | Ex: 202601 |
| `ideventofolha` | Código do evento         | **7611**   |
| `valor`         | Valor total a pagar      | Dinâmico   |
| `codperFF`      | Código período folha     | **4**      |
| `valororig`     | Valor original           | = valor    |
| `situacao`      | Status do lançamento     | **P**      |

#### **2. rm.pfperff** - Períodos de Folha

| Campo           | Descrição              | Valor Fixo |
| --------------- | ---------------------- | ---------- |
| `codcoligada`   | Código da coligada     | Dinâmico   |
| `codfilial`     | Código da filial       | Dinâmico   |
| `nroperiodo`    | Número do período      | **4**      |
| `periodo`       | Período formato AAAAMM | Ex: 202601 |
| `status`        | Status do período      | **0**      |
| `dataabertperf` | Data abertura período  | SYSDATE    |
| `codperFF`      | Código período folha   | **4**      |

### 🔐 Constantes Importantes

| Constante       | Valor    | Descrição                     |
| --------------- | -------- | ----------------------------- |
| Código Processo | 90000001 | Identifica exportação Unimed  |
| Evento Folha    | 7611     | Código do evento no TOTVS     |
| Número Período  | 4        | Período fixo para plano saúde |
| Categoria       | UNI      | Categoria fixa Unimed         |

---

## 4. AMBIENTES DE EXECUÇÃO

O módulo suporta **3 ambientes** com comportamentos diferentes:

### 🔍 Ambiente 1: DEVELOPMENT (Preview)

**Quando ativa:**

- `NODE_ENV=development` (ou não definido)
- **E** `ALLOW_TOTVS_EXPORT ≠ 'true'`

**Comportamento:**

- ✅ **NÃO executa** procedure real
- ✅ Retorna preview com dados simulados
- ✅ Query apenas `gc.vw_uni_resumo_colaborador`
- ✅ **Seguro** para desenvolvimento

**Response:**

```json
{
  "sucesso": true,
  "mensagem": "[PREVIEW] Simulação concluída - 45 colaborador(es), Total: R$ 125430.50",
  "modo": "PREVIEW",
  "aviso": "Exportação não executada (ambiente development). Dados simulados.",
  "preview": {
    "colaboradoresAfetados": 45,
    "valorTotal": 125430.50,
    "dados": [...]
  }
}
```

---

### ⚡ Ambiente 2: TEST/STAGING (Execução Real em Base Teste)

**Quando ativa:**

- `NODE_ENV=test` **OU** `NODE_ENV=staging`

**Comportamento:**

- ⚠️ **Executa** procedure real
- ⚠️ **AFETA** tabelas TOTVS RM de TESTE
- ⚠️ Requer DB_LINK `@rmteste` configurado

**Configuração Necessária:**

Na procedure `PKG_UNI_SAUDE.P_EXP_PLANO_SAUDE`, descomentar linhas com `@rmteste`:

```sql
-- COMENTAR (produção):
-- delete from rm.pffinanc@dblrm

-- DESCOMENTAR (teste):
delete from rm.pffinanc@rmteste
```

**Ou criar sinônimos:**

```sql
CREATE OR REPLACE SYNONYM rm_pffinanc FOR rm.pffinanc@rmteste;
CREATE OR REPLACE SYNONYM rm_pfperff FOR rm.pfperff@rmteste;
```

**Response:**

```json
{
  "sucesso": true,
  "mensagem": "EXPORTAÇÃO executada com sucesso para todos os colaboradores...",
  "modo": "EXECUÇÃO REAL (TESTE)",
  "ambiente": "test",
  "aviso": "⚠️ Executando em base de teste. Certifique-se que @rmteste está configurado."
}
```

---

### 🔴 Ambiente 3: PRODUCTION (Execução Real em Base Produção)

**Quando ativa:**

- `NODE_ENV=production`

**Comportamento:**

- 🔴 **Executa** procedure real
- 🔴 **AFETA** tabelas TOTVS RM de PRODUÇÃO
- 🔴 Usa DB_LINK `@dblrm` (produção)

**Response:**

```json
{
  "sucesso": true,
  "mensagem": "EXPORTAÇÃO executada com sucesso para todos os colaboradores...",
  "modo": "EXECUÇÃO REAL",
  "ambiente": "production"
}
```

---

### 🎛️ Variáveis de Ambiente

| Variável             | Valores                                        | Padrão        | Efeito                               |
| -------------------- | ---------------------------------------------- | ------------- | ------------------------------------ |
| `NODE_ENV`           | `development`, `test`, `staging`, `production` | `development` | Define ambiente                      |
| `ALLOW_TOTVS_EXPORT` | `true`, `false`                                | `false`       | Override para forçar execução em DEV |

**Exemplos:**

```bash
# Preview (seguro)
NODE_ENV=development npm start

# Teste (base teste)
NODE_ENV=test npm start

# Produção (cuidado!)
NODE_ENV=production npm start

# Forçar execução em DEV (não recomendado)
NODE_ENV=development ALLOW_TOTVS_EXPORT=true npm start
```

---

## 5. ENDPOINTS DA API

### 📍 **Base URL:** `http://localhost:3000/exportacao`

---

### **1. POST /totvs** 📤

**Descrição:** Executa exportação de dados para TOTVS RM

**Quando usar:**

- Após executar todos os processos de fechamento
- Quando dados estão validados e prontos
- Para enviar lançamentos ao TOTVS RM

**Permissões Necessárias:**

- `DP` (Departamento Pessoal) **OU**
- `ADMIN` (Administrador)

**Request Body:**

| Campo     | Tipo    | Obrigatório | Descrição                           | Exemplo |
| --------- | ------- | ----------- | ----------------------------------- | ------- |
| `mesRef`  | number  | ✅ Sim      | Mês (1-12)                          | 1       |
| `anoRef`  | number  | ✅ Sim      | Ano (>=2000)                        | 2026    |
| `empresa` | string  | ✅ Sim      | Código da empresa                   | "1"     |
| `previa`  | boolean | ❌ Não      | Prévia (true) ou definitivo (false) | false   |
| `apagar`  | boolean | ❌ Não      | Apagar dados antigos (true/false)   | false   |
| `cpf`     | string  | ❌ Não      | CPF específico (null = todos)       | null    |

**Validações:**

1. ✅ **Mês:** Entre 1 e 12
2. ✅ **Ano:** Maior ou igual a 2000
3. ✅ **Empresa:** Deve existir no banco
4. ✅ **Período:** Deve estar fechado
5. ✅ **Prazo:** Dentro do prazo ou com permissão especial
6. ✅ **Apagar:** Requer permissão DP ou ADMIN
7. ✅ **Fora do Prazo:** Requer permissão ADMIN

**Exemplo Request (Exportação Definitiva):**

```http
POST /exportacao/totvs
Content-Type: application/json
Authorization: Bearer <token>

{
  "mesRef": 1,
  "anoRef": 2026,
  "empresa": "1",
  "previa": false,
  "apagar": false
}
```

**Response 200 OK (Preview - Development):**

```json
{
  "sucesso": true,
  "mensagem": "[PREVIEW] Simulação concluída - 45 colaborador(es), Total: R$ 125430.50",
  "modo": "PREVIEW",
  "aviso": "Exportação não executada (ambiente development). Dados simulados.",
  "preview": {
    "colaboradoresAfetados": 45,
    "valorTotal": 125430.5,
    "dados": [
      {
        "cpf": "12345678901",
        "nome": "João Silva",
        "chapa": "00123",
        "valorTotal": 850.0,
        "exporta": "S",
        "exportTotvs": "S"
      }
    ]
  },
  "timestamp": "2026-01-28T10:30:00Z"
}
```

**Response 200 OK (Execução Real - Production):**

```json
{
  "sucesso": true,
  "mensagem": "EXPORTAÇÃO executada com sucesso para todos os colaboradores da empresa 1 no período 1/2026",
  "modo": "EXECUÇÃO REAL",
  "ambiente": "production",
  "timestamp": "2026-01-28T10:30:00Z"
}
```

**Exemplo Request (Prévia para Testar):**

```http
POST /exportacao/totvs
Content-Type: application/json
Authorization: Bearer <token>

{
  "mesRef": 1,
  "anoRef": 2026,
  "empresa": "1",
  "previa": true,     // ← PRÉVIA!
  "apagar": false
}
```

**Exemplo Request (Colaborador Específico):**

```http
POST /exportacao/totvs
Content-Type: application/json
Authorization: Bearer <token>

{
  "mesRef": 1,
  "anoRef": 2026,
  "empresa": "1",
  "previa": false,
  "apagar": false,
  "cpf": "12345678901"  // ← Apenas este CPF
}
```

**Exemplo Request (Apagar e Reprocessar):**

```http
POST /exportacao/totvs
Content-Type: application/json
Authorization: Bearer <token>

{
  "mesRef": 1,
  "anoRef": 2026,
  "empresa": "1",
  "previa": false,
  "apagar": true      // ← APAGA dados antigos (requer DP/ADMIN)
}
```

**Errors:**

```json
// 400 Bad Request - Validação
{
  "sucesso": false,
  "mensagem": "Mês deve ser maior ou igual a 1",
  "timestamp": "2026-01-28T10:30:00Z"
}

// 403 Forbidden - Sem permissão
{
  "sucesso": false,
  "mensagem": "Você não possui autorização para apagar dados antigos",
  "timestamp": "2026-01-28T10:30:00Z"
}

// 404 Not Found - Empresa não existe
{
  "sucesso": false,
  "mensagem": "Empresa com código 999 não encontrada",
  "timestamp": "2026-01-28T10:30:00Z"
}

// 403 Forbidden - Fora do prazo
{
  "sucesso": false,
  "mensagem": "Processo Exportação Plano Saúde Unimed passou da data limite de exportação. Máximo: 10/02/2026",
  "timestamp": "2026-01-28T10:30:00Z"
}

// 500 Internal Server Error - Erro Oracle
{
  "sucesso": false,
  "mensagem": "Erro ao executar exportação: ORA-02019: connection description for remote database not found",
  "timestamp": "2026-01-28T10:30:00Z"
}
```

---

### **2. GET /logs** 📚

**Descrição:** Busca histórico de exportações executadas

**Quando usar:**

- Auditar quem exportou e quando
- Verificar se exportação já foi feita
- Investigar erros em exportações passadas
- Gerar relatórios de exportações

**Permissões Necessárias:**

- `DP` **OU** `ADMIN`

**Query Parameters:**

| Parâmetro   | Tipo   | Obrigatório | Descrição          | Exemplo    |
| ----------- | ------ | ----------- | ------------------ | ---------- |
| `categoria` | string | ❌ Não      | Categoria          | "UNI"      |
| `mes`       | number | ❌ Não      | Filtrar por mês    | 1          |
| `ano`       | number | ❌ Não      | Filtrar por ano    | 2026       |
| `codigo`    | string | ❌ Não      | Código do processo | "90000001" |

**Exemplo Request (Todos os logs Unimed):**

```http
GET /exportacao/logs?categoria=UNI
```

**Exemplo Request (Janeiro/2026):**

```http
GET /exportacao/logs?categoria=UNI&mes=1&ano=2026
```

**Response 200 OK:**

```json
{
  "sucesso": true,
  "dados": [
    {
      "id": 5678,
      "codigo": "90000001",
      "categoria": "UNI",
      "descricao": "Exportação Plano Saúde Unimed",
      "mesRef": 1,
      "anoRef": 2026,
      "usuario": "joao.silva",
      "dataProc": "2026-01-28T14:30:00.000Z",
      "apaga": "N",
      "previa": "N",
      "duracao": 78,
      "erro": null
    },
    {
      "id": 5677,
      "codigo": "90000001",
      "categoria": "UNI",
      "descricao": "Exportação Plano Saúde Unimed",
      "mesRef": 1,
      "anoRef": 2026,
      "usuario": "maria.santos",
      "dataProc": "2026-01-27T10:15:00.000Z",
      "apaga": "S",
      "previa": "S",
      "duracao": 45,
      "erro": "ORA-02019: connection description for remote database not found"
    }
  ],
  "total": 2,
  "timestamp": "2026-01-28T10:30:00Z"
}
```

**Campos do Response:**

| Campo       | Tipo   | Descrição                               |
| ----------- | ------ | --------------------------------------- |
| `id`        | number | ID único da execução                    |
| `codigo`    | string | Código do processo (sempre '90000001')  |
| `categoria` | string | Categoria (sempre 'UNI')                |
| `descricao` | string | "Exportação Plano Saúde Unimed"         |
| `mesRef`    | number | Mês exportado                           |
| `anoRef`    | number | Ano exportado                           |
| `usuario`   | string | Quem executou                           |
| `dataProc`  | string | Data/hora da execução (ISO 8601)        |
| `apaga`     | string | Se apagou dados ('S' ou 'N')            |
| `previa`    | string | Se foi prévia ('S') ou definitivo ('N') |
| `duracao`   | number | Tempo de execução em segundos           |
| `erro`      | string | Mensagem de erro (null se sucesso)      |

---

### **3. GET /status** ⚙️

**Descrição:** Retorna status do sistema de exportação e ambiente atual

**Quando usar:**

- Antes de executar exportação (verificar ambiente)
- Troubleshooting (identificar modo de execução)
- Validar configuração do sistema
- Verificar se está em modo preview ou real

**Permissões Necessárias:**

- `DP` **OU** `ADMIN`

**Exemplo Request:**

```http
GET /exportacao/status
```

**Response 200 OK (Development):**

```json
{
  "sucesso": true,
  "ambiente": "development",
  "modoExecucao": "PREVIEW",
  "permitirExportacao": false,
  "avisos": [
    "🔴 Ambiente de desenvolvimento detectado",
    "✅ Exportações retornarão preview sem executar procedure",
    "💡 Para habilitar execução: NODE_ENV=test ou ALLOW_TOTVS_EXPORT=true"
  ],
  "configuracao": {
    "dbLinkEsperado": "@dblrm",
    "tabelasAfetadas": ["rm.pffinanc", "rm.pfperff"]
  },
  "codigoProcesso": "90000001",
  "descricao": "Exportação Plano Saúde Unimed",
  "timestamp": "2026-01-28T10:30:00Z"
}
```

**Response 200 OK (Test/Staging):**

```json
{
  "sucesso": true,
  "ambiente": "test",
  "modoExecucao": "EXECUÇÃO REAL (TESTE)",
  "permitirExportacao": true,
  "avisos": [
    "⚠️ Ambiente de teste/staging detectado",
    "✅ Exportações serão executadas na base de TESTE",
    "📋 Certifique-se que DB_LINK @rmteste está configurado",
    "💡 Procedure deve usar: rm.pffinanc@rmteste, rm.pfperff@rmteste"
  ],
  "configuracao": {
    "dbLinkEsperado": "@rmteste",
    "tabelasAfetadas": ["rm.pffinanc", "rm.pfperff"]
  },
  "codigoProcesso": "90000001",
  "descricao": "Exportação Plano Saúde Unimed",
  "timestamp": "2026-01-28T10:30:00Z"
}
```

**Response 200 OK (Production):**

```json
{
  "sucesso": true,
  "ambiente": "production",
  "modoExecucao": "EXECUÇÃO REAL (PRODUÇÃO)",
  "permitirExportacao": true,
  "avisos": [
    "🔴 Ambiente de PRODUÇÃO",
    "⚠️ Exportações afetarão base TOTVS RM de produção (@dblrm)"
  ],
  "configuracao": {
    "dbLinkEsperado": "@dblrm",
    "tabelasAfetadas": ["rm.pffinanc", "rm.pfperff"]
  },
  "codigoProcesso": "90000001",
  "descricao": "Exportação Plano Saúde Unimed",
  "timestamp": "2026-01-28T10:30:00Z"
}
```

---

## 6. FLUXO COMPLETO DE USO

### 📋 Cenário Típico: Exportação Mensal

**Objetivo:** Exportar dados de Janeiro/2026 da empresa 1 para TOTVS RM

---

#### **Passo 1: Importar Dados** ✅ (Já implementado)

```http
GET /api/v1/importacao/dados-periodo-cnpj?mes=1&ano=2026
```

**Resultado:** Dados em `uni_dados_cobranca`

---

#### **Passo 2: Executar Resumo** ✅ (Já implementado)

```http
GET /api/v1/importacao/executar-resumo?mes=1&ano=2026
```

**Resultado:** Dados em `uni_resumo_colaborador`

---

#### **Passo 3: Ajustar Colaboradores** ✅ (Já implementado)

```http
GET /api/v1/colaboradores?codEmpresa=1&mes=1&ano=2026
```

Revisar lista e marcar quem **não** deve ser exportado.

---

#### **Passo 4: Executar Processos** ✅ (Já implementado)

```http
POST /api/v1/processos/executar
Content-Type: application/json

{
  "processo": "UNIEF",
  "mesRef": 1,
  "anoRef": 2026,
  "categoria": "UNI",
  "tipoComissao": "S",
  "previa": "N",
  "apaga": "N",
  "codEmpresa": 1
}
```

**Resultado:** Período fechado e consolidado

---

#### **Passo 5: Verificar Status do Sistema** (Novo!)

```http
GET /exportacao/status
```

**Response:**

```json
{
  "ambiente": "test",
  "modoExecucao": "EXECUÇÃO REAL (TESTE)",
  "permitirExportacao": true,
  "avisos": [
    "⚠️ Ambiente de teste/staging detectado",
    "✅ Exportações serão executadas na base de TESTE"
  ]
}
```

✅ Confirmar que está no ambiente correto!

---

#### **Passo 6: Executar Exportação em PRÉVIA** (Novo!)

Antes de exportar definitivamente, sempre teste em modo prévia:

```http
POST /exportacao/totvs
Content-Type: application/json
Authorization: Bearer <token>

{
  "mesRef": 1,
  "anoRef": 2026,
  "empresa": "1",
  "previa": true,      // ← PRÉVIA!
  "apagar": false
}
```

**Response:**

```json
{
  "sucesso": true,
  "mensagem": "[PREVIEW] Simulação concluída - 45 colaborador(es), Total: R$ 125430.50",
  "preview": {
    "colaboradoresAfetados": 45,
    "valorTotal": 125430.50,
    "dados": [...]
  }
}
```

**✅ Validar:**

- Quantidade de colaboradores está correta?
- Valor total bate com esperado?
- Lista de colaboradores está correta?

---

#### **Passo 7: Executar Exportação DEFINITIVA** (Novo!)

Se prévia OK, executar definitivo:

```http
POST /exportacao/totvs
Content-Type: application/json
Authorization: Bearer <token>

{
  "mesRef": 1,
  "anoRef": 2026,
  "empresa": "1",
  "previa": false,     // ← DEFINITIVO!
  "apagar": false
}
```

**Response:**

```json
{
  "sucesso": true,
  "mensagem": "EXPORTAÇÃO executada com sucesso para todos os colaboradores da empresa 1 no período 1/2026",
  "modo": "EXECUÇÃO REAL",
  "ambiente": "production"
}
```

✅ **Exportação concluída!**

---

#### **Passo 8: Validar no TOTVS RM**

Após exportação, validar no banco TOTVS RM:

```sql
-- Verificar lançamentos financeiros
SELECT *
FROM rm.pffinanc@dblrm
WHERE codperFF = 4
  AND ideventofolha = '7611'
  AND periodo = '202601'
ORDER BY chapa;

-- Verificar período de folha
SELECT *
FROM rm.pfperff@dblrm
WHERE codperFF = 4
  AND periodo = '202601';
```

---

#### **Passo 9: Consultar Histórico**

```http
GET /exportacao/logs?categoria=UNI&mes=1&ano=2026
```

Ver histórico de todas as exportações do período.

---

## 7. REGRAS DE NEGÓCIO IMPORTANTES

### 🔐 Permissões

#### **1. Exportar (Básico)**

- **Roles:** `DP` ou `ADMIN`
- **Ação:** Executar exportação normal

#### **2. Apagar Dados Antigos**

- **Roles:** `DP` ou `ADMIN`
- **Ação:** Usar `apagar: true`
- **Equivale a:** Permissão 78004 do legado

#### **3. Executar Fora do Prazo**

- **Role:** `ADMIN` (apenas)
- **Ação:** Exportar após prazo limite
- **Equivale a:** Permissão 78005 do legado

### 📅 Validação de Prazo

```javascript
// Cálculo do prazo
const dataFinal = await buscarDataFinalPeriodo(mes, ano);
const configProcesso = await buscarConfigProcesso('90000001');
const dataMaxima = dataFinal + configProcesso.dias;

// Exemplo:
// dataFinal: 31/01/2026
// dias: 10
// dataMaxima: 10/02/2026

if (hoje > dataMaxima && !usuarioIsAdmin) {
  throw new ForbiddenException('Processo passou da data limite');
}
```

### 🎯 Filtros de Colaboradores

A exportação SEMPRE considera apenas colaboradores que atendem **TODOS** os critérios:

```sql
SELECT * FROM vw_uni_resumo_colaborador
WHERE mes_ref = :mes
  AND ano_ref = :ano
  AND exporta = 'S'           -- Marcado para exportar
  AND export_totvs = 'S'      -- Marcado especificamente para TOTVS
  AND valor_total > 0;        -- Tem valor a pagar
```

**Flags importantes:**

| Flag           | Valores | Descrição                                   |
| -------------- | ------- | ------------------------------------------- |
| `exporta`      | S/N     | Define se colaborador vai para folha        |
| `export_totvs` | S/N     | Define se vai especificamente para TOTVS RM |

### 🔄 Modo Prévia vs Definitivo

| Aspecto        | Prévia (`previa: true`)   | Definitivo (`previa: false`)  |
| -------------- | ------------------------- | ----------------------------- |
| **Procedure**  | Passa flag `P_PREVIA='S'` | Passa flag `P_PREVIA='N'`     |
| **Commit**     | ❌ Não comita (rollback)  | ✅ Comita transação           |
| **Tabelas RM** | ❌ Não afetadas           | ✅ Afetadas                   |
| **Logs**       | ✅ Registrado como prévia | ✅ Registrado como definitivo |
| **Uso**        | Testar antes              | Executar de verdade           |

### 🗑️ Apagar Dados Antigos

Quando `apagar: true`:

```sql
-- Remove lançamentos antigos do período/empresa
DELETE FROM rm.pffinanc@dblrm
WHERE codperFF = 4
  AND ideventofolha = '7611'
  AND periodo = '202601'
  AND chapa IN (SELECT chapa FROM vw_uni_resumo_colaborador...);
```

**⚠️ Use com cuidado!**

- Apaga dados existentes antes de reprocessar
- Útil para correções
- Requer permissão DP/ADMIN

### 👤 Exportação por CPF

Quando `cpf` informado:

```javascript
// Exporta apenas 1 colaborador específico
{
  "mesRef": 1,
  "anoRef": 2026,
  "empresa": "1",
  "previa": false,
  "cpf": "12345678901"  // ← Apenas este
}
```

**Validação:** Se CPF informado, `codEmpresa` é obrigatório.

---

## 8. EXEMPLOS PRÁTICOS

### 📝 Exemplo 1: Primeira Exportação do Mês

**Cenário:** Primeira vez exportando Janeiro/2026

```http
POST /exportacao/totvs
Content-Type: application/json
Authorization: Bearer <token>

{
  "mesRef": 1,
  "anoRef": 2026,
  "empresa": "1",
  "previa": true,      // Testar primeiro
  "apagar": false      // Não precisa apagar (primeira vez)
}
```

✅ **Se preview OK**, executar definitivo:

```http
POST /exportacao/totvs
Content-Type: application/json

{
  "mesRef": 1,
  "anoRef": 2026,
  "empresa": "1",
  "previa": false,     // Definitivo
  "apagar": false
}
```

---

### 📝 Exemplo 2: Correção (Reprocessar)

**Cenário:** Já exportou, mas precisa corrigir valores

```http
POST /exportacao/totvs
Content-Type: application/json
Authorization: Bearer <token>

{
  "mesRef": 1,
  "anoRef": 2026,
  "empresa": "1",
  "previa": false,
  "apagar": true       // ← APAGA dados antigos e reprocessa
}
```

⚠️ **Requer:** Permissão DP ou ADMIN

---

### 📝 Exemplo 3: Colaborador Específico

**Cenário:** Exportar apenas 1 colaborador que estava com problema

```http
POST /exportacao/totvs
Content-Type: application/json
Authorization: Bearer <token>

{
  "mesRef": 1,
  "anoRef": 2026,
  "empresa": "1",
  "previa": false,
  "apagar": false,
  "cpf": "12345678901"  // ← Apenas este CPF
}
```

---

### 📝 Exemplo 4: Exportação Fora do Prazo

**Cenário:** Prazo limite já passou, mas ADMIN precisa exportar

```http
POST /exportacao/totvs
Content-Type: application/json
Authorization: Bearer <admin-token>  // ← Token de ADMIN

{
  "mesRef": 12,        // Mês passado
  "anoRef": 2025,
  "empresa": "1",
  "previa": false,
  "apagar": false
}
```

⚠️ **Requer:** Role ADMIN (apenas)

---

### 📝 Exemplo 5: Verificar Se Já Foi Exportado

```http
GET /exportacao/logs?categoria=UNI&mes=1&ano=2026&codigo=90000001
```

**Response:**

```json
{
  "dados": [
    {
      "mesRef": 1,
      "anoRef": 2026,
      "usuario": "joao.silva",
      "dataProc": "2026-01-28T14:30:00Z",
      "previa": "N", // ← Definitivo
      "duracao": 78,
      "erro": null // ← Sucesso
    }
  ]
}
```

✅ **Já foi exportado com sucesso!**

---

## 9. TROUBLESHOOTING

### ❌ Erro: "Empresa com código X não encontrada"

**Causa:** Código da empresa inválido

**Solução:**

```sql
-- Verificar códigos válidos
SELECT cod_empresa, cnpj
FROM gc.empresa_filial
WHERE processa_unimed = 'S'
ORDER BY cod_empresa;
```

---

### ❌ Erro: "Período de fechamento não encontrado"

**Causa:** Mês/ano não tem período cadastrado

**Solução:**

```sql
-- Verificar períodos cadastrados
SELECT mes_ref, ano_ref, data_inicial, data_final
FROM gc.mcw_periodo_fechamento
ORDER BY ano_ref DESC, mes_ref DESC;

-- Inserir período se necessário
INSERT INTO gc.mcw_periodo_fechamento (
    mes_ref, ano_ref, data_inicial, data_final
) VALUES (
    1, 2026, TO_DATE('2026-01-01', 'YYYY-MM-DD'), TO_DATE('2026-01-31', 'YYYY-MM-DD')
);
```

---

### ❌ Erro: "Processo 90000001 não encontrado"

**Causa:** Processo de exportação não cadastrado ou inativo

**Solução:**

```sql
-- Verificar processo
SELECT codigo, descricao, ativo
FROM gc.mcw_processo
WHERE codigo = '90000001';

-- Ativar se necessário
UPDATE gc.mcw_processo
SET ativo = 'S'
WHERE codigo = '90000001';

-- Inserir se não existir
INSERT INTO gc.mcw_processo (
    codigo, descricao, categoria, ordem, dias, ativo
) VALUES (
    '90000001', 'Exportação Plano Saúde Unimed', 'UNI', 99, 10, 'S'
);
```

---

### ❌ Erro: "Você não possui autorização para apagar dados antigos"

**Causa:** Tentou usar `apagar: true` sem permissão

**Solução:** Usuário precisa ter role `DP` ou `ADMIN`

---

### ❌ Erro: "Processo passou da data limite de exportação"

**Causa:** Tentou exportar após prazo sem ser ADMIN

**Solução:**

- Opção 1: Usar usuário com role `ADMIN`
- Opção 2: Aumentar dias limite do processo (se justificável)

```sql
UPDATE gc.mcw_processo
SET dias = 15  -- Aumentar prazo
WHERE codigo = '90000001';
```

---

### ❌ Erro: "ORA-02019: connection description for remote database not found"

**Causa:** DB_LINK `@dblrm` ou `@rmteste` não configurado

**Solução:**

```sql
-- Verificar DB_LINKS
SELECT db_link, username, host
FROM all_db_links
WHERE db_link IN ('DBLRM', 'RMTESTE');

-- Criar DB_LINK se necessário (DBA)
CREATE DATABASE LINK dblrm
  CONNECT TO <user> IDENTIFIED BY <password>
  USING '(DESCRIPTION=(ADDRESS=(PROTOCOL=TCP)(HOST=<host>)(PORT=1521))(CONNECT_DATA=(SERVICE_NAME=<service>)))';
```

---

### ⚠️ Aviso: "Executando em base de teste"

**Não é erro!** Sistema detectou `NODE_ENV=test` e está alertando.

**Validar:**

1. Procedure usa `@rmteste` (não `@dblrm`)
2. DB_LINK `@rmteste` está configurado
3. Base de teste está OK para receber dados

---

### 🔍 Debug: Verificar Dados Antes de Exportar

```sql
-- Ver o que será exportado
SELECT
    cpf, nome, chapa, valor_total,
    exporta, export_totvs
FROM gc.vw_uni_resumo_colaborador
WHERE mes_ref = 1
  AND ano_ref = 2026
  AND exporta = 'S'
  AND export_totvs = 'S'
  AND valor_total > 0
ORDER BY valor_total DESC;

-- Conferir totais
SELECT
    COUNT(*) as total_colaboradores,
    SUM(valor_total) as valor_total
FROM gc.vw_uni_resumo_colaborador
WHERE mes_ref = 1
  AND ano_ref = 2026
  AND exporta = 'S'
  AND export_totvs = 'S';
```

---

### 🔍 Debug: Verificar Dados no TOTVS Após Exportar

```sql
-- Lançamentos financeiros
SELECT
    f.chapa,
    f.valor,
    f.periodo,
    f.ideventofolha
FROM rm.pffinanc@dblrm f
WHERE f.codperFF = 4
  AND f.periodo = '202601'
  AND f.ideventofolha = '7611'
ORDER BY f.valor DESC;

-- Totalizar
SELECT
    COUNT(*) as total_lancamentos,
    SUM(valor) as valor_total
FROM rm.pffinanc@dblrm
WHERE codperFF = 4
  AND periodo = '202601'
  AND ideventofolha = '7611';
```

---

## 📚 REFERÊNCIAS

### Documentação Relacionada

- [ANALISE_MODULO_EXPORTACAO.md](./ANALISE_MODULO_EXPORTACAO.md) - Análise técnica completa
- [AMBIENTES_EXPORTACAO_TOTVS.md](./AMBIENTES_EXPORTACAO_TOTVS.md) - Detalhes dos ambientes
- [DOCUMENTACAO_PROCESSOS.md](./DOCUMENTACAO_PROCESSOS.md) - Módulo anterior (processos)
- [pkg.uni_saude.sql](./pkg.uni_saude.sql) - Código fonte da procedure

### Arquivos de Código

- **Domain:** `src/domain/repositories/exportacao.repository.interface.ts`
- **Application:** `src/application/use-cases/exportacao/exportar-para-totvs.use-case.ts`
- **Infrastructure:** `src/infrastructure/repositories/exportacao.repository.ts`
- **Presentation:** `src/presentation/controllers/exportacao.controller.ts`
- **DTO:** `src/application/dtos/exportacao/exportar-para-totvs.dto.ts`

### Procedures Oracle

- **Dispatcher:** `GC.PGK_GLOBAL.P_MCW_FECHA_COMISSAO_GLOBAL`
- **Exportação Real:** `PKG_UNI_SAUDE.P_EXP_PLANO_SAUDE`

### Tabelas Oracle

**Sistema Gestão (GC):**

- `gc.mcw_periodo_fechamento` - Períodos de fechamento
- `gc.mcw_processo` - Cadastro de processos
- `gc.mcw_processo_log` - Histórico de execuções
- `gc.vw_uni_resumo_colaborador` - View com dados resumidos
- `gc.empresa_filial` - Cadastro de empresas

**TOTVS RM:**

- `rm.pffinanc@dblrm` - Lançamentos financeiros (produção)
- `rm.pfperff@dblrm` - Períodos de folha (produção)
- `rm.pffinanc@rmteste` - Lançamentos financeiros (teste)
- `rm.pfperff@rmteste` - Períodos de folha (teste)

---

## 🎯 RESUMO EXECUTIVO

### O Que É?

Módulo que exporta dados processados da Unimed para o TOTVS RM (folha de pagamento).

### Quando Usar?

Após importar, resumir, ajustar colaboradores e executar processos de fechamento.

### Como Usar?

```http
POST /exportacao/totvs
{ "mesRef": 1, "anoRef": 2026, "empresa": "1", "previa": false }
```

### Segurança

- ✅ Preview automático em development
- ✅ Execução real apenas em test/staging/production
- ✅ Validação de permissões e prazos
- ✅ Histórico completo de execuções

### Próximos Passos

1. Testar em ambiente de desenvolvimento (preview)
2. Configurar `@rmteste` para ambiente de teste
3. Testar exportação real em base de teste
4. Deploy em produção com `NODE_ENV=production`

---

**✅ Documentação completa do módulo de exportação TOTVS!**

**Última atualização:** 28 de Janeiro de 2026  
**Versão:** 1.0
