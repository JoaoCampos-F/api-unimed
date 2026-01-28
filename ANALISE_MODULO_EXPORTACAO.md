# 📤 ANÁLISE COMPLETA - MÓDULO EXPORTAÇÃO TOTVS

**Data:** 28 de Janeiro de 2026  
**Versão:** 1.0  
**Status:** Análise para implementação do zero  
**Prioridade:** 🔴 CRÍTICA - Bloqueador para produção

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

### O Que É o Módulo de Exportação TOTVS?

O módulo de exportação é responsável por **gerar arquivos de integração** com o ERP TOTVS Protheus para processamento na folha de pagamento. É o **último passo crítico** do fluxo de dados da Unimed, transformando os dados processados em descontos na folha.

### 🔄 Fluxo Completo do Sistema

```
1. ✅ IMPORTAÇÃO
   └─> Dados brutos da API Unimed → uni_dados_cobranca

2. ✅ EXECUTAR RESUMO
   └─> Procedure p_uni_resumo → uni_resumo_colaborador

3. ✅ GESTÃO COLABORADORES
   └─> Ajustar flag exporta='S'/'N' manualmente

4. ✅ PROCESSOS (FECHAMENTO)
   └─> Executar P_MCW_FECHA_COMISSAO_GLOBAL
   └─> Finaliza/consolida dados

5. ⏳ EXPORTAÇÃO TOTVS (ESTE MÓDULO) ⬅️ VOCÊ ESTÁ AQUI
   └─> Gera arquivo com colaboradores exporta='S'
   └─> Formato específico para importação no TOTVS
   └─> Envia para folha de pagamento
```

### 🎯 Objetivo Final

Gerar arquivo de integração contendo:

- Colaboradores com `exporta = 'S'`
- Valores líquidos de desconto
- Formato compatível com TOTVS Protheus
- Dados validados e prontos para importação

### 📊 Status Atual

| Componente     | Legacy PHP       | NestJS       | Gap  |
| -------------- | ---------------- | ------------ | ---- |
| **Endpoints**  | 1 action         | 0 endpoints  | 100% |
| **DTOs**       | N/A              | 0 criados    | 100% |
| **Use Cases**  | 1 método DAO     | 0 use cases  | 100% |
| **Repository** | Query direta     | 0 repository | 100% |
| **Controller** | UnimedController | 0 controller | 100% |
| **Validações** | Validações PHP   | 0 validações | 100% |

**Conclusão:** Módulo 0% implementado. **Bloqueador crítico para produção.**

---

## 🔍 ANÁLISE DO LEGACY (PHP)

### 1. 📂 Arquitetura Atual

**Arquivo:** `npd-legacy/com/modules/uni/controller/UnimedController.php`  
**Action:** `case 'ExUnimed':`  
**Linhas:** 510-664 (154 linhas de código)

### 2. 🔍 ACTION: `ExUnimed` (Exportação TOTVS)

**Descrição:** Executa procedure de fechamento e exportação de dados para o TOTVS.

#### **Request (PHP):**

```php
$_POST['busca_mes_t']        // Mês de referência (1-12)
$_POST['busca_ano_t']        // Ano de referência (2024, 2025, etc)
$_POST['zerar_dados']        // 'S' = Apagar dados, 'N' = Manter (checkbox)
$_POST['comissao_previa']    // 'S' = Gerar prévia, 'N' = Definitivo (checkbox)
$_POST['processo']           // Código do processo a executar (array)
$_POST['busca_empresa_t']    // Sigla da empresa (ex: 'GSV', 'GT', 'EC')
$_POST['tipo_comissao']      // Tipo de comissão (opcional)
```

#### **Validações Aplicadas:**

```php
// Validações obrigatórias
$erro .= $b_emp === '' ? "Necessario Informar a Empresa<br>" : "";
$erro .= $mes_ref === 0 ? "Necessario selecionar o mes<br>" : "";
$erro .= $ano_ref === 0 ? "Necessario selecionar o ano<br>" : "";
$erro .= $processo === '' ? "Necessario selecionar os processos que serão executados<br>" : "";

// Validações de permissão (controle de acesso)
$erro .= $apagar === 'S' && $Acesso->isAcesso(78004, $User) === false
    ? "Ops, você não possui autorização para apagar dados antigos"
    : "";

// Validação de período
if ($ano == date('mY')) {
    // Validação de prazo de execução
    if(strtotime(date("d-m-Y")) > strtotime($max)) {
        $erro .= "Processo passou da data limite de exportação";
    }
}
```

#### **Fluxo de Execução:**

```
1. Validar dados de entrada (empresa, mês, ano, processo)

2. Validar permissões do usuário
   - Permissão 78004: Apagar dados antigos
   - Permissão 78005: Executar fora do prazo

3. Buscar data limite de fechamento
   Query: SELECT data_final FROM gc.mcw_periodo_fechamento
   WHERE mes_ref = ? AND ano_ref = ?

4. Validar prazo de execução
   - Buscar dias limite do processo (campo 'dias' na tabela mcw_processo)
   - Calcular data máxima: data_final + dias
   - Se atual > máxima E sem permissão especial: ERRO

5. Executar procedure Oracle
   PROCEDURE: GC.PGK_GLOBAL.P_MCW_FECHA_COMISSAO_GLOBAL

   Parâmetros:
   - p_processo:      Código do processo (ex: 'UNIEF')
   - p_mes_ref:       Mês de referência (1-12)
   - p_ano_ref:       Ano de referência (2024)
   - p_previa:        'S' ou 'N' (prévia ou definitivo)
   - p_apagar:        'S' ou 'N' (apagar dados antigos)
   - p_usuario:       Username do usuário logado
   - p_lote:          'N' (sempre 'N' na Unimed)
   - p_cod_empresa:   Código da empresa
   - p_bandeira:      Código da bandeira
   - p_tipo_comissao: Tipo de comissão (opcional)

6. Capturar resultado
   - Sucesso: Retornar mensagem de sucesso
   - Erro: Capturar erro do Oracle e retornar
```

#### **Código Real do Legacy:**

```php
case 'ExUnimed':
    $mes_ref = @intval($_POST['busca_mes_t']);
    $ano_ref = @intval($_POST['busca_ano_t']);
    $apagar  = isset($_POST['zerar_dados']) && $_POST['zerar_dados'] == 'S' ? "S" : "N";
    $previa  = isset($_POST['comissao_previa']) ? "S" : "N";
    $processo = isset($_POST['processo']) ? $_POST['processo'] : "";
    $b_emp   = isset($_POST['busca_empresa_t']) ? $_POST['busca_empresa_t'] : '';
    $tipo_comissao = isset($_POST['tipo_comissao']) ? $_POST['tipo_comissao'] : '';

    // Validações de entrada
    $erro = '';
    $erro .= $b_emp === '' ? "Necessario Informar a Empresa<br>" : "";
    $erro .= $mes_ref === 0 ? "Necessario selecionar o mes<br>" : "";
    $erro .= $ano_ref === 0 ? "Necessario selecionar o ano<br>" : "";
    $erro .= $processo === '' ? "Necessario selecionar os processos que serão executados<br>" : "";
    $erro .= $apagar === 'S' && $Acesso->isAcesso(78004,$User) === false
        ? "Ops, você não possui autorização para apagar dados antigos"
        : "";

    if (empty($erro)) {
        // Buscar data de fechamento
        $query = "SELECT TO_CHAR(data_final,'YYYY-MM-DD') as data_final
                  FROM gc.mcw_periodo_fechamento a
                  WHERE a.mes_ref = '{$mes_ref}'
                    AND a.ano_ref = '{$ano_ref}'";
        $result = $DB->oQuery($query);
        $obj = oci_fetch_object($result);
        $dataFinal = $obj->DATA_FINAL;

        // Buscar dias limite do processo
        $query = "SELECT dias, descricao
                  FROM gc.mcw_processo a
                  WHERE a.codigo = '{$processo}'";
        $result = $DB->oQuery($query);
        $obj = oci_fetch_object($result);

        // Calcular data máxima para execução
        $max = date("d-m-Y", strtotime("+".$obj->DIAS." days", strtotime($dataFinal)));

        // Validar prazo de execução
        if (strtotime(date("d-m-Y")) <= strtotime($max) || $Acesso->isAcesso(78005,$User) === true) {

            // Executar procedure Oracle
            $Empresa->setSigla($b_emp);
            $query = "BEGIN GC.PGK_GLOBAL.P_MCW_FECHA_COMISSAO_GLOBAL(
                '{$processo}',
                {$mes_ref},
                {$ano_ref},
                '{$previa}',
                '{$apagar}',
                '".$User->getUsuario()."',
                'N',
                '".$EmpresaDAO->_isCodEmpresa()."',
                '".$EmpresaDAO->getBandeira()."',
                '{$tipo_comissao}'
            ); END;";

            $DB->oQuery($query);
            $erro .= $DB->getErr() !== true ? "Erro: ".$DB->getErr()."<br>" : "";

            $arr['result'] = true;
            $arr['msg'] = empty($erro)
                ? "Processos de EXPORTAÇÃO executados com sucesso"
                : $erro;
        } else {
            $erro .= "Processo passou da data limite de exportação Max: ".date("d/m/Y", strtotime("+".$obj->DIAS." days", strtotime($dataFinal)));
        }
    } else {
        $arr['result'] = false;
        $arr['msg'] = $erro;
    }

    echo json_encode($arr);
    break;
```

