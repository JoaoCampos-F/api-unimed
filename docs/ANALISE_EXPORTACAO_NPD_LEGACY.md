# 🔍 ANÁLISE DETALHADA - EXPORTAÇÃO NPD-LEGACY

**Data:** 29 de Janeiro de 2026  
**Objetivo:** Entender 100% como funciona a exportação no NPD-Legacy antes de implementar no NestJS

---

## 📋 FLUXO COMPLETO DA EXPORTAÇÃO

### 1. Interface Frontend → Controller

**Arquivo:** `npd-legacy/com/modules/uni/controller/UnimedController.php`  
**Case:** `'Execute'` (linha 594)

#### Parâmetros Recebidos do POST:

```php
// DADOS DO PERÍODO
$_POST['proc_mes']    // Mês de referência
$_POST['proc_ano']    // Ano de referência

// FILTROS (CASCATA)
$_POST['proc_band']   // Bandeira (seguimento): vazio = 'T' (todas)
$_POST['proc_emp']    // Empresa: vazio = 'T' (todas da bandeira)
$_POST['proc_colab']  // Colaborador CPF: vazio = '' (todos)

// FLAGS DE CONTROLE
$_POST['checkAPAGA']  // Apagar dados: default 'N'
$_POST['checkPrevia'] // Modo prévia: default 'N'
$_POST['processo']    // Código do processo (obrigatório)
$_POST['categoria']   // Categoria do processo
$_POST['tipo']        // Tipo de dado
```

#### Lógica de Filtros em Cascata:

```php
// REGRA 1: Determinar se exporta todas empresas ou específica
$bandeira = empty($_POST['proc_band']) === true ? 'T' : $_POST['proc_band'];
$empresa  = empty($_POST['proc_emp'])  === true ? 'T' : $_POST['proc_emp'];
$colab    = empty($_POST['proc_colab']) === true ? '' : $_POST['proc_colab'];

// REGRA 2: Se empresa diferente de 'T', buscar dados específicos
if ($empresa != 'T') {
  @$Empresa->setSigla($empresa);
  $Unimed->setCodempresa($EmpresaDAO->_isCodEmpresaGC());
  $Unimed->setCodcoligada($EmpresaDAO->_isCodColigadaGC());
  $Unimed->setCodfilial($EmpresaDAO->_isCodFilialGC());
  $Unimed->setCodband($EmpresaDAO->_isGetBandeiraGC());
  $Unimed->setTodasEmpresas('N');  // ✅ Empresa específica
} else {
  $Unimed->setTodasEmpresas('S');  // ✅ TODAS empresas da bandeira
  $Unimed->setCodband($bandeira);   // ✅ Usa bandeira informada
}
```

#### Validações:

```php
$erro = '';
$erro .= $Unimed->getMesRef() === 0 ? "Necessario selecionar o mes<br>" : "";
$erro .= $Unimed->getAnoRef() === 0 ? "Necessario selecionar o ano<br>" : "";
$erro .= $processo === '' ? "INDICAR os processos que serão executados<br>" : "";
$erro .= $op2 === 'S' && $op1 === '' ? "Informar um INDICADOR para Realizar EXCLUSAO !!<br>" : "";
$erro .= $op3 === 'S' && $op1 === '' ? "Informar um INDICADOR para a GERAR PREVIA !!<br>" : "";
$erro .= $Unimed->getCpf() != '' && $empresa =='T' ? "Necessario Informar Empresa para prosseguir!!" : "";
```

**⚠️ REGRA IMPORTANTE:** Se colaborador (CPF) informado, **empresa é obrigatória** (não pode ser 'T')

---

### 2. DAO → Validação de Prazo

**Arquivo:** `npd-legacy/com/modules/uni/model/UnimedDAO.php`  
**Método:** `processarUnimed()` (linha 831)

#### Busca Data Limite:

```php
// Busca data final do período na tabela mcw_periodo
$a = $this->carrregaPeriodoFechamento();
$dataFinal = $a->DATA_FINAL;

// carrregaPeriodoFechamento():
$query = "
  select TO_CHAR(data_final,'YYYY-MM-DD') as data_final
  from gc.mcw_periodo a
  where a.mes_ref = '" . $this->Unimed->getMesRef() . "'
    and a.ano_ref = '" . $this->Unimed->getAnoRef() . "'
";
```

#### Verifica Prazo por Processo:

