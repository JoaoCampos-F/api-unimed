# 📊 ANÁLISE COMPLETA - MÓDULO DE RELATÓRIOS UNIMED

**Módulo:** Geração de Relatórios PDF  
**Sistema Origem:** npd-legacy (PHP)  
**Data Análise:** 28 de Janeiro de 2026  
**Analista:** AI Assistant

---

## 📋 ÍNDICE

1. [Visão Geral](#1-visão-geral)
2. [Relatórios Identificados](#2-relatórios-identificados)
3. [Arquitetura Atual (Legado)](#3-arquitetura-atual-legado)
4. [Detalhamento de Cada Relatório](#4-detalhamento-de-cada-relatório)
5. [Dependências e Integrações](#5-dependências-e-integrações)
6. [Queries e Dados](#6-queries-e-dados)
7. [Fluxo de Geração](#7-fluxo-de-geração)
8. [Análise de Complexidade](#8-análise-de-complexidade)
9. [Proposta de Migração](#9-proposta-de-migração)
10. [Riscos e Considerações](#10-riscos-e-considerações)

---

## 1. VISÃO GERAL

### 🎯 Objetivo do Módulo

O módulo de relatórios permite aos usuários **gerar documentos PDF** com informações consolidadas sobre:

- Dados de colaboradores e seus planos de saúde
- Valores pagos e não pagos
- Resumos por empresa e centro de custo
- Informações gerenciais para tomada de decisão

### 📊 Tecnologia Atual

O sistema legado utiliza **JasperReports Server** para geração de PDFs:

```
PHP Controller
    ↓
Jasper.php (Client HTTP)
    ↓
JasperReports Server (http://relatorio.viacometa.com.br:8080/jasperserver)
    ↓ (executa .jrxml com query Oracle)
Oracle Database GC
    ↓
PDF gerado e retornado
```

### 🔑 Características Importantes

- ✅ Relatórios compilados em JasperReports (.jrxml)
- ✅ Servidor externo dedicado para geração
- ✅ Queries SQL embutidas nos templates
- ✅ Autenticação: `npd` / `npd1234@`
- ✅ Path: `/reports/INTRANET/uni/{nome_relatorio}`

---

## 2. RELATÓRIOS IDENTIFICADOS

### 📑 Lista Completa (6 Relatórios)

| #   | Nome Ação                     | Nome Arquivo Jasper             | Descrição                                 | Permissão |
| --- | ----------------------------- | ------------------------------- | ----------------------------------------- | --------- |
| 1   | `RelatorioColaborador`        | `RelatorioColaborador`          | Dados individuais de colaborador(es)      | Básico    |
| 2   | `RelatorioEmpresaColaborador` | `relatorioCobranca_por_empresa` | Resumo de todos colaboradores da empresa  | 161003    |
| 3   | `RelatorioPagamento`          | `relatorioPagamentos`           | Lista apenas colaboradores com lançamento | 161003    |
| 4   | `RelatorioNaoPagamento`       | `relatorioNaolancamento`        | Lista colaboradores SEM lançamento        | 161003    |
| 5   | `resumoDept`                  | `resumoCentro`                  | Resumo por colaborador e centro de custo  | 161003    |
| 6   | `resumoCentroCust`            | `relatorioCentroCusto`          | Totalização por centro de custo           | 161003    |

### 🔐 Controle de Acesso

**Permissão 161003:**

- Acesso aos 5 relatórios gerenciais (2-6)
- Requer perfil DP/Gerencial
- Liberado em: [Unimed.php](c:\Users\JOAO-TI-DEV\Documents\api\npd-legacy\com\modules\uni\view\Unimed.php#L164)

**Permissão Básica:**

- Acesso ao relatório de colaborador (1)
- Todos com acesso ao módulo Unimed

---

## 3. ARQUITETURA ATUAL (LEGADO)

### 📂 Estrutura de Arquivos

```
npd-legacy/
├── com/modules/uni/
│   ├── view/Unimed.php                    # Interface com botões
│   └── controller/UnimedController.php    # Cases dos relatórios
├── js/com/uni/Unimed.js                   # Funções JavaScript
└── com/lib/Jaspersoft/
    └── Jasper.php                         # Cliente JasperServer
```

### 🔄 Fluxo de Execução

#### **Passo 1: Interface (View)**

```php
<!-- Unimed.php linha 164 -->
<div class="col-sm-2">
  <div class="btn-group">
    <button class="btn btn-info dropdown-toggle">
      <i class="fa fa-file-pdf-o"></i>
      Relatórios Diversos <span class="caret"></span>
    </button>
    <ul class="dropdown-menu">
      <li><a href="javascript:Unimed.EmpresaColaborador();">
        Resumo por Colaboradores - PDF</a></li>
      <li><a href="javascript:Unimed.colaboradorPagamento();">
        Resumo de Pagamento - PDF</a></li>
      <li><a href="javascript:Unimed.colaboradorNaoPagamento();">
        Resumo de Não Lançamento - PDF</a></li>
      <li><a href="javascript:Unimed.ResumoEmpresa();">
        Resumo Colaborador(es) por Centro Custo - PDF</a></li>
      <li><a href="javascript:Unimed.ResumoCentroCusto();">
        Resumo por Centro Custo - PDF</a></li>
    </ul>
  </div>
</div>
```

#### **Passo 2: JavaScript (Frontend)**

```javascript
// Unimed.js linha 391
exportarColaboradorPDF: function () {
  var data = Unimed.url + '?acao=RelatorioColaborador';
  data += '&empresa=' + $("#busca_empresa").val();
  data += '&ano_ref=' + $("#busca_ano").val();
  data += '&busca_mes=' + $("#busca_mes").val();
  data += '&usuario=' + $("#busca_usuario").val();
  data += '&busca_contrato=' + $("#busca_contrato").val();

  // Validações
  if (erro == '') {
    window.open(data, null, "height=500,width=800");
  }
}
```

#### **Passo 3: Controller PHP**

```php
// UnimedController.php linha 100
case 'RelatorioColaborador':
  $dir  = "uni";
  $file = "RelatorioColaborador";
  @header('Content-Type: application/pdf');

  // Buscar dados da empresa
  $empresa = addslashes($_GET['empresa']);
  @$Empresa->setSigla($empresa);
  $codempresa = $EmpresaDAO->_isCodEmpresaGC();
  $coligada = $EmpresaDAO->_isCodColigadaGC();
  $filial = $EmpresaDAO->_isCodFilialGC();
  $band = $EmpresaDAO->_isGetBandeiraGC();
  $cpf = !empty($_GET['usuario']) ? $_GET['usuario'] : "";
  $contrato = !empty($_GET['busca_contrato']) ? $_GET['busca_contrato'] : "";
  $ano_ref = intval($_GET['ano_ref']);
  $mes = str_pad($_GET['busca_mes'], 2, "0", STR_PAD_LEFT);

  // Montar array de parâmetros
  $arr = array(
    "in_codEmpresa" => $codempresa,
    "in_codColigada" => $coligada,
    "in_codFilial" => $filial,
    "in_mesRef" => $mes,
    "in_anoRef" => $ano_ref,
    "in_codBand" => $band,
    "in_cpf" => $cpf,
    "in_codContrato" => $contrato
  );

  Jasper::loadReport($dir, $arr, $file);
  break;
```

#### **Passo 4: Cliente Jasper**

```php
// Jasper.php linha 34
public static function loadReport($dir, $param = [], $relatorio, $formato = 'pdf') {
  try {
    $report = self::connect()
      ->reportService()
      ->runReport(
        '/reports/INTRANET/' . strtolower($dir) . "/" . $relatorio,
        $formato,
        null,
        null,
        $param
      );
    echo $report; // PDF raw output
  } catch (RESTRequestException $e) {
    // Error handling
  }
}

public static function connect() {
  $c = new Client(
    "http://relatorio.viacometa.com.br:8080/jasperserver",
    "npd",
    "npd1234@",
    ""
  );
  return $c;
}
```

#### **Passo 5: JasperReports Server**

1. Recebe requisição HTTP REST
2. Localiza template: `/reports/INTRANET/uni/{relatorio}.jrxml`
3. Executa query SQL embutida no template
4. Conecta no Oracle GC
5. Processa dados e aplica layout
6. Gera PDF
7. Retorna stream de bytes

---

## 4. DETALHAMENTO DE CADA RELATÓRIO

### 📄 **1. RelatorioColaborador**

**Arquivo:** `RelatorioColaborador.jrxml`

**Descrição:** Relatório individual de colaborador(es) com todos os dados do plano de saúde.

**Parâmetros:**

```javascript
{
  in_codEmpresa: number,    // Código da empresa
  in_codColigada: number,   // Código da coligada
  in_codFilial: number,     // Código da filial
  in_mesRef: string,        // Mês (formato: "01")
  in_anoRef: number,        // Ano (formato: 2026)
  in_codBand: number,       // Código da bandeira
  in_cpf: string,           // CPF do colaborador (opcional)
  in_codContrato: string    // Código do contrato (opcional)
}
```

**Filtros:**

- Empresa específica ou todas
- Mês/Ano obrigatório
- Colaborador específico (se CPF informado)
- Contrato específico (se informado)

**Dados Exibidos:**

- Nome do colaborador
- CPF
- Mensalidade titular
- Mensalidade dependentes
- Valor de consumo
- Valor empresa
- Valor sem desconto
- Valor líquido
- Status de exportação

**Origem dos Dados:**

```sql
-- Provável query (embutida no .jrxml)
SELECT
  cpf, nome, chapa,
  mens_titular, mens_dependente,
  v_consumo, v_empresa, v_sem_desconto, v_liquido,
  exporta, export_totvs
FROM gc.vw_uni_resumo_colaborador
WHERE cod_empresa = :in_codEmpresa
  AND codcoligada = :in_codColigada
  AND codfilial = :in_codFilial
  AND mes_ref = :in_mesRef
  AND ano_ref = :in_anoRef
  AND cod_band = :in_codBand
  AND (:in_cpf IS NULL OR cpf = :in_cpf)
  AND (:in_codContrato IS NULL OR contrato = :in_codContrato)
ORDER BY nome;
```

**Chamada JavaScript:**

```javascript
// Unimed.js linha 391
exportarColaboradorPDF: function () {
  var data = Unimed.url + '?acao=RelatorioColaborador';
  data += '&empresa=' + $("#busca_empresa").val();
  data += '&ano_ref=' + $("#busca_ano").val();
  data += '&busca_mes=' + $("#busca_mes").val();
  data += '&usuario=' + $("#busca_usuario").val();
  data += '&busca_contrato=' + $("#busca_contrato").val();

  window.open(data, null, "height=500,width=800");
}
```

**Validações:**

- ✅ Mês obrigatório
- ✅ Ano obrigatório

---

### 📄 **2. RelatorioEmpresaColaborador**

**Arquivo:** `relatorioCobranca_por_empresa.jrxml`

**Descrição:** Resumo de TODOS os colaboradores da empresa com valores consolidados.

**Parâmetros:**

```javascript
{
  in_codEmpresa: number,
  in_codColigada: number,
  in_codFilial: number,
  in_mesRef: string,
  in_anoRef: number,
  in_codBand: number,
  in_codContrato: string
}
```

**Diferença do Relatório 1:**

- **Não** aceita filtro por CPF específico
- Sempre lista **TODOS** os colaboradores
- Foco em visão gerencial/resumida

**Dados Exibidos:**

- Lista completa de colaboradores
- Totalizadores por empresa
- Soma de mensalidades
- Totais de consumo
- Valores consolidados

**Origem dos Dados:**

```sql
-- Provável query
SELECT
  nome, cpf,
  mens_titular, mens_dependente,
  v_consumo, v_liquido,
  SUM(v_liquido) OVER (PARTITION BY cod_empresa) as total_empresa
FROM gc.vw_uni_resumo_colaborador
WHERE cod_empresa = :in_codEmpresa
  AND mes_ref = :in_mesRef
  AND ano_ref = :in_anoRef
  AND (:in_codContrato IS NULL OR contrato = :in_codContrato)
ORDER BY nome;
```

**Chamada JavaScript:**

```javascript
// Unimed.js linha 424
EmpresaColaborador: function () {
  var data = Unimed.url + '?acao=RelatorioEmpresaColaborador';
  data += '&empresa=' + $("#busca_empresa").val();
  data += '&ano_ref=' + $("#busca_ano").val();
  data += '&busca_mes=' + $("#busca_mes").val();
  data += '&busca_contrato=' + $("#busca_contrato").val();

  window.open(data, null, "height=500,width=800");
}
```

**Permissão:** 161003

---

### 📄 **3. RelatorioPagamento**

**Arquivo:** `relatorioPagamentos.jrxml`

**Descrição:** Lista apenas colaboradores que **TÊM lançamento** (exporta = 'S').

**Parâmetros:**

```javascript
{
  in_codEmpresa: number,
  in_codColigada: number,
  in_codFilial: number,
  in_mesRef: string,
  in_anoRef: number,
  in_codBand: number,
  in_codContrato: string
}
```

**Filtro Específico:**

```sql
WHERE exporta = 'S'  -- Apenas colaboradores marcados para pagamento
```

**Uso:**

- Conferir quem vai receber plano de saúde na folha
- Validar antes de exportar para TOTVS
- Auditoria de lançamentos

**Origem dos Dados:**

```sql
SELECT
  nome, cpf, chapa,
  mens_titular, mens_dependente,
  v_liquido,
  exporta, export_totvs
FROM gc.vw_uni_resumo_colaborador
WHERE cod_empresa = :in_codEmpresa
  AND mes_ref = :in_mesRef
  AND ano_ref = :in_anoRef
  AND exporta = 'S'  -- ← FILTRO CHAVE
  AND (:in_codContrato IS NULL OR contrato = :in_codContrato)
ORDER BY nome;
```

**Chamada JavaScript:**

```javascript
// Unimed.js linha 407
colaboradorPagamento: function () {
  var data = Unimed.url + '?acao=RelatorioPagamento';
  data += '&empresa=' + $("#busca_empresa").val();
  data += '&ano_ref=' + $("#busca_ano").val();
  data += '&usuario=' + $("#busca_usuario").val();
  data += '&busca_mes=' + $("#busca_mes").val();
  data += '&busca_contrato=' + $("#busca_contrato").val();

  window.open(data, null, "height=500,width=800");
}
```

**Permissão:** 161003

---

### 📄 **4. RelatorioNaoPagamento**

**Arquivo:** `relatorioNaolancamento.jrxml`

**Descrição:** Lista apenas colaboradores que **NÃO TÊM lançamento** (exporta = 'N').

**Parâmetros:**

```javascript
{
  in_codEmpresa: number,
  in_codColigada: number,
  in_codFilial: number,
  in_mesRef: string,
  in_anoRef: number,
  in_codBand: number,
  in_codContrato: string
}
```

**Filtro Específico:**

```sql
WHERE exporta = 'N'  -- Apenas colaboradores NÃO marcados
```

**Uso:**

- Identificar colaboradores excluídos da folha
- Validar exclusões antes de exportar
- Justificativa de não pagamento (demitidos, afastados, etc)

**Origem dos Dados:**

```sql
SELECT
  nome, cpf, chapa,
  mens_titular, mens_dependente,
  v_liquido,
  exporta, motivo_nao_exporta
FROM gc.vw_uni_resumo_colaborador
WHERE cod_empresa = :in_codEmpresa
  AND mes_ref = :in_mesRef
  AND ano_ref = :in_anoRef
  AND exporta = 'N'  -- ← FILTRO CHAVE
  AND (:in_codContrato IS NULL OR contrato = :in_codContrato)
ORDER BY nome;
```

**Chamada JavaScript:**

```javascript
// Unimed.js linha 441
colaboradorNaoPagamento: function () {
  var data = Unimed.url + '?acao=RelatorioNaoPagamento';
  data += '&empresa=' + $("#busca_empresa").val();
  data += '&ano_ref=' + $("#busca_ano").val();
  data += '&usuario=' + $("#busca_usuario").val();
  data += '&busca_mes=' + $("#busca_mes").val();
  data += '&busca_contrato=' + $("#busca_contrato").val();

  window.open(data, null, "height=500,width=800");
}
```

**Permissão:** 161003

---

### 📄 **5. resumoDept** (Resumo por Centro de Custo e Colaborador)

**Arquivo:** `resumoCentro.jrxml`

**Descrição:** Resumo detalhado mostrando colaboradores agrupados por centro de custo/departamento.

**Parâmetros:**

```javascript
{
  in_codEmpresa: number,
  in_codColigada: number,
  in_codFilial: number,
  in_mesRef: string,
  in_anoRef: number,
  in_codBand: number,
  in_codContrato: string
}
```

**Agrupamento:**

```sql
GROUP BY centro_custo, departamento
ORDER BY centro_custo, nome_colaborador
```

**Dados Exibidos:**

- Agrupamento por centro de custo
- Lista de colaboradores por departamento
- Subtotais por departamento
- Total geral da empresa

**Origem dos Dados:**

```sql
SELECT
  centro_custo, descricao_cc,
  departamento, descricao_depto,
  nome, cpf,
  v_liquido,
  SUM(v_liquido) OVER (PARTITION BY centro_custo) as subtotal_cc
FROM gc.vw_uni_resumo_colaborador r
LEFT JOIN gc.empresa_centro_custo cc ON r.centro_custo = cc.cod_cc
LEFT JOIN gc.empresa_departamento dp ON r.departamento = dp.cod_depto
WHERE r.cod_empresa = :in_codEmpresa
  AND r.mes_ref = :in_mesRef
  AND r.ano_ref = :in_anoRef
  AND r.exporta = 'S'
ORDER BY centro_custo, departamento, nome;
```

**Chamada JavaScript:**

```javascript
// Unimed.js linha 458
ResumoEmpresa: function () {
  var data = Unimed.url + '?acao=resumoDept';
  data += '&empresa=' + $("#busca_empresa").val();
  data += '&ano_ref=' + $("#busca_ano").val();
  data += '&busca_mes=' + $("#busca_mes").val();
  data += '&busca_contrato=' + $("#busca_contrato").val();

  window.open(data, null, "height=500,width=800");
}
```

**Permissão:** 161003

---

### 📄 **6. resumoCentroCust** (Totalização por Centro de Custo)

**Arquivo:** `relatorioCentroCusto.jrxml`

**Descrição:** Totalização consolidada **APENAS** por centro de custo (sem detalhar colaboradores).

**Parâmetros:**

```javascript
{
  in_codEmpresa: number,
  in_codColigada: number,
  in_codFilial: number,
  in_mesRef: string,
  in_anoRef: number,
  in_codBand: number,
  in_codContrato: string
}
```

**Diferença do Relatório 5:**

- Relatório 5: Mostra colaboradores + totais por CC
- **Relatório 6:** Mostra **APENAS** totais por CC (agregado)

**Dados Exibidos:**

- Centro de custo
- Descrição do centro de custo
- Quantidade de colaboradores
- Total de mensalidades
- Total de consumo
- Total líquido

**Origem dos Dados:**

```sql
SELECT
  centro_custo,
  descricao_cc,
  COUNT(*) as qtd_colaboradores,
  SUM(mens_titular) as total_titular,
  SUM(mens_dependente) as total_dependente,
  SUM(v_consumo) as total_consumo,
  SUM(v_liquido) as total_liquido
FROM gc.vw_uni_resumo_colaborador r
LEFT JOIN gc.empresa_centro_custo cc ON r.centro_custo = cc.cod_cc
WHERE r.cod_empresa = :in_codEmpresa
  AND r.mes_ref = :in_mesRef
  AND r.ano_ref = :in_anoRef
  AND r.exporta = 'S'
GROUP BY centro_custo, descricao_cc
ORDER BY centro_custo;
```

**Chamada JavaScript:**

```javascript
// Unimed.js linha 475
ResumoCentroCusto: function () {
  var data = Unimed.url + '?acao=resumoCentroCust';
  data += '&empresa=' + $("#busca_empresa").val();
  data += '&ano_ref=' + $("#busca_ano").val();
  data += '&busca_mes=' + $("#busca_mes").val();
  data += '&busca_contrato=' + $("#busca_contrato").val();

  window.open(data, null, "height=500,width=800");
}
```

**Permissão:** 161003

---

## 5. DEPENDÊNCIAS E INTEGRAÇÕES

### 🔗 Dependências Externas

#### **1. JasperReports Server**

```
URL: http://relatorio.viacometa.com.br:8080/jasperserver
Usuário: npd
Senha: npd1234@
Path Base: /reports/INTRANET/uni/
```

**Templates Necessários:**

- `/reports/INTRANET/uni/RelatorioColaborador.jrxml`
- `/reports/INTRANET/uni/relatorioCobranca_por_empresa.jrxml`
- `/reports/INTRANET/uni/relatorioPagamentos.jrxml`
- `/reports/INTRANET/uni/relatorioNaolancamento.jrxml`
- `/reports/INTRANET/uni/resumoCentro.jrxml`
- `/reports/INTRANET/uni/relatorioCentroCusto.jrxml`

#### **2. Oracle Database GC**

Todos os relatórios consultam:

- `gc.vw_uni_resumo_colaborador` (view principal)
- `gc.empresa_filial` (dados da empresa)
- `gc.empresa_centro_custo` (nomes dos CCs)
- `gc.empresa_departamento` (nomes dos departamentos)
- `gc.uni_dados_contrato` (contratos Unimed)

### 📊 View Principal: vw_uni_resumo_colaborador

**Estrutura Estimada:**

```sql
CREATE OR REPLACE VIEW gc.vw_uni_resumo_colaborador AS
SELECT
  -- Identificação
  r.cpf,
  r.nome,
  r.chapa,
  r.mes_ref,
  r.ano_ref,

  -- Empresa/Organização
  r.cod_empresa,
  r.codcoligada,
  r.codfilial,
  r.cod_band,
  r.contrato,
  r.centro_custo,
  r.departamento,

  -- Valores Mensalidade
  r.mens_titular,
  r.mens_dependente,
  r.mens_titular + r.mens_dependente as mens_total,

  -- Valores Consumo/Coparticipação
  r.v_consumo,
  r.v_empresa,
  r.v_sem_desconto,

  -- Valor Final
  r.v_liquido,

  -- Flags de Controle
  r.exporta,           -- 'S'/'N' - Se vai para folha
  r.export_totvs,      -- 'S'/'N' - Se vai para TOTVS RM
  r.motivo_nao_exporta,-- Motivo se exporta='N'

  -- Auditoria
  r.data_insercao,
  r.usuario_insercao

FROM gc.uni_resumo_colaborador r
WHERE r.ativo = 'S';
```

---

## 6. QUERIES E DADOS

### 🔍 Query Base para Relatórios

Todos os 6 relatórios seguem estrutura similar:

```sql
-- Template base compartilhado
SELECT
  -- Identificação
  r.cpf,
  r.nome,
  r.chapa,

  -- Valores
  r.mens_titular,
  r.mens_dependente,
  r.v_consumo,
  r.v_empresa,
  r.v_sem_desconto,
  r.v_liquido,

  -- Organização
  r.centro_custo,
  cc.descricao as descricao_cc,
  r.departamento,
  dp.descricao as descricao_depto,

  -- Flags
  r.exporta,
  r.export_totvs

FROM gc.vw_uni_resumo_colaborador r

LEFT JOIN gc.empresa_centro_custo cc
  ON r.centro_custo = cc.cod_cc
  AND r.cod_empresa = cc.cod_empresa

LEFT JOIN gc.empresa_departamento dp
  ON r.departamento = dp.cod_depto
  AND r.cod_empresa = dp.cod_empresa

WHERE r.cod_empresa = :in_codEmpresa
  AND r.codcoligada = :in_codColigada
  AND r.codfilial = :in_codFilial
  AND r.mes_ref = :in_mesRef
  AND r.ano_ref = :in_anoRef
  AND r.cod_band = :in_codBand

  -- Filtros específicos por relatório:
  -- [1] Colaborador: AND (:in_cpf IS NULL OR r.cpf = :in_cpf)
  -- [3] Pagamento: AND r.exporta = 'S'
  -- [4] Não Pagamento: AND r.exporta = 'N'
  -- [5,6] CC/Dept: GROUP BY centro_custo

  AND (:in_codContrato IS NULL OR r.contrato = :in_codContrato)

ORDER BY r.nome;
```

### 📈 Performance

**Estimativa de Registros:**

- Por empresa: 50-500 colaboradores
- Por período: 1 mês
- View indexada por: (cod_empresa, mes_ref, ano_ref, cpf)

**Tempo Esperado:**

- Query: < 1 segundo
- Geração PDF: 2-5 segundos
- Total: ~3-7 segundos

---

## 7. FLUXO DE GERAÇÃO

### 📊 Diagrama Completo

```
┌──────────────────────────────────────────────────────────┐
│ 1. USUÁRIO (Browser)                                     │
│    └─> Clica botão "Relatório X - PDF"                  │
└────────────────────────┬─────────────────────────────────┘
                         ↓
┌──────────────────────────────────────────────────────────┐
│ 2. JAVASCRIPT (Unimed.js)                                │
│    └─> Monta URL com parâmetros                          │
│    └─> window.open() abre nova janela                    │
└────────────────────────┬─────────────────────────────────┘
                         ↓
┌──────────────────────────────────────────────────────────┐
│ 3. PHP CONTROLLER (UnimedController.php)                 │
│    └─> Recebe $_GET['acao'] = 'RelatorioX'              │
│    └─> Busca dados empresa via EmpresaDAO                │
│    └─> Valida parâmetros obrigatórios                    │
│    └─> Monta array $arr com parâmetros                   │
│    └─> Chama Jasper::loadReport($dir, $arr, $file)      │
└────────────────────────┬─────────────────────────────────┘
                         ↓
┌──────────────────────────────────────────────────────────┐
│ 4. JASPER CLIENT (Jasper.php)                            │
│    └─> Conecta em JasperReports Server via HTTP          │
│    └─> Envia request REST com parâmetros                 │
│    └─> Aguarda response (PDF stream)                     │
└────────────────────────┬─────────────────────────────────┘
                         ↓
┌──────────────────────────────────────────────────────────┐
│ 5. JASPERREPORTS SERVER (Externo)                        │
│    └─> Localiza template .jrxml                          │
│    └─> Substitui parâmetros na query SQL                 │
│    └─> Conecta no Oracle Database                        │
│    └─> Executa query                                     │
│    └─> Processa resultset                                │
│    └─> Aplica layout/formatação                          │
│    └─> Gera PDF                                          │
│    └─> Retorna stream de bytes                           │
└────────────────────────┬─────────────────────────────────┘
                         ↓
┌──────────────────────────────────────────────────────────┐
│ 6. ORACLE DATABASE GC                                    │
│    └─> Executa query na view vw_uni_resumo_colaborador   │
│    └─> Retorna resultset                                 │
└────────────────────────┬─────────────────────────────────┘
                         ↓
┌──────────────────────────────────────────────────────────┐
│ 7. PHP CONTROLLER (continuação)                          │
│    └─> Recebe PDF do JasperServer                        │
│    └─> echo $report (output PDF raw)                     │
│    └─> Header: Content-Type: application/pdf             │
└────────────────────────┬─────────────────────────────────┘
                         ↓
┌──────────────────────────────────────────────────────────┐
│ 8. BROWSER                                                │
│    └─> Recebe PDF                                        │
│    └─> Exibe em nova janela ou download                  │
└──────────────────────────────────────────────────────────┘
```

---

## 8. ANÁLISE DE COMPLEXIDADE

### 📊 Matriz de Complexidade

| Relatório                      | Query        | Layout            | Dependências     | Risco    | Tempo Estimado |
| ------------------------------ | ------------ | ----------------- | ---------------- | -------- | -------------- |
| 1. RelatorioColaborador        | ⭐⭐ Simples | ⭐⭐ Simples      | View             | 🟢 Baixo | 4h             |
| 2. RelatorioEmpresaColaborador | ⭐⭐ Simples | ⭐⭐⭐ Médio      | View             | 🟢 Baixo | 6h             |
| 3. RelatorioPagamento          | ⭐⭐ Simples | ⭐⭐ Simples      | View             | 🟢 Baixo | 4h             |
| 4. RelatorioNaoPagamento       | ⭐⭐ Simples | ⭐⭐ Simples      | View             | 🟢 Baixo | 4h             |
| 5. resumoDept                  | ⭐⭐⭐ Médio | ⭐⭐⭐⭐ Complexo | View + CC + Dept | 🟡 Médio | 8h             |
| 6. resumoCentroCust            | ⭐⭐⭐ Médio | ⭐⭐⭐ Médio      | View + CC        | 🟡 Médio | 6h             |

**Total Estimado:** 32 horas (~4 dias)

### 🎯 Pontos de Atenção

#### **Alta Complexidade:**

1. **JasperReports Server Externo**
   - Dependência de servidor terceiro
   - Necessidade de templates .jrxml compilados
   - Autenticação e conexão HTTP

2. **Layouts Visuais**
   - Reproduzir formatação exata dos PDFs atuais
   - Cabeçalhos, rodapés, logos
   - Quebras de página corretas

3. **Agrupamentos e Subtotais**
   - Relatórios 5 e 6 têm lógica complexa
   - Subtotais por centro de custo
   - Totais gerais

#### **Média Complexidade:**

1. **Queries SQL**
   - Simples mas com múltiplos parâmetros
   - LEFT JOINs para descrições
   - Filtros condicionais (cpf, contrato)

2. **Validações**
   - Parâmetros obrigatórios
   - Permissões por relatório
   - Dados de empresa válidos

#### **Baixa Complexidade:**

1. **Fluxo Básico**
   - Controller HTTP direto
   - Response é stream PDF
   - Sem processamento adicional

---

## 9. PROPOSTA DE MIGRAÇÃO

### 🎯 Estratégia Recomendada

#### **Opção A: Manter JasperReports** (Recomendado)

**Pros:**

- ✅ Zero mudanças nos templates existentes
- ✅ Apenas criar API REST para chamadas
- ✅ Menor risco e tempo de desenvolvimento
- ✅ Usuários não percebem mudança

**Contras:**

- ⚠️ Dependência externa continua
- ⚠️ Necessidade de manter servidor Jasper

**Implementação:**

```
NestJS API
    ↓
HTTP Client (axios)
    ↓
JasperReports Server (existente)
    ↓
PDF retornado
```

**Tempo:** ~1 dia (apenas endpoint proxy)

---

#### **Opção B: Migrar para Biblioteca Node.js** (Não Recomendado)

**Bibliotecas Disponíveis:**

- `pdfmake` - Geração programática de PDFs
- `puppeteer` - HTML → PDF via headless Chrome
- `jsPDF` - Biblioteca JavaScript pura

**Pros:**

- ✅ Sem dependência externa
- ✅ Controle total do layout
- ✅ Deploy mais simples

**Contras:**

- ❌ Recriar 6 layouts do zero
- ❌ Testar equivalência visual
- ❌ Manutenção de código de layout
- ❌ ~4 dias de trabalho

**Implementação:**

```typescript
// Exemplo com pdfmake
import * as pdfMake from 'pdfmake/build/pdfmake';

async gerarRelatorioColaborador(params) {
  const dados = await this.query(params);

  const docDefinition = {
    content: [
      { text: 'Relatório de Colaborador', style: 'header' },
      {
        table: {
          body: [
            ['Nome', 'CPF', 'Valor'],
            ...dados.map(d => [d.nome, d.cpf, d.valor])
          ]
        }
      }
    ],
    styles: {
      header: { fontSize: 18, bold: true }
    }
  };

  return pdfMake.createPdf(docDefinition).download();
}
```

**Tempo:** ~4 dias

---

### 🚀 Implementação Recomendada (Opção A)

#### **Arquitetura Clean no NestJS**

```
src/
├── domain/
│   └── repositories/
│       └── relatorio.repository.interface.ts
├── application/
│   ├── dtos/relatorio/
│   │   ├── gerar-relatorio-colaborador.dto.ts
│   │   ├── gerar-relatorio-empresa.dto.ts
│   │   └── ...
│   └── use-cases/relatorio/
│       ├── gerar-relatorio-colaborador.use-case.ts
│       └── ...
├── infrastructure/
│   ├── repositories/
│   │   └── relatorio.repository.ts (HTTP client)
│   └── external-apis/
│       └── jasper-client.service.ts
└── presentation/
    └── controllers/
        └── relatorio.controller.ts
```

#### **1. Repository Interface**

```typescript
// domain/repositories/relatorio.repository.interface.ts
export interface IRelatorioRepository {
  gerarRelatorioColaborador(
    params: RelatorioColaboradorParams,
  ): Promise<Buffer>;
  gerarRelatorioEmpresa(params: RelatorioEmpresaParams): Promise<Buffer>;
  gerarRelatorioPagamento(params: RelatorioParams): Promise<Buffer>;
  gerarRelatorioNaoPagamento(params: RelatorioParams): Promise<Buffer>;
  gerarResumoDepto(params: RelatorioParams): Promise<Buffer>;
  gerarResumoCentroCusto(params: RelatorioParams): Promise<Buffer>;
}

export interface RelatorioColaboradorParams {
  codEmpresa: number;
  codColigada: number;
  codFilial: number;
  mesRef: string;
  anoRef: number;
  codBand: number;
  cpf?: string; // Opcional
  codContrato?: string; // Opcional
}
```

#### **2. Jasper Client Service**

```typescript
// infrastructure/external-apis/jasper-client.service.ts
import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class JasperClientService {
  private readonly logger = new Logger(JasperClientService.name);
  private readonly baseUrl =
    'http://relatorio.viacometa.com.br:8080/jasperserver';
  private readonly username = 'npd';
  private readonly password = 'npd1234@';

  async generateReport(
    reportPath: string,
    format: string = 'pdf',
    parameters: Record<string, any>,
  ): Promise<Buffer> {
    try {
      this.logger.log(`Gerando relatório: ${reportPath}`);

      const url = `${this.baseUrl}/rest_v2/reports${reportPath}.${format}`;

      const response = await axios.get(url, {
        auth: {
          username: this.username,
          password: this.password,
        },
        params: parameters,
        responseType: 'arraybuffer',
        timeout: 30000, // 30 segundos
      });

      return Buffer.from(response.data);
    } catch (error) {
      this.logger.error(`Erro ao gerar relatório: ${error.message}`);
      throw new Error(`Falha na geração do relatório: ${error.message}`);
    }
  }
}
```

#### **3. Repository Implementation**

```typescript
// infrastructure/repositories/relatorio.repository.ts
import { Injectable } from '@nestjs/common';
import { IRelatorioRepository } from 'src/domain/repositories/relatorio.repository.interface';
import { JasperClientService } from '../external-apis/jasper-client.service';

@Injectable()
export class RelatorioRepository implements IRelatorioRepository {
  constructor(private readonly jasperClient: JasperClientService) {}

  async gerarRelatorioColaborador(params): Promise<Buffer> {
    return this.jasperClient.generateReport(
      '/reports/INTRANET/uni/RelatorioColaborador',
      'pdf',
      {
        in_codEmpresa: params.codEmpresa,
        in_codColigada: params.codColigada,
        in_codFilial: params.codFilial,
        in_mesRef: params.mesRef,
        in_anoRef: params.anoRef,
        in_codBand: params.codBand,
        in_cpf: params.cpf || null,
        in_codContrato: params.codContrato || null,
      },
    );
  }

  async gerarRelatorioEmpresa(params): Promise<Buffer> {
    return this.jasperClient.generateReport(
      '/reports/INTRANET/uni/relatorioCobranca_por_empresa',
      'pdf',
      {
        in_codEmpresa: params.codEmpresa,
        in_codColigada: params.codColigada,
        in_codFilial: params.codFilial,
        in_mesRef: params.mesRef,
        in_anoRef: params.anoRef,
        in_codBand: params.codBand,
        in_codContrato: params.codContrato || null,
      },
    );
  }

  // ... demais métodos seguem mesmo padrão
}
```

#### **4. DTO**

```typescript
// application/dtos/relatorio/gerar-relatorio-colaborador.dto.ts
import { IsInt, Min, Max, IsString, IsOptional } from 'class-validator';

export class GerarRelatorioColaboradorDto {
  @IsString()
  empresa: string; // Código como string (será convertido)

  @IsInt()
  @Min(1)
  @Max(12)
  mesRef: number;

  @IsInt()
  @Min(2000)
  anoRef: number;

  @IsString()
  @IsOptional()
  cpf?: string;

  @IsString()
  @IsOptional()
  contrato?: string;
}
```

#### **5. Use Case**

```typescript
// application/use-cases/relatorio/gerar-relatorio-colaborador.use-case.ts
import { Injectable, Inject } from '@nestjs/common';
import type { IRelatorioRepository } from 'src/domain/repositories/relatorio.repository.interface';
import type { IEmpresaRepository } from 'src/domain/repositories/empresa.repository.interface';

@Injectable()
export class GerarRelatorioColaboradorUseCase {
  constructor(
    @Inject('IRelatorioRepository')
    private readonly relatorioRepository: IRelatorioRepository,

    @Inject('IEmpresaRepository')
    private readonly empresaRepository: IEmpresaRepository,
  ) {}

  async execute(dto): Promise<Buffer> {
    // 1. Buscar empresa
    const codEmpresa = parseInt(dto.empresa, 10);
    const empresa = await this.empresaRepository.buscarPorCodigo(codEmpresa);

    if (!empresa) {
      throw new Error(`Empresa ${dto.empresa} não encontrada`);
    }

    // 2. Gerar relatório
    return await this.relatorioRepository.gerarRelatorioColaborador({
      codEmpresa: empresa.codEmpresa,
      codColigada: empresa.codColigada,
      codFilial: empresa.codFilial,
      mesRef: dto.mesRef.toString().padStart(2, '0'),
      anoRef: dto.anoRef,
      codBand: empresa.codBand,
      cpf: dto.cpf,
      codContrato: dto.contrato,
    });
  }
}
```

#### **6. Controller**

```typescript
// presentation/controllers/relatorio.controller.ts
import { Controller, Post, Body, Res, HttpStatus } from '@nestjs/common';
import { Response } from 'express';
import { GerarRelatorioColaboradorUseCase } from 'src/application/use-cases/relatorio/gerar-relatorio-colaborador.use-case';
import { GerarRelatorioColaboradorDto } from 'src/application/dtos/relatorio/gerar-relatorio-colaborador.dto';
import { Roles } from 'src/infrastructure/auth/decorators/roles.decorator';

@Controller('relatorios')
export class RelatorioController {
  constructor(
    private readonly gerarRelatorioColaboradorUseCase: GerarRelatorioColaboradorUseCase,
  ) {}

  @Post('colaborador')
  @Roles('DP', 'ADMIN')
  async gerarRelatorioColaborador(
    @Body() dto: GerarRelatorioColaboradorDto,
    @Res() res: Response,
  ) {
    try {
      const pdfBuffer =
        await this.gerarRelatorioColaboradorUseCase.execute(dto);

      res.set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename=relatorio_colaborador_${dto.mesRef}_${dto.anoRef}.pdf`,
        'Content-Length': pdfBuffer.length,
      });

      res.status(HttpStatus.OK).send(pdfBuffer);
    } catch (error) {
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        sucesso: false,
        mensagem: `Erro ao gerar relatório: ${error.message}`,
      });
    }
  }

  // ... demais endpoints
}
```

---

## 10. RISCOS E CONSIDERAÇÕES

### ⚠️ Riscos Identificados

#### **1. Dependência de Servidor Externo (Alto)**

- **Risco:** JasperReports Server offline/indisponível
- **Impacto:** Todos os relatórios param de funcionar
- **Mitigação:**
  - Monitoramento de disponibilidade
  - Cache de relatórios recentes
  - Fallback para modo "lista de dados" sem PDF

#### **2. Templates .jrxml Não Disponíveis (Médio)**

- **Risco:** Templates podem não estar no servidor ou terem nomes diferentes
- **Impacto:** Necessidade de recriar layouts
- **Mitigação:**
  - Solicitar backup dos templates ao time de infraestrutura
  - Documentar paths exatos
  - Testes em ambiente de homologação primeiro

#### **3. Performance (Baixo)**

- **Risco:** Geração de PDF pode ser lenta para muitos colaboradores
- **Impacto:** Timeout de requisição
- **Mitigação:**
  - Timeout de 30 segundos
  - Processamento assíncrono para relatórios grandes
  - Filas (Bull/Redis) para geração em background

#### **4. Permissões (Baixo)**

- **Risco:** Permissão 161003 pode não existir no novo sistema
- **Impacto:** Usuários sem acesso aos relatórios gerenciais
- **Mitigação:**
  - Mapear permissão 161003 para roles DP/ADMIN
  - Documentar controle de acesso

### 💡 Recomendações

#### **Curto Prazo:**

1. ✅ Implementar Opção A (proxy para JasperServer)
2. ✅ Criar 6 endpoints REST
3. ✅ Testar com dados reais
4. ✅ Documentar paths e parâmetros

#### **Médio Prazo:**

1. ⏳ Obter backup dos templates .jrxml
2. ⏳ Configurar monitoramento do JasperServer
3. ⏳ Implementar cache de relatórios (Redis)
4. ⏳ Criar filas para processamento assíncrono

#### **Longo Prazo:**

1. 🔮 Avaliar migração para biblioteca Node.js
2. 🔮 Modernizar layouts (responsivos, interativos)
3. 🔮 Adicionar relatórios em Excel/CSV
4. 🔮 Dashboard de relatórios agendados

---

## 📊 RESUMO EXECUTIVO

### Situação Atual

- ✅ 6 relatórios em produção
- ✅ JasperReports Server funcionando
- ✅ Templates .jrxml existentes (presumido)
- ✅ Queries SQL simples (view única)

### Estratégia Recomendada

- **Opção A:** Manter JasperServer + criar proxy NestJS
- **Tempo:** 1-2 dias
- **Risco:** Baixo

### Próximos Passos

1. Validar acesso ao JasperReports Server
2. Confirmar existência dos 6 templates
3. Implementar endpoint proxy
4. Testar geração de cada relatório
5. Documentar para usuários finais

---

**Documentação completa do módulo de relatórios!**  
**Última atualização:** 28 de Janeiro de 2026  
**Versão:** 1.0