### 3. 📊 Tabelas Envolvidas

#### **Tabela 1: `gc.mcw_periodo_fechamento`**

**Propósito:** Define períodos de fechamento e datas limite

```sql
CREATE TABLE gc.mcw_periodo_fechamento (
    mes_ref      NUMBER(2),      -- Mês de referência (1-12)
    ano_ref      NUMBER(4),      -- Ano de referência (2024)
    data_inicial DATE,           -- Data início do período
    data_final   DATE,           -- Data fim do período (usada para calcular prazo)
    ativo        CHAR(1),        -- 'S' = Ativo
    PRIMARY KEY (mes_ref, ano_ref)
);
```

**Query Utilizada:**

```sql
SELECT TO_CHAR(data_final,'YYYY-MM-DD') as data_final
FROM gc.mcw_periodo_fechamento a
WHERE a.mes_ref = :mes_ref
  AND a.ano_ref = :ano_ref
```

#### **Tabela 2: `gc.mcw_processo`**

**Propósito:** Define processos disponíveis e suas configurações

```sql
CREATE TABLE gc.mcw_processo (
    codigo       VARCHAR2(10),   -- PK: 'UNIEF' = Fechamento Unimed
    descricao    VARCHAR2(200),  -- Nome do processo
    categoria    VARCHAR2(10),   -- 'UNI', 'DIRF', etc
    ordem        NUMBER,         -- Ordem de execução
    dias         NUMBER,         -- Dias após fechamento para executar
    ativo        CHAR(1),        -- 'S' = Ativo
    tipo_de_dado CHAR(1),        -- 'S' = Simplificado, 'C' = Completo
    PRIMARY KEY (codigo)
);
```

**Query Utilizada:**

```sql
SELECT dias, descricao
FROM gc.mcw_processo a
WHERE a.codigo = :processo
```

**Exemplo de Registro:**

```sql
INSERT INTO gc.mcw_processo VALUES (
    '90000001',                 -- codigo (⬅️ CÓDIGO CORRETO PARA EXPORTAÇÃO UNIMED)
    'Exporta Plano Saúde',      -- descricao
    'UNI',                      -- categoria
    1,                          -- ordem
    5,                          -- dias (prazo de 5 dias após fechamento)
    'S',                        -- ativo
    'S'                         -- tipo_de_dado
);
```

#### **Tabela 3: `gc.vw_uni_resumo_colaborador`**

**Propósito:** View com dados consolidados de colaboradores (usada pela procedure)

**Campos Principais:**

```sql
SELECT
    a.cod_empresa,      -- Código da empresa
    a.codcoligada,      -- Código da coligada
    a.codfilial,        -- Código da filial
    a.cod_band,         -- Código da bandeira
    a.codigo_cpf,       -- CPF do colaborador
    a.colaborador,      -- Nome do colaborador
    a.apelido,          -- Sigla da empresa
    a.mes_ref,          -- Mês de referência
    a.ano_ref,          -- Ano de referência
    a.m_titular,        -- Valor titular
    a.m_dependente,     -- Valor dependentes
    a.valor_consumo,    -- Valor consumo
    a.perc_empresa,     -- Percentual pago pela empresa
    a.valor_total,      -- Valor total
    a.valor_liquido,    -- Valor líquido (desconto na folha)
    a.exporta,          -- 'S' = Exportar, 'N' = Não exportar ⬅️ FILTRO CRÍTICO
    a.ativo             -- 'S' = Ativo, 'N' = Inativo
FROM gc.vw_uni_resumo_colaborador a
WHERE a.exporta = 'S'  -- ⚠️ Apenas colaboradores marcados para exportação
```

### 4. 🔐 Controle de Acesso

O sistema legado possui 3 níveis de permissão:

| Código | Permissão              | Descrição                                              |
| ------ | ---------------------- | ------------------------------------------------------ |
| 78004  | Apagar dados antigos   | Permite executar com flag `apagar='S'`                 |
| 78005  | Executar fora do prazo | Permite executar mesmo após prazo de `dias` expirado   |
| 78003  | Atualizar colaborador  | Permite marcar/desmarcar flag `exporta` de colaborador |

**Validação no código:**

```php
// Validação 78004 - Apagar dados
$erro .= $apagar === 'S' && $Acesso->isAcesso(78004,$User) === false
    ? "Ops, você não possui autorização para apagar dados antigos"
    : "";

// Validação 78005 - Executar fora do prazo
if (strtotime(date("d-m-Y")) <= strtotime($max) || $Acesso->isAcesso(78005,$User) === true) {
    // Pode executar
}
```

### 5. 📦 Procedure Oracle: `P_MCW_FECHA_COMISSAO_GLOBAL`

#### **📍 Fonte:** [pgk_global.sql](pgk_global.sql#L436)

**Comportamento:** Esta procedure funciona como um **dispatcher/roteador**. Ela recebe um código de processo e chama a procedure específica correspondente.

#### **Assinatura Completa:**

```sql
PROCEDURE GC.PGK_GLOBAL.P_MCW_FECHA_COMISSAO_GLOBAL(
    P_CODIGO      IN VARCHAR2,  -- Código do processo (ex: '90000001' para Unimed)
    P_MES_REF     IN NUMBER,    -- Mês de referência (1-12)
    P_ANO_REF     IN NUMBER,    -- Ano de referência (2024)
    P_PREVIA      IN VARCHAR,   -- 'S' = Prévia, 'N' = Definitivo
    P_APAGA       IN VARCHAR,   -- 'S' = Apagar dados antigos, 'N' = Manter
    P_USUARIO     IN VARCHAR2,  -- Username do usuário
    P_TODAS       IN VARCHAR,   -- 'S' = Todas empresas, 'N' = Empresa específica
    P_COD_EMPRESA IN NUMBER,    -- Código da empresa
    P_COD_BAND    IN VARCHAR2,  -- Código da bandeira
    P_TIPO        IN VARCHAR,   -- Tipo de dados ('S' = Simplificado, 'C' = Completo)
    P_CATEGORIA   IN VARCHAR,   -- Categoria do processo (ex: 'UNI', 'COM', 'PECSER')
    P_CPF         IN VARCHAR2   -- CPF específico (opcional, NULL = todos)
);
```

#### **Lógica Interna - Código '90000001' (Unimed):**