```php
foreach ($this->Unimed->getProcesso() as $key => $value) {
  // Busca configuração do processo
  $a = $this->carregaProcessoInterno($value);
  $dias = $a->DIAS;
  $desc = $a->DESCRICAO;

  // Calcula data limite (data_final + dias)
  $max = date("d-m-Y", strtotime("+" . $dias . " days", strtotime($dataFinal)));

  // ⚠️ CÓDIGO COMENTADO - Validação de prazo está DESABILITADA
  /*if(strtotime(date("d-m-Y")) <= strtotime($max)
      || $this->Unimed->getAcessoPOS() ===true
      || $this->Unimed->getAcessoADM() ==='ADMIN') { */

  // Executa procedure...
}
```

**📌 DESCOBERTA IMPORTANTE:** No NPD-Legacy a validação de prazo está **COMENTADA**!

---

### 3. Execução da Procedure Oracle

**Procedure:** `GC.PGK_GLOBAL.P_MCW_FECHA_COMISSAO_GLOBAL`

#### Chamada Completa:

```php
$query = "begin GC.PGK_GLOBAL.P_MCW_FECHA_COMISSAO_GLOBAL(
  '{$value}',                                  // :codigo      - Código do processo
  '" . $this->Unimed->getMesref() . "',        // :mesRef      - Mês de referência
  '" . $this->Unimed->getAnoref() . "',        // :anoRef      - Ano de referência
  'N',                                          // :previa      - HARDCODED 'N' (nunca usa prévia)
  '" . $this->Unimed->getApaga() . "',         // :apagar      - Flag apagar dados
  '" . $this->Unimed->getUser() . "',          // :usuario     - Usuário logado
  '" . $this->Unimed->getTodasEmpresas() . "', // :todas       - 'S' ou 'N'
  '" . $this->Unimed->getCodempresa() . "',    // :codEmpresa  - Código empresa (ou vazio se todas)
  '" . $this->Unimed->getCodband() . "',       // :bandeira    - Código bandeira
  '" . $this->Unimed->getTipodeDado() . "',    // :tipo        - Tipo de dado
  '" . $this->Unimed->getCategoria() . "',     // :categoria   - Categoria processo
  '" . $this->Unimed->getCpf() . "'            // :cpf         - CPF colaborador (ou vazio)
); end;";
```

#### Parâmetros da Procedure:

| Ordem | Nome       | Tipo     | Descrição                          | Exemplo             |
| ----- | ---------- | -------- | ---------------------------------- | ------------------- |
| 1     | codigo     | VARCHAR2 | Código do processo                 | '90000001'          |
| 2     | mesRef     | NUMBER   | Mês de referência                  | 1                   |
| 3     | anoRef     | NUMBER   | Ano de referência                  | 2026                |
| 4     | previa     | CHAR(1)  | Modo prévia (SEMPRE 'N' no legacy) | 'N'                 |
| 5     | apagar     | CHAR(1)  | Apagar dados anteriores            | 'S' ou 'N'          |
| 6     | usuario    | VARCHAR2 | Usuário executando                 | 'EC005777'          |
| 7     | todas      | CHAR(1)  | Exportar todas empresas?           | 'S' ou 'N'          |
| 8     | codEmpresa | VARCHAR2 | Código empresa (se todas='N')      | '2' ou ''           |
| 9     | bandeira   | VARCHAR2 | Código bandeira                    | '1' ou 'T'          |
| 10    | tipo       | VARCHAR2 | Tipo de dado                       | ?                   |
| 11    | categoria  | VARCHAR2 | Categoria do processo              | ?                   |
| 12    | cpf        | VARCHAR2 | CPF do colaborador (opcional)      | '12345678900' ou '' |

---

## 🎯 COMPORTAMENTOS IDENTIFICADOS

### ✅ Comportamento 1: Exportar TODAS empresas de uma bandeira

```
Entrada:
- proc_band = '1' (Bandeira específica)
- proc_emp = '' (vazio) ou 'T'
- proc_colab = ''

Resultado:
- todas = 'S'
- bandeira = '1'
- codEmpresa = '' (vazio)
- cpf = ''

Efeito: Procedure processa TODAS empresas da bandeira '1'
```

### ✅ Comportamento 2: Exportar empresa específica

