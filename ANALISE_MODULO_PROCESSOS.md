# ⚙️ ANÁLISE COMPLETA - MÓDULO PROCESSOS UNIMED

**Data:** 26 de Janeiro de 2026  
**Versão:** 1.0  
**Status:** Análise para implementação do zero  
**Prioridade:** 🟡 ALTA - Necessário para exportação TOTVS

---

## 📋 ÍNDICE

1. [Visão Geral](#visão-geral)
2. [Análise do Legacy (PHP)](#análise-do-legacy-php)
3. [Estado Atual no NestJS](#estado-atual-no-nestjs)
4. [Especificação de Implementação](#especificação-de-implementação)
5. [Plano de Implementação](#plano-de-implementação)
6. [Estimativas e Prioridades](#estimativas-e-prioridades)

---

## 🎯 VISÃO GERAL

### O Que É o Módulo de Processos?

O módulo de processos é responsável por **executar rotinas de fechamento e processamento** dos dados da Unimed, preparando-os para exportação ao TOTVS. É o **passo intermediário** crítico entre a importação/gestão de colaboradores e a exportação final.

### 🔄 Fluxo Completo do Sistema

```
1. ✅ IMPORTAÇÃO
   └─> Dados brutos da API Unimed → uni_dados_cobranca

2. ✅ EXECUTAR RESUMO
   └─> Procedure p_uni_resumo → uni_resumo_colaborador

3. ✅ GESTÃO COLABORADORES
   └─> Ajustar flag exporta='S'/'N'

4. ⏳ PROCESSOS (ESTE MÓDULO) ⬅️ VOCÊ ESTÁ AQUI
   └─> Executar P_MCW_FECHA_COMISSAO_GLOBAL
   └─> Finaliza/consolida dados
   └─> Prepara para exportação

5. ⏳ EXPORTAÇÃO TOTVS
   └─> Gera arquivo com colaboradores exporta='S'
```

### 📊 Status Atual

| Componente     | Legacy PHP           | NestJS       | Gap  |
| -------------- | -------------------- | ------------ | ---- |
| **Endpoints**  | 4 actions            | 0 endpoints  | 100% |
| **DTOs**       | N/A                  | 0 criados    | 100% |
| **Use Cases**  | 2 métodos DAO        | 0 use cases  | 100% |
| **Repository** | UnimedDAO            | 0 repository | 100% |
| **Controller** | UnimedController     | 0 controller | 100% |
| **Validações** | Validações complexas | 0 validações | 100% |

**Conclusão:** Módulo 0% implementado. Requer análise profunda das regras de negócio.

---

## 🔍 ANÁLISE DO LEGACY (PHP)

### 1. 📂 Arquitetura Atual

**Arquivo:** `npd-legacy/com/modules/uni/controller/UnimedController.php`

**Actions Identificadas:**

```php
// 1. Buscar processos disponíveis para execução
case 'Buscarprocesso':

// 2. Executar processos (principal)
case 'Execute':

// 3. Histórico de processos executados
case 'HistoricoProcesso':

// 4. Processos de exportação (fechamento mensal)
case 'ExUnimed':
```

---

### 2. 🔍 ACTION: `Buscarprocesso`

**Descrição:** Lista processos disponíveis para execução baseado em categoria.

**Request (PHP):**

```php
$_POST['categ']      // Categoria do processo: 'UNI', 'DIRF', etc
$_POST['tipo']       // Tipo de dado: 'S' (Simplificado) ou 'C' (Completo)
$_POST['mes']        // Mês de referência
$_POST['ano']        // Ano de referência
```

**Validações:**

```php
$erro .= $categoria === '' ? "É necessário selecionar o parametro <br>" : "";
```

**DAO Method:**

```php
public function carregaProcessosProcessa()
{
    $query = "
    SELECT
        a.codigo,
        a.descricao,
        a.categoria,
        a.ordem,
        a.dias,
        a.ativo
    FROM nbs.mcw_processo a
    WHERE 1=1
      AND a.ativo = 'S'
      AND a.categoria = :categoria
      AND a.tipo_de_dado = :tipo
    ORDER BY a.ordem";
}
```

**Tabela Utilizada:**

```sql
nbs.mcw_processo
  ├─ codigo         VARCHAR2(10)   -- PK: 'UNIED', 'UNIEF', etc
  ├─ descricao      VARCHAR2(200)  -- Ex: 'Educação', 'Fechamento'
  ├─ categoria      VARCHAR2(10)   -- 'UNI', 'DIRF', etc
  ├─ ordem          NUMBER         -- Ordem de execução
  ├─ dias           NUMBER         -- Dias limite para execução
  ├─ ativo          CHAR(1)        -- 'S' = ativo, 'N' = inativo
  ├─ tipo_de_dado   CHAR(1)        -- 'S' = Simplificado, 'C' = Completo
  └─ data_cadastro  DATE
```

**Response Esperado:**

```json
{
  "result": true,
  "dados": [
    {
      "CODIGO": "UNIED",
      "DESCRICAO": "Educação",
      "CATEGORIA": "UNI",
      "ORDEM": 1,
      "DIAS": 5,
      "ATIVO": "S"
    },
    {
      "CODIGO": "UNIEF",
      "DESCRICAO": "Fechamento",
      "CATEGORIA": "UNI",
      "ORDEM": 2,
      "DIAS": 7,
      "ATIVO": "S"
    }
  ]
}
```

---

### 3. 🔍 ACTION: `Execute` (PRINCIPAL)

**Descrição:** Executa um ou mais processos para preparar dados da Unimed.

**Request (PHP):**

```php
$_POST['proc_mes']       // Mês de referência (int)
$_POST['proc_ano']       // Ano de referência (int)
$_POST['tipo']           // Tipo de dado: 'S' ou 'C'
$_POST['processo']       // Código do processo (ex: 'UNIED')
$_POST['checkAPAGA']     // 'S' = apaga dados antigos, 'N' = não apaga
$_POST['checkPrevia']    // 'S' = gera prévia, 'N' = definitivo
$_POST['categoria']      // Categoria: 'UNI', 'DIRF', etc
$_POST['proc_band']      // Bandeira (opcional): '1', '2', 'T' = todas
$_POST['proc_emp']       // Empresa (opcional): sigla ou 'T' = todas
$_POST['proc_colab']     // CPF colaborador específico (opcional)
```

**Validações Complexas:**

```php
$erro .= $mes === 0 ? "Necessario selecionar o mes<br>" : "";
$erro .= $ano === 0 ? "Necessario selecionar o ano<br>" : "";
$erro .= $processo === '' ? "INDICAR os processos que serão executados<br>" : "";
$erro .= $apagar === 'S' && $processo === '' ? "Informar um INDICADOR para Realizar EXCLUSAO !!<br>" : "";
$erro .= $previa === 'S' && $processo === '' ? "Informar um INDICADOR para a GERAR PREVIA !!<br>" : "";
$erro .= $cpf != '' && $empresa == 'T' ? "Necessario Informar Empresa para prosseguir!!" : "";
```

**Lógica de Empresa:**

```php
if ($empresa != 'T') {
    // Empresa específica
    $Empresa->setSigla($empresa);
    $Unimed->setCodempresa($EmpresaDAO->_isCodEmpresaGC());
    $Unimed->setCodcoligada($EmpresaDAO->_isCodColigadaGC());
    $Unimed->setCodfilial($EmpresaDAO->_isCodFilialGC());
    $Unimed->setCodband($EmpresaDAO->_isGetBandeiraGC());
    $Unimed->setTodasEmpresas('N');
} else {
    // Todas as empresas
    $Unimed->setTodasEmpresas('S');
    $Unimed->setCodband($bandeira); // Filtro por bandeira opcional
}
```

**DAO Method:**

```php
public function processarUnimed()
{
    $DB = new DB();
    $erro = '';

    // Busca processos da categoria
    $query = "
    SELECT codigo, descricao, dias, ordem
    FROM gc.mcw_processo
    WHERE categoria = :categoria
      AND tipo_de_dado = :tipo
      AND ativo = 'S'
    ORDER BY ordem";

    $result = $this->oQuery($query);

    while ($obj = oci_fetch_object($result)) {
        // Executa procedure para cada processo
        $query = "
        BEGIN
            GC.PGK_GLOBAL.P_MCW_FECHA_COMISSAO_GLOBAL(
                :p_processo,          -- Código do processo
                :p_mes,               -- Mês de referência
                :p_ano,               -- Ano de referência
                :p_previa,            -- 'S' ou 'N'
                :p_apaga,             -- 'S' ou 'N'
                :p_usuario,           -- Usuário executando
                :p_todas_empresas,    -- 'S' ou 'N'
                :p_cod_empresa,       -- Código empresa (ou 'T')
                :p_cod_band,          -- Código bandeira (ou 'T')
                :p_tipo_comissao,     -- 'S' ou 'C'
                :p_cpf                -- CPF específico (opcional)
            );
        END;";

        try {
            $DB->oQuery($query);
        } catch (Exception $e) {
            $erro .= "Erro no processo {$obj->DESCRICAO}: {$e->getMessage()}<br>";
        }
    }

    return ['erro' => $erro, 'query' => $query];
}
```

**⚠️ PROCEDURE ORACLE CRÍTICA:**

```sql
GC.PGK_GLOBAL.P_MCW_FECHA_COMISSAO_GLOBAL(
    p_processo         VARCHAR2,  -- Ex: 'UNIED', 'UNIEF'
    p_mes              NUMBER,    -- Mês de referência
    p_ano              NUMBER,    -- Ano de referência
    p_previa           CHAR(1),   -- 'S' = prévia, 'N' = definitivo
    p_apaga            CHAR(1),   -- 'S' = apaga dados antigos
    p_usuario          VARCHAR2,  -- Usuário executando
    p_todas_empresas   CHAR(1),   -- 'S' = todas, 'N' = específica
    p_cod_empresa      VARCHAR2,  -- Código empresa ou 'T'
    p_cod_band         VARCHAR2,  -- Código bandeira ou 'T'
    p_tipo_comissao    VARCHAR2,  -- 'S' = simplificado, 'C' = completo
    p_cpf              VARCHAR2   -- CPF específico (opcional)
)
```

**O Que a Procedure Faz:**

1. ✅ Valida se período está fechado (`mcw_periodo_fechamento`)
2. ✅ Verifica se está dentro do prazo (dias limite)
3. ✅ Se `p_apaga='S'`: Limpa dados antigos do período
4. ✅ Processa dados conforme categoria do processo
5. ✅ Atualiza tabelas de fechamento/comissão
6. ✅ Registra log em `mcw_processo_log`
7. ✅ Se `p_previa='S'`: Não comita alterações (apenas visualização)

**Response:**

```json
{
  "result": true,
  "msg": "Todos processos executado com sucesso",
  "query": "BEGIN GC.PGK_GLOBAL.P_MCW_FECHA_COMISSAO_GLOBAL(...)..."
}
```

---

### 4. 🔍 ACTION: `HistoricoProcesso`

**Descrição:** Busca histórico de processos executados.

**Request (PHP):**

```php
$_POST['cat_ref']    // Categoria: 'UNI', 'DIRF', etc
$_POST['mes_ref']    // Mês de referência
$_POST['ano_ref']    // Ano de referência
$_POST['codigo']     // Código do processo (opcional)
```

**DAO Method:**

```php
public function carregaProcessoshistUnimed()
{
    $query = "
    SELECT *
    FROM gc.vw_mcw_processo_log a
    WHERE 1=1
      AND a.mes_ref = :mes
      AND a.ano_ref = :ano
      AND a.categoria = :categoria
      AND a.codigo = :codigo
    ORDER BY a.data_proc DESC";

    $result = $this->oQuery($query);
    while ($obj = oci_fetch_object($result)) {
        $array[] = $obj;
    }
    return $array;
}
```

**Tabela/View Utilizada:**

```sql
gc.vw_mcw_processo_log (VIEW)
  ├─ codigo          VARCHAR2(10)  -- Código do processo
  ├─ descricao       VARCHAR2(200) -- Descrição
  ├─ categoria       VARCHAR2(10)  -- 'UNI', 'DIRF', etc
  ├─ usuario         VARCHAR2(100) -- Quem executou
  ├─ data_proc       TIMESTAMP     -- Quando executou
  ├─ mes_ref         NUMBER        -- Mês processado
  ├─ ano_ref         NUMBER        -- Ano processado
  ├─ apaga           CHAR(1)       -- Se apagou dados antigos
  ├─ previa          CHAR(1)       -- Se foi prévia
  ├─ hora_inicio     NUMBER        -- Timestamp início
  ├─ hora_final      NUMBER        -- Timestamp fim
  └─ duracao         NUMBER        -- Duração em segundos
```

**Response:**

```json
{
  "result": true,
  "dados": [
    {
      "CODIGO": "UNIED",
      "DESCRICAO": "Educação",
      "CATEGORIA": "UNI",
      "USUARIO": "joao.silva",
      "DATA_PROC": "2026-01-26 10:30:00",
      "MES_REF": 10,
      "ANO_REF": 2025,
      "APAGA": "N",
      "PREVIA": "N",
      "HORA_INICIO": 1706266200,
      "HORA_FINAL": 1706266245,
      "DURACAO": 45
    }
  ]
}
```

---

### 5. 🔍 ACTION: `ExUnimed` (Fechamento Mensal)

**Descrição:** Processo especial de fechamento mensal com validações de prazo.

**Request (PHP):**

```php
$_POST['busca_mes_t']        // Mês de referência (int)
$_POST['busca_ano_t']        // Ano de referência (int)
$_POST['zerar_dados']        // 'S' = apaga dados, 'N' = não apaga
$_POST['comissao_previa']    // 'S' = prévia, 'N' = definitivo
$_POST['processo']           // Código do processo
$_POST['busca_empresa_t']    // Sigla da empresa
$_POST['tipo_comissao']      // 'S' ou 'C'
```

**Validações Especiais:**

```php
$erro .= $empresa === '' ? "Necessario Informar a Empresa<br>" : "";
$erro .= $mes === 0 ? "Necessario selecionar o mes<br>" : "";
$erro .= $ano === 0 ? "Necessario selecionar o ano<br>" : "";
$erro .= $processo === '' ? "Necessario selecionar os processos que serão executados<br>" : "";
$erro .= $apagar === 'S' && !$Acesso->isAcesso(78004, $User) ?
         "Ops, você não possui autorização para apagar dados antigos" : "";
```

**Validação de Prazo:**

```php
// Busca data limite do período
$query = "
SELECT TO_CHAR(data_final,'YYYY-MM-DD') as data_final
FROM gc.mcw_periodo_fechamento a
WHERE a.mes_ref = :mes
  AND a.ano_ref = :ano";

$dataFinal = $obj->DATA_FINAL; // Ex: '2025-10-31'

// Busca dias limite do processo
$query = "
SELECT dias, descricao
FROM gc.mcw_processo a
WHERE a.codigo = :processo";

$diasLimite = $obj->DIAS; // Ex: 5 dias

// Calcula data máxima permitida
$dataMaxima = date("d-m-Y", strtotime("+{$diasLimite} days", strtotime($dataFinal)));

// Valida se ainda está no prazo
if (strtotime(date("d-m-Y")) <= strtotime($dataMaxima) ||
    $Acesso->isAcesso(78005, $User)) {
    // Permitido executar
} else {
    $erro .= "Processo passou da data limite de exportação. Max: {$dataMaxima}";
}
```

**Permissões Necessárias:**

```php
// 78004 - Permissão para apagar dados antigos
// 78005 - Permissão para processar fora do prazo
```

**Query Executada:**

```php
$query = "
BEGIN
    GC.PGK_GLOBAL.P_MCW_FECHA_COMISSAO_GLOBAL(
        '{$processo}',
        {$mes},
        {$ano},
        '{$previa}',
        '{$apagar}',
        '{$usuario}',
        'N',  -- Apenas empresa específica
        '{$codEmpresa}',
        '{$codBandeira}',
        '{$tipoComissao}'
    );
END;";
```

---

### 6. 📊 Tabelas do Sistema de Processos

#### **mcw_processo** (Cadastro de Processos)

```sql
CREATE TABLE nbs.mcw_processo (
    codigo         VARCHAR2(10) PRIMARY KEY,
    descricao      VARCHAR2(200) NOT NULL,
    categoria      VARCHAR2(10) NOT NULL,    -- 'UNI', 'DIRF', 'TEL', etc
    ordem          NUMBER NOT NULL,          -- Ordem de execução
    dias           NUMBER DEFAULT 5,         -- Dias limite após fechamento
    ativo          CHAR(1) DEFAULT 'S',
    tipo_de_dado   CHAR(1) DEFAULT 'S',      -- 'S' = Simplificado, 'C' = Completo
    data_cadastro  DATE DEFAULT SYSDATE
);

-- Exemplos de registros:
INSERT INTO nbs.mcw_processo VALUES ('UNIED', 'Educação', 'UNI', 1, 5, 'S', 'S', SYSDATE);
INSERT INTO nbs.mcw_processo VALUES ('UNIEF', 'Fechamento', 'UNI', 2, 7, 'S', 'S', SYSDATE);
INSERT INTO nbs.mcw_processo VALUES ('UNIEX', 'Exportação', 'UNI', 3, 10, 'S', 'S', SYSDATE);
```

#### **mcw_periodo_fechamento** (Períodos Disponíveis)

```sql
CREATE TABLE gc.mcw_periodo_fechamento (
    id            NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    mes_ref       NUMBER(2) NOT NULL,
    ano_ref       NUMBER(4) NOT NULL,
    data_inicial  DATE NOT NULL,            -- Ex: 01/10/2025
    data_final    DATE NOT NULL,            -- Ex: 31/10/2025
    status        VARCHAR2(20) DEFAULT 'ABERTO',  -- 'ABERTO', 'FECHADO', 'PROCESSADO'
    data_cadastro DATE DEFAULT SYSDATE,
    UNIQUE(mes_ref, ano_ref)
);
```

#### **mcw_processo_log** (Histórico de Execuções)

```sql
CREATE TABLE nbs.mcw_processo_log (
    id            NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    codigo        VARCHAR2(10) NOT NULL,
    categoria     VARCHAR2(10) NOT NULL,
    mes_ref       NUMBER(2) NOT NULL,
    ano_ref       NUMBER(4) NOT NULL,
    usuario       VARCHAR2(100) NOT NULL,
    data_proc     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    hora1         NUMBER,                    -- Timestamp início (em segundos)
    hora2         NUMBER,                    -- Timestamp fim (em segundos)
    apaga         CHAR(1) DEFAULT 'N',
    previa        CHAR(1) DEFAULT 'N',
    erro          CLOB,                      -- Mensagem de erro (se houver)
    FOREIGN KEY (codigo) REFERENCES nbs.mcw_processo(codigo)
);
```

#### **vw_mcw_processo_log** (View para Histórico)

```sql
CREATE VIEW gc.vw_mcw_processo_log AS
SELECT
    l.id,
    l.codigo,
    p.descricao,
    p.categoria,
    l.mes_ref,
    l.ano_ref,
    l.usuario,
    l.data_proc,
    l.apaga,
    l.previa,
    l.hora1,
    l.hora2,
    ROUND(l.hora2 - l.hora1, 2) AS duracao,  -- Duração em segundos
    l.erro
FROM nbs.mcw_processo_log l
INNER JOIN nbs.mcw_processo p ON l.codigo = p.codigo;
```

---

### 7. 🔐 Sistema de Permissões

**Acessos Necessários:**

| Código | Descrição                         | Uso                           |
| ------ | --------------------------------- | ----------------------------- |
| 78003  | Atualizar colaborador individual  | Gestão colaboradores          |
| 78004  | Apagar dados antigos ao processar | ExUnimed com `apaga='S'`      |
| 78005  | Processar fora do prazo limite    | Forçar execução após deadline |

**Validação no PHP:**

```php
if ($apagar === 'S' && !$Acesso->isAcesso(78004, $User)) {
    throw new Exception("Sem autorização para apagar dados");
}

if (strtotime($hoje) > strtotime($dataMaxima) &&
    !$Acesso->isAcesso(78005, $User)) {
    throw new Exception("Processo fora do prazo");
}
```

---

### 8. 🎯 Fluxo Completo de Processamento

```
┌─────────────────────────────────────────────────────────────┐
│ 1. USUÁRIO ACESSA TELA DE PROCESSOS                        │
│    └─> Seleciona período (mês/ano)                         │
│    └─> Seleciona categoria ('UNI')                         │
└─────────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. BUSCAR PROCESSOS DISPONÍVEIS                            │
│    Action: 'Buscarprocesso'                                │
│    └─> Retorna lista de processos ativos da categoria      │
│    └─> Exemplo: ['UNIED', 'UNIEF', 'UNIEX']               │
└─────────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. USUÁRIO SELECIONA PROCESSO(S) E OPÇÕES                  │
│    ├─ Processo: 'UNIED' (Educação)                        │
│    ├─ Empresa: 'GSV' ou 'T' (todas)                       │
│    ├─ Apagar dados antigos? 'S' ou 'N'                    │
│    ├─ Gerar prévia? 'S' ou 'N'                            │
│    └─ CPF específico? (opcional)                           │
└─────────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────────┐
│ 4. VALIDAÇÕES                                               │
│    ├─ ✅ Mês/ano informados?                               │
│    ├─ ✅ Processo selecionado?                             │
│    ├─ ✅ Se CPF: empresa obrigatória                       │
│    ├─ ✅ Se apagar='S': permissão 78004?                   │
│    └─ ✅ Período dentro do prazo? (ou permissão 78005)     │
└─────────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────────┐
│ 5. EXECUÇÃO                                                 │
│    Action: 'Execute'                                       │
│    └─> Loop por cada processo da categoria                 │
│        ├─ Chama P_MCW_FECHA_COMISSAO_GLOBAL               │
│        ├─ Processa empresa(s) selecionada(s)              │
│        ├─ Registra log em mcw_processo_log                │
│        └─ Se erro: continua próximo processo              │
└─────────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────────┐
│ 6. RESULTADO                                                │
│    └─> Sucesso: "Todos processos executados com sucesso"  │
│    └─> Erro parcial: Lista erros por processo             │
│    └─> Erro total: Mensagem de erro                       │
└─────────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────────┐
│ 7. CONSULTAR HISTÓRICO                                      │
│    Action: 'HistoricoProcesso'                             │
│    └─> Lista execuções com data/hora/usuário/duração      │
│    └─> Permite auditar quem processou e quando            │
└─────────────────────────────────────────────────────────────┘
```

---

## 🏗️ ESTADO ATUAL NO NESTJS

### ❌ Status: 0% Implementado

**Não existe nada relacionado a processos:**

```bash
# Busca por arquivos de processos
grep -r "processo" src/ --include="*.ts"
# Resultado: 0 matches
```

**O que precisa ser criado do zero:**

1. ✅ **Domain Layer:**
   - Entity: `Processo`
   - Repository Interface: `IProcessoRepository`

2. ✅ **Application Layer:**
   - Use Case: `ListarProcessosDisponiveisUseCase`
   - Use Case: `ExecutarProcessoUseCase`
   - Use Case: `BuscarHistoricoProcessosUseCase`
   - DTOs: Request/Response para cada endpoint

3. ✅ **Infrastructure Layer:**
   - Repository: `ProcessoRepository`
   - Implementar queries nas tabelas `mcw_processo`, `mcw_processo_log`

4. ✅ **Presentation Layer:**
   - Controller: `ProcessoController`
   - Rotas REST para os 3 endpoints principais

---

## 📋 ESPECIFICAÇÃO DE IMPLEMENTAÇÃO

### 1. 🎨 Domain Layer

#### **Entity: Processo**

```typescript
// src/domain/entities/processo.entity.ts
export class Processo {
  constructor(
    public readonly codigo: string, // 'UNIED', 'UNIEF'
    public readonly descricao: string, // 'Educação', 'Fechamento'
    public readonly categoria: string, // 'UNI', 'DIRF'
    public readonly ordem: number, // 1, 2, 3...
    public readonly dias: number, // Dias limite
    public readonly ativo: 'S' | 'N',
    public readonly tipoDeDado: 'S' | 'C', // Simplificado ou Completo
  ) {}
}
```

#### **Entity: ProcessoLog**

```typescript
// src/domain/entities/processo-log.entity.ts
export class ProcessoLog {
  constructor(
    public readonly id: number,
    public readonly codigo: string,
    public readonly descricao: string,
    public readonly categoria: string,
    public readonly mesRef: number,
    public readonly anoRef: number,
    public readonly usuario: string,
    public readonly dataProc: Date,
    public readonly apaga: 'S' | 'N',
    public readonly previa: 'S' | 'N',
    public readonly duracao: number, // Em segundos
    public readonly erro: string | null,
  ) {}
}
```

#### **Repository Interface**

```typescript
// src/domain/repositories/processo.repository.interface.ts
export interface IProcessoRepository {
  // Lista processos disponíveis para execução
  listarProcessosDisponiveis(params: {
    categoria: string;
    tipoDeDado: 'S' | 'C';
  }): Promise<Processo[]>;

  // Executa procedure de processamento
  executarProcesso(params: {
    processo: string;
    mesRef: number;
    anoRef: number;
    previa: 'S' | 'N';
    apaga: 'S' | 'N';
    usuario: string;
    todasEmpresas: 'S' | 'N';
    codEmpresa?: number;
    codColigada?: number;
    codFilial?: number;
    codBand?: number;
    tipoComissao: 'S' | 'C';
    cpf?: string;
  }): Promise<void>;

  // Busca histórico de execuções
  buscarHistorico(params: {
    categoria: string;
    mesRef?: number;
    anoRef?: number;
    codigo?: string;
  }): Promise<ProcessoLog[]>;

  // Valida prazo de execução
  validarPrazoExecucao(params: {
    mesRef: number;
    anoRef: number;
    processo: string;
  }): Promise<{
    dentroDoPrazo: boolean;
    dataMaxima: Date;
    diasRestantes: number;
  }>;
}
```

---

### 2. 🧩 Application Layer

#### **DTOs**

```typescript
// src/application/dtos/processos/listar-processos-disponiveis.dto.ts
export class ListarProcessosDisponiveisDto {
  @IsString()
  @IsNotEmpty()
  categoria: string; // 'UNI', 'DIRF'

  @IsIn(['S', 'C'])
  @IsNotEmpty()
  tipoDeDado: 'S' | 'C';
}

// src/application/dtos/processos/executar-processo.dto.ts
export class ExecutarProcessoDto {
  @IsString()
  @IsNotEmpty()
  processo: string; // Código do processo

  @IsNumber()
  @Min(1)
  @Max(12)
  mesRef: number;

  @IsNumber()
  @Min(2020)
  anoRef: number;

  @IsIn(['S', 'N'])
  @IsOptional()
  previa?: 'S' | 'N' = 'N';

  @IsIn(['S', 'N'])
  @IsOptional()
  apaga?: 'S' | 'N' = 'N';

  @IsString()
  @IsNotEmpty()
  categoria: string; // 'UNI'

  @IsIn(['S', 'C'])
  @IsNotEmpty()
  tipoComissao: 'S' | 'C';

  @IsNumber()
  @IsOptional()
  codEmpresa?: number; // Se não informado: todas

  @IsNumber()
  @IsOptional()
  codColigada?: number;

  @IsNumber()
  @IsOptional()
  codFilial?: number;

  @IsNumber()
  @IsOptional()
  codBand?: number; // Bandeira (se todas empresas)

  @IsString()
  @IsOptional()
  @Matches(/^\d{11}$/)
  cpf?: string; // CPF específico (requer empresa)
}

// src/application/dtos/processos/buscar-historico.dto.ts
export class BuscarHistoricoDto {
  @IsString()
  @IsNotEmpty()
  categoria: string;

  @IsNumber()
  @IsOptional()
  mesRef?: number;

  @IsNumber()
  @IsOptional()
  anoRef?: number;

  @IsString()
  @IsOptional()
  codigo?: string;
}
```

#### **Use Cases**

```typescript
// src/application/use-cases/processo/listar-processos-disponiveis.use-case.ts
@Injectable()
export class ListarProcessosDisponiveisUseCase {
  constructor(
    @Inject('IProcessoRepository')
    private readonly processoRepository: IProcessoRepository,
  ) {}

  async execute(request: ListarProcessosDisponiveisDto) {
    const processos = await this.processoRepository.listarProcessosDisponiveis({
      categoria: request.categoria,
      tipoDeDado: request.tipoDeDado,
    });

    return {
      processos: processos.map((p) => ({
        codigo: p.codigo,
        descricao: p.descricao,
        categoria: p.categoria,
        ordem: p.ordem,
        dias: p.dias,
        ativo: p.ativo,
      })),
      total: processos.length,
    };
  }
}

// src/application/use-cases/processo/executar-processo.use-case.ts
@Injectable()
export class ExecutarProcessoUseCase {
  constructor(
    @Inject('IProcessoRepository')
    private readonly processoRepository: IProcessoRepository,
    private readonly logger: Logger,
  ) {}

  async execute(request: ExecutarProcessoDto, usuario: string) {
    // Validação de permissões (implementar depois)
    if (request.apaga === 'S') {
      // TODO: Verificar permissão 78004
    }

    // Validar prazo (se aplicável)
    const validacao = await this.processoRepository.validarPrazoExecucao({
      mesRef: request.mesRef,
      anoRef: request.anoRef,
      processo: request.processo,
    });

    if (!validacao.dentroDoPrazo) {
      // TODO: Verificar permissão 78005
      throw new BadRequestException(
        `Processo fora do prazo. Data máxima: ${validacao.dataMaxima}`,
      );
    }

    // Validação: CPF requer empresa
    if (request.cpf && !request.codEmpresa) {
      throw new BadRequestException(
        'É necessário informar empresa ao processar CPF específico',
      );
    }

    // Executar processo
    try {
      await this.processoRepository.executarProcesso({
        processo: request.processo,
        mesRef: request.mesRef,
        anoRef: request.anoRef,
        previa: request.previa,
        apaga: request.apaga,
        usuario,
        todasEmpresas: request.codEmpresa ? 'N' : 'S',
        codEmpresa: request.codEmpresa,
        codColigada: request.codColigada,
        codFilial: request.codFilial,
        codBand: request.codBand,
        tipoComissao: request.tipoComissao,
        cpf: request.cpf,
      });

      return {
        sucesso: true,
        mensagem: `Processo ${request.processo} executado com sucesso`,
      };
    } catch (error) {
      this.logger.error(`Erro ao executar processo: ${error.message}`);
      throw new InternalServerErrorException(
        `Erro ao executar processo: ${error.message}`,
      );
    }
  }
}

// src/application/use-cases/processo/buscar-historico.use-case.ts
@Injectable()
export class BuscarHistoricoUseCase {
  constructor(
    @Inject('IProcessoRepository')
    private readonly processoRepository: IProcessoRepository,
  ) {}

  async execute(request: BuscarHistoricoDto) {
    const historico = await this.processoRepository.buscarHistorico({
      categoria: request.categoria,
      mesRef: request.mesRef,
      anoRef: request.anoRef,
      codigo: request.codigo,
    });

    return {
      historico: historico.map((log) => ({
        id: log.id,
        codigo: log.codigo,
        descricao: log.descricao,
        categoria: log.categoria,
        mesRef: log.mesRef,
        anoRef: log.anoRef,
        usuario: log.usuario,
        dataProc: log.dataProc,
        apaga: log.apaga,
        previa: log.previa,
        duracao: log.duracao,
        erro: log.erro,
      })),
      total: historico.length,
    };
  }
}
```

---

### 3. 🏗️ Infrastructure Layer

#### **Repository Implementation**

```typescript
// src/infrastructure/repositories/processo.repository.ts
@Injectable()
export class ProcessoRepository implements IProcessoRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  async listarProcessosDisponiveis(params: {
    categoria: string;
    tipoDeDado: 'S' | 'C';
  }): Promise<Processo[]> {
    const query = `
      SELECT 
        codigo,
        descricao,
        categoria,
        ordem,
        dias,
        ativo,
        tipo_de_dado
      FROM nbs.mcw_processo
      WHERE ativo = 'S'
        AND categoria = :categoria
        AND tipo_de_dado = :tipoDeDado
      ORDER BY ordem
    `;

    const rows = await this.databaseService.executeQuery<ProcessoRow>(query, {
      categoria: params.categoria,
      tipoDeDado: params.tipoDeDado,
    });

    return rows.map(
      (row) =>
        new Processo(
          row.CODIGO,
          row.DESCRICAO,
          row.CATEGORIA,
          row.ORDEM,
          row.DIAS,
          row.ATIVO,
          row.TIPO_DE_DADO,
        ),
    );
  }

  async executarProcesso(params: ExecutarProcessoParams): Promise<void> {
    const plsql = `
      BEGIN
        GC.PGK_GLOBAL.P_MCW_FECHA_COMISSAO_GLOBAL(
          :p_processo,
          :p_mes,
          :p_ano,
          :p_previa,
          :p_apaga,
          :p_usuario,
          :p_todas_empresas,
          :p_cod_empresa,
          :p_cod_band,
          :p_tipo_comissao,
          :p_cpf
        );
      END;
    `;

    const binds = {
      p_processo: params.processo,
      p_mes: params.mesRef,
      p_ano: params.anoRef,
      p_previa: params.previa,
      p_apaga: params.apaga,
      p_usuario: params.usuario,
      p_todas_empresas: params.todasEmpresas,
      p_cod_empresa: params.codEmpresa?.toString() || 'T',
      p_cod_band: params.codBand?.toString() || 'T',
      p_tipo_comissao: params.tipoComissao,
      p_cpf: params.cpf || '',
    };

    await this.databaseService.executeProcedure(plsql, binds);
  }

  async buscarHistorico(params: BuscarHistoricoParams): Promise<ProcessoLog[]> {
    let query = `
      SELECT *
      FROM gc.vw_mcw_processo_log
      WHERE categoria = :categoria
    `;

    const binds: any = { categoria: params.categoria };

    if (params.mesRef) {
      query += ` AND mes_ref = :mesRef`;
      binds.mesRef = params.mesRef;
    }

    if (params.anoRef) {
      query += ` AND ano_ref = :anoRef`;
      binds.anoRef = params.anoRef;
    }

    if (params.codigo) {
      query += ` AND codigo = :codigo`;
      binds.codigo = params.codigo;
    }

    query += ` ORDER BY data_proc DESC`;

    const rows = await this.databaseService.executeQuery<ProcessoLogRow>(
      query,
      binds,
    );

    return rows.map(
      (row) =>
        new ProcessoLog(
          row.ID,
          row.CODIGO,
          row.DESCRICAO,
          row.CATEGORIA,
          row.MES_REF,
          row.ANO_REF,
          row.USUARIO,
          new Date(row.DATA_PROC),
          row.APAGA,
          row.PREVIA,
          row.DURACAO,
          row.ERRO,
        ),
    );
  }

  async validarPrazoExecucao(params: {
    mesRef: number;
    anoRef: number;
    processo: string;
  }): Promise<{
    dentroDoPrazo: boolean;
    dataMaxima: Date;
    diasRestantes: number;
  }> {
    // Busca data final do período
    const queryPeriodo = `
      SELECT TO_CHAR(data_final, 'YYYY-MM-DD') as data_final
      FROM gc.mcw_periodo_fechamento
      WHERE mes_ref = :mes
        AND ano_ref = :ano
    `;

    const [periodo] = await this.databaseService.executeQuery<{
      DATA_FINAL: string;
    }>(queryPeriodo, {
      mes: params.mesRef,
      ano: params.anoRef,
    });

    if (!periodo) {
      throw new Error('Período não encontrado');
    }

    // Busca dias limite do processo
    const queryProcesso = `
      SELECT dias
      FROM nbs.mcw_processo
      WHERE codigo = :codigo
    `;

    const [processo] = await this.databaseService.executeQuery<{
      DIAS: number;
    }>(queryProcesso, {
      codigo: params.processo,
    });

    if (!processo) {
      throw new Error('Processo não encontrado');
    }

    // Calcula data máxima
    const dataFinal = new Date(periodo.DATA_FINAL);
    const dataMaxima = new Date(dataFinal);
    dataMaxima.setDate(dataMaxima.getDate() + processo.DIAS);

    const hoje = new Date();
    const dentroDoPrazo = hoje <= dataMaxima;
    const diasRestantes = Math.floor(
      (dataMaxima.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24),
    );

    return {
      dentroDoPrazo,
      dataMaxima,
      diasRestantes,
    };
  }
}
```

---

### 4. 🎯 Presentation Layer

#### **Controller**

```typescript
// src/presentation/controllers/processo.controller.ts
@Controller('api/v1/processos')
export class ProcessoController {
  constructor(
    private readonly listarProcessosUseCase: ListarProcessosDisponiveisUseCase,
    private readonly executarProcessoUseCase: ExecutarProcessoUseCase,
    private readonly buscarHistoricoUseCase: BuscarHistoricoUseCase,
  ) {}

  @Get('disponiveis')
  async listarProcessosDisponiveis(
    @Query() query: ListarProcessosDisponiveisDto,
  ) {
    return await this.listarProcessosUseCase.execute(query);
  }

  @Post('executar')
  async executarProcesso(
    @Body() body: ExecutarProcessoDto,
    @Request() req: any, // TODO: Implementar autenticação
  ) {
    const usuario = req.user?.usuario || 'sistema'; // TODO: Pegar usuário autenticado
    return await this.executarProcessoUseCase.execute(body, usuario);
  }

  @Get('historico')
  async buscarHistorico(@Query() query: BuscarHistoricoDto) {
    return await this.buscarHistoricoUseCase.execute(query);
  }
}
```

---

## 📊 PLANO DE IMPLEMENTAÇÃO

### Fase 1: Domain Layer (Estimativa: 2 horas)

- [ ] Criar Entity `Processo`
- [ ] Criar Entity `ProcessoLog`
- [ ] Criar Interface `IProcessoRepository`
- [ ] Documentar domínio

### Fase 2: Application Layer (Estimativa: 4 horas)

- [ ] Criar DTOs (Request/Response)
- [ ] Implementar `ListarProcessosDisponiveisUseCase`
- [ ] Implementar `ExecutarProcessoUseCase`
- [ ] Implementar `BuscarHistoricoUseCase`
- [ ] Adicionar validações

### Fase 3: Infrastructure Layer (Estimativa: 6 horas)

- [ ] Implementar `ProcessoRepository`
- [ ] Criar queries SQL complexas
- [ ] Testar procedure `P_MCW_FECHA_COMISSAO_GLOBAL`
- [ ] Implementar `validarPrazoExecucao()`
- [ ] Adicionar tratamento de erros Oracle

### Fase 4: Presentation Layer (Estimativa: 2 horas)

- [ ] Criar `ProcessoController`
- [ ] Definir rotas REST
- [ ] Adicionar validação de DTOs
- [ ] Documentar endpoints Swagger

### Fase 5: Testes e Validação (Estimativa: 4 horas)

- [ ] Testar endpoint de listagem
- [ ] Testar execução de processos
- [ ] Testar validação de prazos
- [ ] Testar histórico
- [ ] Validar com dados reais

---

## ⏱️ ESTIMATIVAS E PRIORIDADES

### 📊 Resumo de Esforço

| Camada               | Tempo Estimado | Prioridade  |
| -------------------- | -------------- | ----------- |
| Domain Layer         | 2 horas        | 🔴 Alta     |
| Application Layer    | 4 horas        | 🔴 Alta     |
| Infrastructure Layer | 6 horas        | 🔴 Alta     |
| Presentation Layer   | 2 horas        | 🔴 Alta     |
| Testes               | 4 horas        | 🟡 Média    |
| **TOTAL**            | **18 horas**   | **~3 dias** |

### 🎯 Prioridade de Implementação

**1º. Listar Processos Disponíveis** (Mais Simples)

- Query simples em `mcw_processo`
- Sem lógica complexa
- Base para os demais endpoints

**2º. Buscar Histórico** (Médio)

- Query em view `vw_mcw_processo_log`
- Filtros opcionais
- Sem execução de procedures

**3º. Executar Processo** (Mais Complexo)

- Validação de prazo
- Validação de permissões
- Execução de procedure Oracle
- Tratamento de erros

### ⚠️ Riscos e Dependências

**Riscos Identificados:**

1. **Procedure P_MCW_FECHA_COMISSAO_GLOBAL desconhecida**
   - Solução: Testar manualmente no banco antes de implementar

2. **Validação de permissões (78004, 78005)**
   - Solução: Implementar módulo de autenticação/autorização primeiro ou usar placeholder

3. **Tempo de execução da procedure**
   - Solução: Considerar implementação assíncrona (job queue)

4. **Validação de período fechado**
   - Solução: Criar validação antes de executar processo

**Dependências:**

- ✅ DatabaseService com `executeProcedure()` (já implementado)
- ⏳ Módulo de autenticação (usuário logado)
- ⏳ Sistema de permissões (acesso por código)

---

## 📝 CHECKLIST DE IMPLEMENTAÇÃO

### ✅ Pré-requisitos

- [ ] Confirmar estrutura das tabelas no banco Oracle
- [ ] Testar procedure `P_MCW_FECHA_COMISSAO_GLOBAL` manualmente
- [ ] Validar dados na tabela `mcw_processo`
- [ ] Validar view `vw_mcw_processo_log`

### 🏗️ Implementação

- [ ] Domain: Entities e Interfaces
- [ ] Application: Use Cases e DTOs
- [ ] Infrastructure: Repository
- [ ] Presentation: Controller
- [ ] Módulos: Registrar providers e exports

### 🧪 Testes

- [ ] Testar GET /processos/disponiveis
- [ ] Testar GET /processos/historico
- [ ] Testar POST /processos/executar
- [ ] Validar erros e edge cases
- [ ] Testar com dados reais

### 📚 Documentação

- [ ] Documentar endpoints no README
- [ ] Adicionar exemplos de requisições
- [ ] Documentar regras de negócio
- [ ] Criar guia de troubleshooting

---

## 🎓 LIÇÕES APRENDIDAS DO LEGACY

### ✅ Boas Práticas Identificadas

1. **Ordem de Execução**: Processos têm campo `ordem` para execução sequencial
2. **Validação de Prazo**: Sistema valida `dias` após `data_final` do período
3. **Log Detalhado**: Registra usuário, data, duração e erros
4. **Prévia**: Permite testar sem comitar (`previa='S'`)
5. **Flexibilidade**: Permite processar todas empresas ou específica

### ⚠️ Problemas a Evitar

1. **Sem Tratamento Assíncrono**: Processos longos bloqueiam requisição
2. **Validação de Permissão Fraca**: Apenas checks no frontend
3. **Erros Genéricos**: Mensagens pouco descritivas
4. **Sem Timeout**: Procedure pode travar indefinidamente

---

## 🚀 PRÓXIMOS PASSOS

Após implementação deste módulo, a sequência recomendada é:

1. ✅ **Módulo de Processos** (este documento)
2. ⏳ **Módulo de Exportação TOTVS**
   - Gerar arquivo de exportação
   - Filtrar colaboradores com `exporta='S'`
   - Validar formato do arquivo
3. ⏳ **Módulo de Relatórios**
   - Relatórios em PDF (Jasper ou alternativa)
   - Dashboard de visualização
4. ⏳ **Módulo de Autenticação/Autorização**
   - Login JWT
   - Permissões por código
   - Auditoria completa

---

**Documento criado em:** 26 de Janeiro de 2026  
**Última atualização:** 26 de Janeiro de 2026  
**Versão:** 1.0  
**Autor:** Análise do sistema legacy PHP