**📍 Fonte:** [pgk_global.sql](pgk_global.sql#L1027-L1033)

```sql
/* 09 - Exporta Colaboradores para folha*/
if P_CODIGO = '90000001' then
  begin
    select sysdate into vHoraInicio1 from dual;
    PKG_UNI_SAUDE.P_EXP_PLANO_SAUDE(P_MES_REF, P_ANO_REF, P_TIPO, P_APAGA, P_CPF);
  end;
end if;
```

**Descoberta:** A procedure `P_MCW_FECHA_COMISSAO_GLOBAL` delega para:

- **Package:** `PKG_UNI_SAUDE`
- **Procedure:** `P_EXP_PLANO_SAUDE`
- **Parâmetros:** `(mes_ref, ano_ref, tipo, apaga, cpf)`

⚠️ **IMPORTANTE:** Precisamos analisar `PKG_UNI_SAUDE.P_EXP_PLANO_SAUDE` para entender o fluxo completo.

#### **Comportamento Geral:**

**Quando `P_APAGA = 'N'` (INSERIR/ATUALIZAR):**

1. Busca colaboradores com `exporta = 'S'` na view
2. Calcula valores líquidos de desconto
3. Gera registros na tabela de integração TOTVS
4. Registra log de execução em `mcw_processo_log`

**Quando `p_apagar = 'S'` (EXCLUIR):**

1. Remove registros anteriores do período
2. Permite re-execução com dados atualizados
3. Registra log de exclusão

**Quando `p_previa = 'S'` (PRÉVIA):**

1. Não confirma dados na tabela final
2. Apenas valida e mostra preview
3. Útil para validação antes de exportar definitivamente

#### **Tabelas Afetadas - Procedure Completa:**

**📍 Fonte:** [pkg.uni_saude.sql](pkg.uni_saude.sql#L198-L479)

```sql
-- 🔍 ENTRADA (SELECT)
gc.vw_mcw_empresas_mapa          -- Lista empresas ativas para processar
gc.vw_mcw_colaborador            -- Colaboradores ativos (export_totvs='S')
gc.vw_uni_resumo_colaborador     -- Valores de plano de saúde
gc.mcw_data_exportacao_totvs     -- Data pagamento e mês caixa
gc.mcw_processo                  -- Configuração do processo

-- 📤 SAÍDA TOTVS RM (via DB_LINK @dblrm) ⬅️ 🔴 PRODUÇÃO!
rm.pffinanc@dblrm                -- Lançamentos financeiros (evento 7611)
rm.pfperff@dblrm                 -- Períodos de folha (nroperiodo=4)

-- 📝 LOG LOCAL
gc.uni_resumo_colaborador        -- Marca pg='PG', data_pg=sysdate
mcw_processo_log                 -- Log de execução
```

---

## 🚨 ANÁLISE CRÍTICA - PKG_UNI_SAUDE.P_EXP_PLANO_SAUDE

### 🔴 BLOQUEADOR CRÍTICO DE SEGURANÇA

**A procedure manipula diretamente tabelas de PRODUÇÃO via DB_LINK:**

```sql
-- LINHA 329: DELETE em PRODUÇÃO
delete from rm.pffinanc@dblrm  ⬅️ DB_LINK PARA PRODUÇÃO!
where mescomp = p_mes_ref
  and anocomp = p_ano_ref
  and codevento = '7611'
  and tp = 'U';

-- LINHA 351: INSERT em PRODUÇÃO
insert into rm.pfperff@dblrm
  (codcoligada, chapa, anocomp, mescomp, nroperiodo, ...)

-- LINHA 388: UPDATE em PRODUÇÃO
update rm.pffinanc@dblrm
  set valor = v_planoSaude, ...

-- LINHA 414: INSERT em PRODUÇÃO
insert into rm.pffinanc@dblrm
  (codcoligada, chapa, codevento, valor, ...)
```

### 📊 Estrutura das Tabelas TOTVS RM

#### **1. rm.pffinanc@dblrm** - Lançamentos Financeiros

```sql
CREATE TABLE rm.pffinanc (
    codcoligada     NUMBER,        -- Código coligada
    chapa           VARCHAR2(16),  -- Chapa do colaborador
    anocomp         NUMBER(4),     -- Ano competência
    mescomp         NUMBER(2),     -- Mês competência
    nroperiodo      NUMBER,        -- Período (4 para Unimed)
    codevento       VARCHAR2(10),  -- Código evento: '7611' (Plano Saúde Unimed)
    dtpagto         DATE,          -- Data de pagamento
    hora            NUMBER,        -- Hora (0)
    ref             NUMBER,        -- Referência (0.0)
    valor           NUMBER(18,2),  -- Valor do desconto ⬅️ valor_liquido
    valororiginal   NUMBER(18,2),  -- Valor original ⬅️ valor_liquido
    alteradomanual  NUMBER,        -- 0 = Automático
    tp              CHAR(1),       -- Tipo: 'U' = Definitivo, 'S' = Prévia
    data_lanc       DATE,          -- Data lançamento (sysdate)
    reccreatedby    VARCHAR2(50),  -- 'LancAutomatico UNIMED'
    reccreatedon    VARCHAR2(50),  -- ''
    recmodifiedby   VARCHAR2(50),  -- 'LancAutomatico UNIMED'
    recmodifiedon   VARCHAR2(50),  -- ''
    PRIMARY KEY (codcoligada, chapa, anocomp, mescomp, nroperiodo, codevento)
);
```

#### **2. rm.pfperff@dblrm** - Períodos de Folha

```sql
CREATE TABLE rm.pfperff (
    codcoligada     NUMBER,        -- Código coligada
    chapa           VARCHAR2(16),  -- Chapa do colaborador
    anocomp         NUMBER(4),     -- Ano competência
    mescomp         NUMBER(2),     -- Mês competência
    nroperiodo      NUMBER,        -- Período (4)
    mescaixacomum   NUMBER(5),     -- Mês caixa
    reccreatedby    DATE,          -- Data criação (sysdate)
    recmodifiedby   DATE,          -- Data modificação (sysdate)
    reccreatedon    VARCHAR2(50),  -- ''
    recmodifiedon   VARCHAR2(50),  -- ''
    PRIMARY KEY (codcoligada, chapa, anocomp, mescomp, nroperiodo)
);
```

### 🔄 Fluxo Detalhado da Exportação

**📍 Fonte:** [pkg.uni_saude.sql](pkg.uni_saude.sql#L287-L479)

```
1. ♻️ LOOP Empresas (gc.vw_mcw_empresas_mapa WHERE processa='S')
   └─> v_cod_empresa_matriz, v_codcoligada_matriz, v_codfilial_matriz

2. ♻️ LOOP Colaboradores por Empresa
   SELECT FROM gc.vw_mcw_colaborador WHERE:
   - cod_empresa = v_cod_empresa
   - ativo = 'S'
   - situacao IN ('A', 'F')
   - export_totvs = 'S'
   - chapa IS NOT NULL
   - [SE P_CPF não NULL: AND codigo_cpf = P_CPF]

3. 🗑️ SE P_APAGA = 'S':
   DELETE FROM rm.pffinanc@dblrm
   WHERE mescomp = p_mes_ref
     AND anocomp = p_ano_ref
     AND codcoligada = v_codcoligada_matriz
     AND chapa = v_chapa
     AND tp = 'U'
     AND codevento = '7611'

4. 💰 Buscar Valor Plano Saúde:
   SELECT nvl(sum(valor_consumo), 0)
   FROM gc.vw_uni_resumo_colaborador
   WHERE cod_empresa_matriz = v_cod_empresa_matriz
     AND mes_ref = p_mes_ref
     AND ano_ref = p_ano_ref
     AND exporta = 'S'
     AND export_totvs = 'S'
     AND codigo_cpf = v_codigo_cpf

5. 📅 Buscar Data Pagamento:
   SELECT data_pag, mescaixa
   FROM gc.mcw_data_exportacao_totvs
   WHERE cod_empresa = v_cod_empresa_matriz
     AND mes_ref = p_mes_ref
     AND ano_ref = p_ano_ref

6. 💾 SE v_planoSaude > 0:

   a) UPDATE/INSERT rm.pfperff@dblrm:
      - Garante período de folha existe
      - nroperiodo = 4 (fixo para Unimed)
      - mescaixacomum = v_caixa

   b) UPDATE/INSERT rm.pffinanc@dblrm:
      - codevento = '7611' (fixo para Unimed)
      - valor = v_planoSaude
      - valororiginal = v_planoSaude
      - tp = P_TIPO
      - dtpagto = v_diapag
      - data_lanc = sysdate

   c) UPDATE gc.uni_resumo_colaborador:
      - pg = 'PG'
      - data_pg = sysdate

7. ✅ COMMIT após cada colaborador
```

### 🎯 Parâmetros Detalhados

```typescript
P_MES_REF: number; // Mês de referência (1-12)
P_ANO_REF: number; // Ano de referência (2024)
P_TIPO: string; // 'U' = Definitivo, 'S' = Prévia/Simplificado
P_APAGA: string; // 'S' = Apagar dados antigos, 'N' = Manter
P_CPF: string | null; // CPF específico ou NULL = todos
```

### ⚠️ RISCOS CRÍTICOS IDENTIFICADOS

| #   | Risco                                              | Severidade | Impacto                        |
| --- | -------------------------------------------------- | ---------- | ------------------------------ |
| 1   | **DB_LINK aponta para PRODUÇÃO** (`@dblrm`)        | 🔴 CRÍTICO | Executar em DEV afeta PRODUÇÃO |
| 2   | **DELETE sem validação prévia** (se `P_APAGA='S'`) | 🔴 CRÍTICO | Perda de dados em produção     |
| 3   | **Commits intermediários** (sem transação global)  | 🟡 ALTO    | Inconsistência parcial         |
| 4   | **Código evento hardcoded** ('7611')               | 🟡 MÉDIO   | Não configurável               |
| 5   | **Período fixo** (nroperiodo = 4)                  | 🟡 MÉDIO   | Não flexível                   |
| 6   | **Sem validação de duplicidade**                   | 🟡 MÉDIO   | Possível duplicação            |

### 🛡️ ESTRATÉGIAS DE MITIGAÇÃO

#### **Opção 1: DB_LINK para Homologação (RECOMENDADO)**

```sql
-- Criar DB_LINK para ambiente de teste RM
CREATE DATABASE LINK dblrm_hom
CONNECT TO rm_user IDENTIFIED BY password
USING 'rm_hom_tns';

-- Alterar procedure para usar DB_LINK condicional
-- @dblrm_hom em DEV
-- @dblrm em PROD
```

#### **Opção 2: Tabelas Espelho Locais**

```sql
-- Criar tabelas locais espelhando RM
CREATE TABLE gc.rm_pffinanc_staging AS
SELECT * FROM rm.pffinanc@dblrm WHERE 1=0;

CREATE TABLE gc.rm_pfperff_staging AS
SELECT * FROM rm.pfperff@dblrm WHERE 1=0;

-- Procedure grava em staging
-- Job/processo separado sincroniza com RM
```

#### **Opção 3: Modo Somente Leitura (DEV)**

```typescript
// NestJS: Apenas validação em DEV, sem execução real
if (process.env.NODE_ENV !== 'production') {
  // Simula exportação, retorna preview
  return this.gerarPreview(params);
} else {
  // Executa procedure real
  return this.executarExportacao(params);
}
```

---

## ✅ STATUS DA ANÁLISE

**✅ CONCLUÍDO:** Análise completa do fluxo de exportação
**✅ CONCLUÍDO:** Identificação de tabelas TOTVS RM  
**✅ CONCLUÍDO:** Mapeamento de campos e estruturas
**🔴 BLOQUEADOR:** DB_LINK aponta para produção - **IMPEDE TESTES EM DEV**

### 📋 Próximas Ações Necessárias

1. **🔴 URGENTE:** Definir estratégia para DB_LINK (Opção 1, 2 ou 3)
2. **🔴 URGENTE:** Validar com infra/DBA criação de DB_LINK homologação
3. **🟡 IMPORTANTE:** Documentar códigos de evento do RM ('7611')
4. **🟡 IMPORTANTE:** Validar estrutura de tabelas RM com time TOTVS

### 6. 🔄 Cenários de Uso

#### **Cenário 1: Exportação Normal**

```
Input:
- mes_ref: 12
- ano_ref: 2024
- empresa: 'GSV'
- processo: '90000001'  ⬅️ CÓDIGO CORRETO
- apagar: 'N'
- previa: 'N'
- cpf: null  ⬅️ TODOS OS COLABORADORES

Fluxo:
1. Valida período (12/2024)
2. Busca data_final do período
3. Valida prazo (hoje <= data_final + 5 dias)
4. Chama PKG_UNI_SAUDE.P_EXP_PLANO_SAUDE
5. Gera registros de integração TOTVS
6. Registra log de sucesso

Output:
{
  "result": true,
  "msg": "Processos de EXPORTAÇÃO executados com sucesso"
}
```

#### **Cenário 2: Prévia (Teste)**

```
Input:
- mes_ref: 12
- ano_ref: 2024
- empresa: 'GSV'
- processo: '90000001'
- apagar: 'N'
- previa: 'S'  ⬅️ MODO PRÉVIA
- cpf: null

Fluxo:
1. Mesma validação
2. Chama PKG_UNI_SAUDE.P_EXP_PLANO_SAUDE com P_TIPO='S' (prévia)
3. Não confirma dados (apenas validação)
4. Retorna preview dos dados que seriam exportados

Output:
{
  "result": true,
  "msg": "Prévia gerada com sucesso"
}
```

#### **Cenário 3: Re-exportação (Apagar e Reprocessar)**

```
Input:
- mes_ref: 12
- ano_ref: 2024
- empresa: 'GSV'
- processo: '90000001'
- apagar: 'S'  ⬅️ APAGAR DADOS ANTIGOS
- previa: 'N'
- cpf: null

Validação Extra:
- Verifica permissão 78004 (Apagar dados antigos)

Fluxo:
1. Valida permissão do usuário
2. Chama PKG_UNI_SAUDE.P_EXP_PLANO_SAUDE com P_APAGA='S'
3. Remove dados antigos do período
4. Re-executa exportação com dados atualizados

Output:
{
  "result": true,
  "msg": "Dados apagados e reprocessados com sucesso"
}
```

#### **Cenário 4: Exportação Individual (Por CPF)**

```
Input:
- mes_ref: 12
- ano_ref: 2024
- empresa: 'GSV'
- processo: '90000001'
- apagar: 'N'
- previa: 'N'
- cpf: '12345678901'  ⬅️ EXPORTAR APENAS ESTE COLABORADOR

Fluxo:
1. Mesma validação
2. Chama PKG_UNI_SAUDE.P_EXP_PLANO_SAUDE com CPF específico
3. Exporta apenas o colaborador informado
4. Útil para correções individuais

Output:
{
  "result": true,
  "msg": "Colaborador exportado com sucesso"
}
```

#### **Cenário 5: Execução Fora do Prazo**

```
Input:
- mes_ref: 11
- ano_ref: 2024
- empresa: 'GSV'
- processo: '90000001'

Situação:
- data_final: 30/11/2024
- dias limite: 5
- data máxima: 05/12/2024
- data atual: 10/12/2024  ⬅️ FORA DO PRAZO

Validação:
- Verifica permissão 78005 (Executar fora do prazo)

Se SEM permissão:
{
  "result": false,
  "msg": "Processo passou da data limite de exportação Max: 05/12/2024"
}

Se COM permissão:
- Executa normalmente
```

### 7. 📝 Logs e Auditoria

#### **Tabela de Log:** `mcw_processo_log`

A procedure `P_MCW_FECHA_COMISSAO_GLOBAL` registra automaticamente:

```sql
INSERT INTO mcw_processo_log (
    codigo,          -- Código do processo
    usuario,         -- Username
    data_proc,       -- Data/hora da execução
    mes_ref,         -- Mês de referência
    ano_ref,         -- Ano de referência
    apaga,           -- Flag de apagar
    previa,          -- Flag de prévia
    hora1,           -- Hora início
    hora2            -- Hora fim
) VALUES (...);
```

**Query de Consulta de Logs:**

```sql
SELECT
    a.codigo,
    a.descricao,
    a.categoria,
    b.usuario,
    b.data_proc,
    b.mes_ref,
    b.ano_ref,
    b.apaga,
    b.previa,
    ROUND((b.hora2 + 0.0001) - b.hora1, 4) AS hora_inicio,
    ROUND(b.hora2 - b.hora1, 4) AS hora_final
FROM nbs.mcw_processo a
LEFT OUTER JOIN mcw_processo_log b ON (a.codigo = b.codigo)
WHERE a.categoria = 'UNI'
ORDER BY a.ordem, b.data_proc DESC;
```

---

## 🎯 ESTADO ATUAL NO NESTJS

### ❌ Nada Implementado

**Status:** 0% completo

**O que precisa ser feito:**

1. **Domain Layer:**
   - Entity: `ExportacaoTOTVS` (se necessário)
   - Value Objects: Período, Empresa (já existem)
   - Repository Interface: `IExportacaoRepository`

2. **Application Layer:**
   - Use Case: `ExportarParaTOTVSUseCase`
   - DTOs: `ExportarParaTOTVSDto`, `ExportacaoResponseDto`
   - Factory: `ExportacaoTOTVSFactory` (se necessário)

3. **Infrastructure Layer:**
   - Repository: `ExportacaoRepository`
   - Service: Chamada à procedure Oracle
   - Utils: Validação de prazo, permissões

4. **Presentation Layer:**
   - Controller: `ExportacaoController`
   - Endpoint: `POST /exportacao/totvs`

---

## 📐 ESPECIFICAÇÃO DE IMPLEMENTAÇÃO

### 1. 📦 Domain Layer

#### **Entity: Exportacao (Opcional)**

```typescript
// src/domain/entities/exportacao.entity.ts
export class Exportacao {
  constructor(
    public readonly mesRef: number,
    public readonly anoRef: number,
    public readonly empresa: string,
    public readonly processo: string,
    public readonly previa: boolean,
    public readonly apagar: boolean,
    public readonly usuario: string,
  ) {
    this.validate();
  }

  private validate(): void {
    if (this.mesRef < 1 || this.mesRef > 12) {
      throw new DomainException('Mês inválido. Deve estar entre 1 e 12');
    }

    if (this.anoRef < 2000) {
      throw new DomainException('Ano inválido');
    }

    if (!this.empresa || this.empresa.trim() === '') {
      throw new DomainException('Empresa é obrigatória');
    }

    if (!this.processo || this.processo.trim() === '') {
      throw new DomainException('Processo é obrigatório');
    }
  }
}
```

#### **Repository Interface**

```typescript
// src/domain/repositories/exportacao.repository.interface.ts
export interface IExportacaoRepository {
  /**
   * Busca data final do período de fechamento
   */
  buscarDataFinalPeriodo(mesRef: number, anoRef: number): Promise<Date | null>;

  /**
   * Busca configuração do processo (dias limite, descrição)
   */
  buscarConfigProcesso(codigoProcesso: string): Promise<{
    dias: number;
    descricao: string;
  } | null>;

  /**
   * Executa procedure de exportação TOTVS Unimed
   * Chama: PKG_UNI_SAUDE.P_EXP_PLANO_SAUDE via P_MCW_FECHA_COMISSAO_GLOBAL
   */
  executarExportacao(params: {
    mesRef: number;
    anoRef: number;
    previa: boolean;
    apagar: boolean;
    usuario: string;
    codEmpresa: number;
    bandeira: string;
    tipo: string;
    categoria: string;
    cpf?: string | null; // Opcional: exportar colaborador específico
  }): Promise<void>;

  /**
   * Busca logs de execução do processo
   */
  buscarLogsExportacao(params: {
    categoria: string;
    mesRef?: number;
    anoRef?: number;
    codigo?: string;
  }): Promise<ProcessoLog[]>;
}
```

### 2. 🎯 Application Layer

#### **DTO: ExportarParaTOTVSDto**

```typescript
// src/application/dtos/exportacao/exportar-para-totvs.dto.ts
import {
  IsInt,
  Min,
  Max,
  IsString,
  IsBoolean,
  IsOptional,
} from 'class-validator';

export class ExportarParaTOTVSDto {
  @IsInt()
  @Min(1)
  @Max(12)
  mesRef: number;

  @IsInt()
  @Min(2000)
  anoRef: number;

  @IsString()
  empresa: string; // Sigla da empresa (ex: 'GSV', 'GT', 'EC')

  @IsBoolean()
  @IsOptional()
  previa?: boolean = false; // true = Gerar prévia, false = Definitivo

  @IsBoolean()
  @IsOptional()
  apagar?: boolean = false; // true = Apagar dados antigos

  @IsString()
  @IsOptional()
  cpf?: string; // CPF específico (opcional, null = todos os colaboradores)
}
```

#### **Use Case: ExportarParaTOTVSUseCase**

```typescript
// src/application/use-cases/exportacao/exportar-para-totvs.use-case.ts
import { Injectable, Logger, Inject, ForbiddenException } from '@nestjs/common';
import { IExportacaoRepository } from 'src/domain/repositories/exportacao.repository.interface';
import { IEmpresaRepository } from 'src/domain/repositories/empresa.repository.interface';
import { ExportarParaTOTVSDto } from 'src/application/dtos/exportacao/exportar-para-totvs.dto';

@Injectable()
export class ExportarParaTOTVSUseCase {
  private readonly logger = new Logger(ExportarParaTOTVSUseCase.name);

  constructor(
    @Inject('IExportacaoRepository')
    private readonly exportacaoRepository: IExportacaoRepository,

    @Inject('IEmpresaRepository')
    private readonly empresaRepository: IEmpresaRepository,
  ) {}

  async execute(
    dto: ExportarParaTOTVSDto,
    usuario: string,
    permissoes: string[], // Roles do usuário
  ): Promise<{ sucesso: boolean; mensagem: string }> {
    this.logger.log(
      `Iniciando exportação TOTVS - Empresa: ${dto.empresa}, Período: ${dto.mesRef}/${dto.anoRef}`,
    );

    // 1. Validar permissão para apagar dados
    if (dto.apagar && !this.temPermissaoApagar(permissoes)) {
      throw new ForbiddenException(
        'Você não possui autorização para apagar dados antigos',
      );
    }

    // 2. Buscar empresa no banco
    const empresa = await this.empresaRepository.findBySigla(dto.empresa);
    if (!empresa) {
      throw new Error(`Empresa ${dto.empresa} não encontrada`);
    }

    // 3. Buscar data final do período
    const dataFinal = await this.exportacaoRepository.buscarDataFinalPeriodo(
      dto.mesRef,
      dto.anoRef,
    );

    if (!dataFinal) {
      throw new Error(
        `Período de fechamento não encontrado: ${dto.mesRef}/${dto.anoRef}`,
      );
    }

    // 4. Buscar configuração do processo (sempre '90000001' para Unimed)
    const codigoProcesso = '90000001'; // Código fixo para exportação Unimed
    const configProcesso =
      await this.exportacaoRepository.buscarConfigProcesso(codigoProcesso);

    if (!configProcesso) {
      throw new Error(`Processo ${codigoProcesso} não encontrado`);
    }

    // 5. Validar prazo de execução
    const hoje = new Date();
    const dataMaxima = new Date(dataFinal);
    dataMaxima.setDate(dataMaxima.getDate() + configProcesso.dias);

    if (
      hoje > dataMaxima &&
      !this.temPermissaoExecutarForaDoPrazo(permissoes)
    ) {
      const dataMaximaFormatada = dataMaxima.toLocaleDateString('pt-BR');
      throw new ForbiddenException(
        `Processo ${configProcesso.descricao} passou da data limite de exportação. Máximo: ${dataMaximaFormatada}`,
      );
    }

    // 6. Executar procedure de exportação TOTVS
    try {
      await this.exportacaoRepository.executarExportacao({
        mesRef: dto.mesRef,
        anoRef: dto.anoRef,
        previa: dto.previa || false,
        apagar: dto.apagar || false,
        usuario,
        codEmpresa: empresa.codEmpresa,
        bandeira: empresa.bandeira,
        tipo: dto.previa ? 'S' : 'C', // S = Simplificado/Prévia, C = Completo
        categoria: 'UNI',
        cpf: dto.cpf || null, // null = todos os colaboradores
      });

      const tipoExecucao = dto.previa ? 'PRÉVIA' : 'EXPORTAÇÃO';
      const alcance = dto.cpf ? `CPF ${dto.cpf}` : 'todos os colaboradores';
      const mensagem = `${tipoExecucao} executada com sucesso para ${alcance} da empresa ${dto.empresa} no período ${dto.mesRef}/${dto.anoRef}`;

      this.logger.log(mensagem);

      return {
        sucesso: true,
        mensagem,
      };
    } catch (error) {
      this.logger.error(
        `Erro ao executar exportação: ${error.message}`,
        error.stack,
      );
      throw new Error(`Erro ao executar exportação: ${error.message}`);
    }
  }

  /**
   * Verifica se usuário tem permissão para apagar dados antigos
   * Equivalente à permissão 78004 do sistema legado
   */
  private temPermissaoApagar(permissoes: string[]): boolean {
    return permissoes.includes('ADMIN') || permissoes.includes('DP');
  }

  /**
   * Verifica se usuário tem permissão para executar fora do prazo
   * Equivalente à permissão 78005 do sistema legado
   */
  private temPermissaoExecutarForaDoPrazo(permissoes: string[]): boolean {
    return permissoes.includes('ADMIN');
  }
}
```

### 3. 🏗️ Infrastructure Layer

#### **Repository: ExportacaoRepository**

```typescript
// src/infrastructure/repositories/exportacao.repository.ts
import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from 'src/database/database.services';
import { IExportacaoRepository } from 'src/domain/repositories/exportacao.repository.interface';
import { ProcessoLog } from 'src/domain/entities/processo-log.entity';

@Injectable()
export class ExportacaoRepository implements IExportacaoRepository {
  private readonly logger = new Logger(ExportacaoRepository.name);

  constructor(private readonly databaseService: DatabaseService) {}

  async buscarDataFinalPeriodo(
    mesRef: number,
    anoRef: number,
  ): Promise<Date | null> {
    const query = `
      SELECT TO_CHAR(data_final, 'YYYY-MM-DD') AS data_final
      FROM gc.mcw_periodo_fechamento
      WHERE mes_ref = :mesRef
        AND ano_ref = :anoRef
    `;

    const result = await this.databaseService.executeQuery<{
      DATA_FINAL: string;
    }>(query, { mesRef, anoRef });

    if (!result || result.length === 0) {
      return null;
    }

    return new Date(result[0].DATA_FINAL);
  }

  async buscarConfigProcesso(codigoProcesso: string): Promise<{
    dias: number;
    descricao: string;
  } | null> {
    const query = `
      SELECT dias, descricao
      FROM gc.mcw_processo
      WHERE codigo = :codigoProcesso
        AND ativo = 'S'
    `;

    const result = await this.databaseService.executeQuery<{
      DIAS: number;
      DESCRICAO: string;
    }>(query, { codigoProcesso });

    if (!result || result.length === 0) {
      return null;
    }

    return {
      dias: result[0].DIAS,
      descricao: result[0].DESCRICAO,
    };
  }

  async executarExportacao(params: {
    mesRef: number;
    anoRef: number;
    previa: boolean;
    apagar: boolean;
    usuario: string;
    codEmpresa: number;
    bandeira: string;
    tipo: string;
    categoria: string;
    cpf?: string | null;
  }): Promise<void> {
    const {
      mesRef,
      anoRef,
      previa,
      apagar,
      usuario,
      codEmpresa,
      bandeira,
      tipo,
      categoria,
      cpf,
    } = params;

    // Conversão de boolean para 'S'/'N' conforme esperado pelo Oracle
    const flagPrevia = previa ? 'S' : 'N';
    const flagApagar = apagar ? 'S' : 'N';
    const codigoProcesso = '90000001'; // Código fixo para exportação Unimed
    const todas = 'N'; // Sempre 'N' (empresa específica)

    const query = `
      BEGIN 
        GC.PGK_GLOBAL.P_MCW_FECHA_COMISSAO_GLOBAL(
          :codigo,
          :mesRef,
          :anoRef,
          :previa,
          :apagar,
          :usuario,
          :todas,
          :codEmpresa,
          :bandeira,
          :tipo,
          :categoria,
          :cpf
        ); 
      END;
    `;

    this.logger.debug('Executando procedure P_MCW_FECHA_COMISSAO_GLOBAL', {
      codigo: codigoProcesso,
      mesRef,
      anoRef,
      previa: flagPrevia,
      apagar: flagApagar,
      usuario,
      codEmpresa,
      bandeira,
      tipo,
      categoria,
      cpf: cpf || 'NULL',
    });

    try {
      await this.databaseService.executeQuery(query, {
        codigo: codigoProcesso,
        mesRef,
        anoRef,
        previa: flagPrevia,
        apagar: flagApagar,
        usuario,
        todas,
        codEmpresa: String(codEmpresa),
        bandeira,
        tipo,
        categoria,
        cpf: cpf || null,
      });

      this.logger.log('Procedure executada com sucesso');
    } catch (error) {
      this.logger.error('Erro ao executar procedure:', error);
      throw error;
    }
  }

  async buscarLogsExportacao(params: {
    categoria: string;
    mesRef?: number;
    anoRef?: number;
    codigo?: string;
  }): Promise<ProcessoLog[]> {
    let query = `
      SELECT 
        a.codigo, 
        a.descricao, 
        a.categoria,
        b.usuario,
        b.data_proc,
        b.mes_ref,
        b.ano_ref,
        b.apaga,
        b.previa,
        ROUND((b.hora2 + 0.0001) - b.hora1, 4) AS hora_inicio,
        ROUND(b.hora2 - b.hora1, 4) AS hora_final
      FROM nbs.mcw_processo a
      LEFT OUTER JOIN mcw_processo_log b ON (a.codigo = b.codigo)
      WHERE a.categoria = :categoria
    `;

    const binds: any = { categoria: params.categoria };

    if (params.mesRef) {
      query += ' AND b.mes_ref = :mesRef';
      binds.mesRef = params.mesRef;
    }

    if (params.anoRef) {
      query += ' AND b.ano_ref = :anoRef';
      binds.anoRef = params.anoRef;
    }

    if (params.codigo) {
      query += ' AND a.codigo = :codigo';
      binds.codigo = params.codigo;
    }

    query += ' ORDER BY a.ordem, b.data_proc DESC';

    const rows = await this.databaseService.executeQuery<any>(query, binds);

    return rows.map((row) => ({
      codigo: row.CODIGO,
      descricao: row.DESCRICAO,
      categoria: row.CATEGORIA,
      usuario: row.USUARIO,
      dataProcessamento: row.DATA_PROC,
      mesRef: row.MES_REF,
      anoRef: row.ANO_REF,
      apaga: row.APAGA === 'S',
      previa: row.PREVIA === 'S',
      horaInicio: row.HORA_INICIO,
      horaFinal: row.HORA_FINAL,
    }));
  }
}
```

### 4. 🎛️ Presentation Layer

#### **Controller: ExportacaoController**

```typescript
// src/presentation/controllers/exportacao.controller.ts
import {
  Controller,
  Post,
  Body,
  HttpException,
  HttpStatus,
  Get,
  Query,
} from '@nestjs/common';
import { ExportarParaTOTVSUseCase } from 'src/application/use-cases/exportacao/exportar-para-totvs.use-case';
import { ExportarParaTOTVSDto } from 'src/application/dtos/exportacao/exportar-para-totvs.dto';
import { Roles } from 'src/infrastructure/auth/decorators/roles.decorator';
import { AuthUser } from 'src/infrastructure/auth/decorators/auth-user.decorator';
import type { UserAuth } from 'src/infrastructure/auth/types/user-auth.type';

@Controller('exportacao')
export class ExportacaoController {
  constructor(
    private readonly exportarParaTOTVSUseCase: ExportarParaTOTVSUseCase,
  ) {}

  /**
   * POST /exportacao/totvs
   *
   * Executa exportação de dados para o TOTVS Protheus
   * Requer role DP ou ADMIN
   */
  @Post('totvs')
  @Roles('DP', 'ADMIN')
  async exportarParaTOTVS(
    @Body() dto: ExportarParaTOTVSDto,
    @AuthUser() user: UserAuth,
  ) {
    try {
      const usuario = user.preferred_username || user.email || 'sistema';

      const resultado = await this.exportarParaTOTVSUseCase.execute(
        dto,
        usuario,
        user.roles,
      );

      return {
        sucesso: resultado.sucesso,
        mensagem: resultado.mensagem,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      throw new HttpException(
        {
          sucesso: false,
          mensagem: `Erro na exportação: ${error.message}`,
          timestamp: new Date().toISOString(),
        },
        error instanceof HttpException
          ? error.getStatus()
          : HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * GET /exportacao/logs
   *
   * Busca histórico de exportações
   * Requer role DP ou ADMIN
   */
  @Get('logs')
  @Roles('DP', 'ADMIN')
  async buscarLogs(
    @Query('categoria') categoria: string = 'UNI',
    @Query('mes') mes?: number,
    @Query('ano') ano?: number,
    @Query('codigo') codigo?: string,
  ) {
    try {
      // TODO: Implementar use case de busca de logs
      return {
        sucesso: true,
        dados: [],
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      throw new HttpException(
        `Erro ao buscar logs: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
```

### 5. 📝 Module Configuration

```typescript
// src/application/application.module.ts
import { ExportarParaTOTVSUseCase } from './use-cases/exportacao/exportar-para-totvs.use-case';

@Module({
  imports: [InfrastructureModule],
  providers: [
    // ... outros use cases
    ExportarParaTOTVSUseCase,
  ],
  exports: [
    // ... outros exports
    ExportarParaTOTVSUseCase,
  ],
})
export class ApplicationModule {}
```

```typescript
// src/infrastructure/infrastructure.module.ts
import { ExportacaoRepository } from './repositories/exportacao.repository';

@Module({
  imports: [DatabaseModule],
  providers: [
    // ... outros repositories
    {
      provide: 'IExportacaoRepository',
      useClass: ExportacaoRepository,
    },
  ],
  exports: [
    // ... outros exports
    'IExportacaoRepository',
  ],
})
export class InfrastructureModule {}
```

```typescript
// src/presentation/presentation.module.ts
import { ExportacaoController } from './controllers/exportacao.controller';

@Module({
  imports: [ApplicationModule],
  controllers: [
    // ... outros controllers
    ExportacaoController,
  ],
})
export class PresentationModule {}
```

---

## 📋 PLANO DE IMPLEMENTAÇÃO

### 🎯 **FASE 1: ✅ Análise da Procedure - CONCLUÍDA**

#### **Objetivos:** ✅ TODOS CONCLUÍDOS

1. ✅ Acessar código fonte da procedure `P_MCW_FECHA_COMISSAO_GLOBAL`
2. ✅ Identificar tabela de destino da exportação
3. ✅ Compreender formato dos dados exportados
4. ✅ Documentar parâmetros e comportamento

#### **Descobertas:**

**✅ Procedure Dispatcher Identificada:**

- Package: `GC.PGK_GLOBAL`
- Procedure: `P_MCW_FECHA_COMISSAO_GLOBAL` (12 parâmetros)
- Código processo: `'90000001'` para Unimed

**✅ Procedure Real de Exportação:**

- Package: `GC.PKG_UNI_SAUDE`
- Procedure: `P_EXP_PLANO_SAUDE`
- Fonte: [pkg.uni_saude.sql](pkg.uni_saude.sql#L198-L479)

**✅ Tabelas de Destino Identificadas:**

- `rm.pffinanc@dblrm` - Lançamentos financeiros (evento '7611')
- `rm.pfperff@dblrm` - Períodos de folha (nroperiodo=4)
- `gc.uni_resumo_colaborador` - Marcação local (pg='PG')

**✅ Estrutura de Dados Mapeada:**

- Campo `codevento` = '7611' (Plano Saúde Unimed)
- Campo `valor` = valor líquido do plano
- Campo `tp` = 'U' (definitivo) ou 'S' (prévia)
- Campo `nroperiodo` = 4 (fixo)

**🔴 BLOQUEADOR CRÍTICO IDENTIFICADO:**

- DB_LINK `@dblrm` aponta para **PRODUÇÃO**
- DELETE/INSERT/UPDATE direto em produção
- **IMPEDE TESTES EM AMBIENTE DE DESENVOLVIMENTO**

#### **Decisões Necessárias:**

- [ ] **URGENTE:** Definir estratégia para DB_LINK (ver seção "Estratégias de Mitigação")
- [ ] **URGENTE:** Validar com DBA criação de DB_LINK para homologação RM
- [ ] **IMPORTANTE:** Decidir se implementa modo somente leitura em DEV

---

### 🎯 **FASE 2: Resolução do Bloqueador DB_LINK (1-2 dias)**

#### **Opções de Implementação:**

**Opção A: DB_LINK Condicional (RECOMENDADO)**

```sql
-- Criar DB_LINK para homologação
CREATE DATABASE LINK dblrm_hom
CONNECT TO rm_user_hom IDENTIFIED BY password
USING 'rm_hom_tns';

-- Procedure usa variável de ambiente
v_dblink := CASE
  WHEN ambiente = 'PROD' THEN '@dblrm'
  ELSE '@dblrm_hom'
END;
```

**Opção B: Tabelas Staging Locais**

```sql
-- Criar espelho local
CREATE TABLE gc.rm_pffinanc_staging (
  -- mesma estrutura de rm.pffinanc
);

-- NestJS grava em staging
-- Job/scheduler sincroniza com RM
```

**Opção C: Modo Preview Only (DEV)**

```typescript
// NestJS valida mas não executa
if (env !== 'production') {
  return this.simularExportacao(params);
}
```

#### **Tarefas:**

- [ ] Reunião com DBA/Infra para validar opções
- [ ] Escolher estratégia (A, B ou C)
- [ ] Implementar solução escolhida
- [ ] Testar conexão e permissões
- [ ] Documentar configuração

---

### 🎯 **FASE 3: Domain Layer (2 horas)**

#### **Tarefas:**

- [ ] Criar interface `IExportacaoRepository`
- [ ] Revisar entities existentes (reutilizar se possível)
- [ ] Documentar contratos do domínio

#### **Arquivos:**

```
src/domain/
├── repositories/
│   └── exportacao.repository.interface.ts  ⬅️ CRIAR
└── entities/
    └── exportacao.entity.ts  ⬅️ AVALIAR NECESSIDADE
```

---

### 🎯 **FASE 3: Application Layer (4 horas)**

#### **Tarefas:**

- [ ] Criar `ExportarParaTOTVSDto` com validações
- [ ] Implementar `ExportarParaTOTVSUseCase`
- [ ] Adicionar lógica de validação de prazo
- [ ] Adicionar lógica de controle de permissões
- [ ] Escrever testes unitários

#### **Arquivos:**

```
src/application/
├── dtos/
│   └── exportacao/
│       ├── exportar-para-totvs.dto.ts  ⬅️ CRIAR
│       └── exportacao-response.dto.ts  ⬅️ CRIAR
└── use-cases/
    └── exportacao/
        ├── exportar-para-totvs.use-case.ts  ⬅️ CRIAR
        └── exportar-para-totvs.use-case.spec.ts  ⬅️ CRIAR
```

---

### 🎯 **FASE 4: Infrastructure Layer (4 horas)**

#### **Tarefas:**

- [ ] Implementar `ExportacaoRepository`
- [ ] Criar query para buscar data final do período
- [ ] Criar query para buscar config do processo
- [ ] Implementar chamada à procedure Oracle
- [ ] Implementar query de logs
- [ ] Testar conexão com banco

#### **Arquivos:**

```
src/infrastructure/
└── repositories/
    └── exportacao.repository.ts  ⬅️ CRIAR
```

---

### 🎯 **FASE 5: Presentation Layer (2 horas)**

#### **Tarefas:**

- [ ] Criar `ExportacaoController`
- [ ] Implementar endpoint `POST /exportacao/totvs`
- [ ] Implementar endpoint `GET /exportacao/logs`
- [ ] Adicionar decorators de autenticação
- [ ] Adicionar tratamento de erros

#### **Arquivos:**

```
src/presentation/
└── controllers/
    └── exportacao.controller.ts  ⬅️ CRIAR
```

---

### 🎯 **FASE 6: Configuração de Módulos (1 hora)**

#### **Tarefas:**

- [ ] Registrar repository em `InfrastructureModule`
- [ ] Registrar use case em `ApplicationModule`
- [ ] Registrar controller em `PresentationModule`
- [ ] Validar injeção de dependências

---

### 🎯 **FASE 7: Testes (4-6 horas)**

#### **Testes Unitários:**

- [ ] `ExportarParaTOTVSUseCase.spec.ts`
  - Validação de permissões
  - Validação de prazo
  - Cenários de sucesso
  - Cenários de erro

#### **Testes de Integração:**

- [ ] Testar chamada à procedure Oracle
- [ ] Validar estrutura de dados
- [ ] Testar com dados reais (em dev)

#### **Testes E2E:**

- [ ] POST /exportacao/totvs (sucesso)
- [ ] POST /exportacao/totvs (sem permissão)
- [ ] POST /exportacao/totvs (fora do prazo)
- [ ] GET /exportacao/logs

---

### 🎯 **FASE 8: Documentação (2 horas)**

#### **Documentos a Criar/Atualizar:**

- [ ] Atualizar `MAPEAMENTO_ENDPOINTS.md`
- [ ] Criar `DOCUMENTACAO_EXPORTACAO.md` (similar ao de processos)
- [ ] Atualizar `ANALISE_COMPLETA_MODULO_UNI.md`
- [ ] Adicionar exemplos de request/response
- [ ] Documentar permissões necessárias

---

## ⏱️ ESTIMATIVAS E PRIORIDADES

### 📊 Resumo de Tempo

| Fase                            | Estimativa   | Prioridade | Status           |
| ------------------------------- | ------------ | ---------- | ---------------- |
| ✅ Análise da Procedure         | 1 dia        | 🔴 CRÍTICA | ✅ **CONCLUÍDO** |
| 🔴 Resolução Bloqueador DB_LINK | 1-2 dias     | 🔴 CRÍTICA | ⏳ Pendente      |
| Domain Layer                    | 2 horas      | 🔴 CRÍTICA | ⏳ Pendente      |
| Application Layer               | 4 horas      | 🔴 CRÍTICA | ⏳ Pendente      |
| Infrastructure Layer            | 4 horas      | 🔴 CRÍTICA | ⏳ Pendente      |
| Presentation Layer              | 2 horas      | 🔴 CRÍTICA | ⏳ Pendente      |
| Configuração de Módulos         | 1 hora       | 🔴 CRÍTICA | ⏳ Pendente      |
| Testes                          | 4-6 horas    | 🟡 ALTA    | ⏳ Pendente      |
| Documentação                    | 2 horas      | 🟢 MÉDIA   | ⏳ Pendente      |
| **TOTAL**                       | **4-6 dias** | -          | **10%**          |

### 🎯 Cronograma Atualizado

#### **✅ Dia 1: CONCLUÍDO**

- ✅ Análise completa da procedure Oracle
- ✅ Identificação de tabelas TOTVS RM
- ✅ Mapeamento de estruturas de dados
- ✅ Identificação do bloqueador crítico (DB_LINK)
- ✅ Atualização da documentação

#### **🔴 Dia 2: BLOQUEADO - Aguardando Decisão**

**APÓS RESOLUÇÃO DO BLOQUEADOR:**

#### **Dia 3-4: Implementação**

- Domain Layer (2 horas)
- Application Layer (4 horas)
- Infrastructure Layer (4 horas)
- Presentation Layer (2 horas)
- Configuração de módulos (1 hora)

#### **Dia 5: Testes**

- Testes unitários (manhã)
- Testes de integração (tarde)
- Testes E2E (tarde)

#### **Dia 6: Finalização**

- Ajustes finais
- Documentação completa
- Review de código

---

## ⚠️ RISCOS E BLOQUEADORES - ATUALIZADO

### 🔴 CRÍTICOS - ATUAL

#### **1. ✅ Procedure Desconhecida - RESOLVIDO**

- **Status:** ✅ **CONCLUÍDO**
- **Solução:** Análise completa realizada
- **Resultado:** Código fonte documentado em [pkg.uni_saude.sql](pkg.uni_saude.sql)

#### **2. ✅ Tabela de Destino Desconhecida - RESOLVIDO**

- **Status:** ✅ **CONCLUÍDO**
- **Solução:** Tabelas RM identificadas
- **Resultado:** `rm.pffinanc@dblrm` e `rm.pfperff@dblrm` documentadas

#### **3. 🔴 DB_LINK para Produção - BLOQUEADOR ATIVO**

- **Risco:** Procedure usa `@dblrm` (PRODUÇÃO)
- **Impacto:** ⚠️ **EXECUTAR EM DEV AFETA PRODUÇÃO**
- **Mitigação:** Implementar uma das 3 opções documentadas
- **Bloqueador:** 🔴 **SIM - IMPEDE DESENVOLVIMENTO**
- **Ações:**
  - [ ] Reunião com DBA/Infra
  - [ ] Escolher estratégia (A, B ou C)
  - [ ] Implementar solução
  - [ ] Testar em ambiente isolado

### 🟡 ALTOS

#### **4. ✅ Formato do Arquivo TOTVS - RESOLVIDO**

- **Status:** ✅ **CONCLUÍDO**
- **Solução:** Estrutura das tabelas RM mapeada
- **Resultado:** Campos e tipos documentados
- **Bloqueador:** NÃO - procedure já implementa

#### **5. ✅ Validação de Permissões - RESOLVIDO**

- **Status:** ✅ **CONCLUÍDO**
- **Solução:** Mapeamento 78004→DP/ADMIN, 78005→ADMIN
- **Resultado:** Permissões documentadas
- **Bloqueador:** NÃO - usar roles existentes

#### **6. 🟡 Commits Intermediários**

- **Risco:** Procedure faz COMMIT após cada colaborador
- **Impacto:** Inconsistência parcial em caso de erro
- **Mitigação:** Log detalhado + processo de rollback manual
- **Bloqueador:** NÃO - comportamento do legacy

#### **7. 🟡 Código Evento Hardcoded**

- **Risco:** Evento '7611' fixo no código
- **Impacto:** Não configurável por empresa/tipo
- **Mitigação:** Documentar código, criar constante
- **Bloqueador:** NÃO - seguir padrão legacy

---

## 📝 NOTAS IMPORTANTES

### 🔴 ANTES DE COMEÇAR DESENVOLVIMENTO

1. ✅ **CONCLUÍDO:** Analisar procedure `P_MCW_FECHA_COMISSAO_GLOBAL`
2. ✅ **CONCLUÍDO:** Analisar procedure `PKG_UNI_SAUDE.P_EXP_PLANO_SAUDE`
3. ✅ **CONCLUÍDO:** Identificar tabelas de destino
4. ✅ **CONCLUÍDO:** Verificar DB_LINK (🔴 BLOQUEADOR IDENTIFICADO)
5. ⏳ **PENDENTE:** Resolver bloqueador DB_LINK
6. ⏳ **PENDENTE:** Validar em ambiente isolado

### ⚠️ SEGURANÇA CRÍTICA

**NUNCA EXECUTAR EM DEV SEM RESOLVER DB_LINK:**

```sql
-- ⚠️ PERIGO: Estas operações afetam PRODUÇÃO via @dblrm
DELETE FROM rm.pffinanc@dblrm ...    -- ❌ PRODUÇÃO!
INSERT INTO rm.pffinanc@dblrm ...    -- ❌ PRODUÇÃO!
UPDATE FROM rm.pfperff@dblrm ...     -- ❌ PRODUÇÃO!
```

**Opções seguras:**

1. Usar `@dblrm_hom` (DB_LINK homologação)
2. Usar tabelas staging locais
3. Modo preview only (sem execução real)

### ✅ Após Implementação

1. Testar APENAS em ambiente com DB_LINK homologação
2. Validar dados gerados no RM homologação
3. Confirmar com usuários se dados estão corretos
4. Documentar qualquer descoberta adicional
5. Code review focado em segurança

### 🎯 Critérios de Aceitação

- [ ] Endpoint `POST /exportacao/totvs` funcional
- [ ] Validação de permissões implementada (DP, ADMIN)
- [ ] Validação de prazo implementada (dias limite)
- [ ] Procedure executada com sucesso (em homologação)
- [ ] Logs registrados corretamente (mcw_processo_log)
- [ ] Marcação pg='PG' em uni_resumo_colaborador
- [ ] Mensagens de erro claras
- [ ] Testes passando
- [ ] **🔴 CRÍTICO:** DB_LINK NÃO aponta para produção em DEV
- [ ] Documentação completa

---

## 🔗 Referências

- **Código Legacy:** `npd-legacy/com/modules/uni/controller/UnimedController.php` (linhas 510-664)
- **Procedure Oracle:** `GC.PGK_GLOBAL.P_MCW_FECHA_COMISSAO_GLOBAL`
- **Documento Processos:** `ANALISE_MODULO_PROCESSOS.md` (referência de estrutura)
- **Documentação Geral:** `ANALISE_COMPLETA_MODULO_UNI.md`

---

**Última Atualização:** 28 de Janeiro de 2026  
**Próxima Revisão:** Após análise da procedure Oracle  
**Responsável:** Time de Desenvolvimento