```
Entrada:
- proc_band = '1'
- proc_emp = 'AF' (sigla específica)
- proc_colab = ''

Resultado:
- todas = 'N'
- bandeira = '1' (obtido da empresa)
- codEmpresa = '2' (obtido da sigla 'AF')
- cpf = ''

Efeito: Procedure processa APENAS empresa '2'
```

### ✅ Comportamento 3: Exportar colaborador específico de uma empresa

```
Entrada:
- proc_band = '1'
- proc_emp = 'AF'
- proc_colab = '12345678900'

Resultado:
- todas = 'N'
- bandeira = '1'
- codEmpresa = '2'
- cpf = '12345678900'

Efeito: Procedure processa APENAS colaborador específico
```

### ❌ Comportamento INVÁLIDO: Colaborador sem empresa

```
Entrada:
- proc_band = '1'
- proc_emp = '' ou 'T'
- proc_colab = '12345678900'

Resultado: ERRO
Mensagem: "Necessario Informar Empresa para prosseguir!!"
```

---

## 🔴 DIVERGÊNCIAS IDENTIFICADAS NO NESTJS ATUAL

### 1. ⚠️ **Parâmetro `previa` sempre 'N' no legacy**

**NPD-Legacy:**

```php
'N',  // HARDCODED - nunca usa modo prévia na procedure
```

**NestJS Atual:**

```typescript
previa: flagPrevia,  // Usa o valor do DTO
```

**Ação:** Verificar se a procedure realmente suporta prévia ou se deve ser sempre 'N'.

---

### 2. ⚠️ **Ordem dos parâmetros da procedure**

**NPD-Legacy:** 12 parâmetros na ordem específica

**NestJS Atual:**

```typescript
await this.databaseService.executeQuery(query, {
  codigo: codigoProcesso,
  mesRef,
  anoRef,
  previa: flagPrevia,
  apagar: flagApagar,
  usuario,
  todas, // ❌ SEMPRE 'N' (HARDCODED)
  codEmpresa: String(codEmpresa),
  bandeira,
  tipo,
  categoria,
  cpf: cpf || null,
});
```

**Problema:** `todas` está HARDCODED como 'N' - não permite exportar múltiplas empresas!

---

### 3. 🔴 **Sistema de filtros em cascata NÃO implementado**

**Falta:**

- Opção de exportar "Todas" empresas de uma bandeira
- Validação: CPF requer empresa específica
- Lógica de determinar automaticamente `todas='S'` ou 'N'

---

### 4. ⚠️ **Validação de prazo difere**

**NPD-Legacy:** Validação COMENTADA (desabilitada)

**NestJS:** Validação ATIVA e obrigatória (apenas ADMIN pode executar fora do prazo)

**Decisão necessária:** Manter validação ativa ou replicar comportamento do legacy?

---

## 📊 MAPEAMENTO COMPLETO DOS PARÂMETROS

### Tabela de Mapeamento NPD-Legacy → NestJS:

| NPD-Legacy              | NestJS Atual                | Status      |
| ----------------------- | --------------------------- | ----------- |
| `$_POST['proc_mes']`    | `dto.mesRef`                | ✅ OK       |
| `$_POST['proc_ano']`    | `dto.anoRef`                | ✅ OK       |
| `$_POST['proc_band']`   | **❌ NÃO EXISTE**           | 🔴 FALTA    |
| `$_POST['proc_emp']`    | `dto.empresa` (diferente)   | ⚠️ PARCIAL  |
| `$_POST['proc_colab']`  | **❌ NÃO EXISTE**           | 🔴 FALTA    |
| `$_POST['checkAPAGA']`  | `dto.apagar`                | ✅ OK       |
| `$_POST['checkPrevia']` | `dto.previa`                | ⚠️ DIFERE\* |
| `$_POST['processo']`    | HARDCODED `'90000001'`      | ⚠️ DIFERE   |
| `$_POST['categoria']`   | `dto.categoria` (parâmetro) | ✅ OK       |
| `$_POST['tipo']`        | `dto.tipo` (parâmetro)      | ✅ OK       |
| `setTodasEmpresas()`    | **HARDCODED 'N'**           | 🔴 FALTA    |

\*No legacy, `previa` vai sempre como 'N' para a procedure (hardcoded), mas existe a flag no frontend.

---

## 🎯 RECOMENDAÇÕES PARA NESTJS

### 1. ✅ Adicionar campo `bandeira` no DTO

```typescript
@IsOptional()
@IsString()
bandeira?: string;  // Código da bandeira (2 rodas, 4 rodas, etc)
```

### 2. ✅ Adicionar campo `cpfColaborador` no DTO

```typescript
@IsOptional()
@IsString()
cpfColaborador?: string;  // CPF do colaborador específico (opcional)
```

### 3. ✅ Modificar lógica do `empresa` no DTO

```typescript
@IsOptional()
@IsString()
empresa?: string;  // Sigla da empresa OU 'T' para todas da bandeira
```

### 4. ✅ Implementar lógica de filtros em cascata

```typescript
// Determinar se exporta todas empresas ou específica
const exportarTodasEmpresas =
  dto.empresa === 'T' || (!dto.empresa && dto.bandeira);

if (exportarTodasEmpresas) {
  // Validar que bandeira foi informada
  if (!dto.bandeira) {
    throw new BadRequestException(
      'Bandeira é obrigatória ao exportar todas empresas',
    );
  }

  params.todas = 'S';
  params.bandeira = dto.bandeira;
  params.codEmpresa = ''; // Vazio quando todas
} else {
  // Empresa específica
  const empresa = await this.empresaRepository.buscarPorSigla(dto.empresa);

  params.todas = 'N';
  params.codEmpresa = String(empresa.codEmpresa);
  params.bandeira = String(empresa.codBand);
}
```

### 5. ✅ Validar: CPF requer empresa específica

```typescript
if (dto.cpfColaborador && exportarTodasEmpresas) {
  throw new BadRequestException(
    'Para exportar colaborador específico, é necessário informar a empresa',
  );
}
```

### 6. ⚠️ Decisão sobre `previa`

**Opção A:** Manter sempre 'N' como no legacy

```typescript
const flagPrevia = 'N'; // SEMPRE 'N' como no legacy
```

**Opção B:** Usar o valor do DTO mas documentar

```typescript
const flagPrevia = dto.previa ? 'S' : 'N';
// ⚠️ Verificar se procedure suporta modo prévia
```

### 7. ⚠️ Decisão sobre validação de prazo

**Opção A:** Remover validação (replicar legacy)

```typescript
// Sem validação de prazo (como no legacy comentado)
```

**Opção B:** Manter validação mas documentar diferença

```typescript
// Validação ativa (diferente do legacy)
await this.validarPrazoExportacao(dto.mesRef, dto.anoRef, permissoes);
```

---

## 📝 CHECKLIST DE IMPLEMENTAÇÃO

- [ ] **1. Atualizar DTO** com novos campos:
  - [ ] `bandeira?: string`
  - [ ] `cpfColaborador?: string`
  - [ ] Modificar `empresa` para aceitar 'T'
- [ ] **2. Criar método no repository:**
  - [ ] `buscarEmpresasPorBandeira(codBand: string)`
  - [ ] `buscarEmpresaPorSigla(sigla: string)`
- [ ] **3. Implementar lógica no Use Case:**
  - [ ] Determinar `todas='S'` ou 'N'
  - [ ] Validar: bandeira obrigatória se todas='S'
  - [ ] Validar: CPF requer empresa específica
  - [ ] Buscar dados da empresa corretamente
- [ ] **4. Atualizar chamada da procedure:**
  - [ ] Passar `todas` dinâmico (não hardcoded)
  - [ ] Passar `codEmpresa` vazio quando todas='S'
  - [ ] Passar `cpf` corretamente
  - [ ] Decidir sobre parâmetro `previa`
- [ ] **5. Testes:**
  - [ ] Cenário 1: Exportar todas empresas de uma bandeira
  - [ ] Cenário 2: Exportar empresa específica
  - [ ] Cenário 3: Exportar colaborador específico
  - [ ] Cenário 4: Validar erro quando CPF sem empresa
- [ ] **6. Documentação:**
  - [ ] Atualizar Swagger/OpenAPI
  - [ ] Documentar diferenças com legacy (se houver)
  - [ ] Adicionar exemplos de uso

---

## 🔗 ARQUIVOS ANALISADOS

- `npd-legacy/com/modules/uni/controller/UnimedController.php` (linhas 594-665)
- `npd-legacy/com/modules/uni/model/UnimedDAO.php` (linhas 831-878)

---

**Conclusão:** NPD-Legacy tem sistema de filtros em cascata completo que **NÃO está implementado no NestJS**. Precisamos adicionar essa funcionalidade para replicar o comportamento correto.
