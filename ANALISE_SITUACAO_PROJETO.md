# 📊 ANÁLISE PROFUNDA: MÓDULO UNI (UNIMED) - NPD-LEGACY vs API-UNIMED

**Data da Análise:** 12 de Janeiro de 2026  
**Analista:** GitHub Copilot  
**Objetivo:** Diagnosticar situação atual do projeto api-unimed vs sistema legado

---

## 🎯 RESUMO EXECUTIVO

Após análise profunda do código legado PHP e do projeto atual NestJS, identifiquei que **o projeto api-unimed está em estágio inicial de desenvolvimento** (aproximadamente 15-20% completo), com apenas a funcionalidade básica de importação de dados implementada.

### Estatísticas Gerais

| Métrica              | NPD-Legacy (PHP) | API-Unimed (NestJS) | Gap    |
| -------------------- | ---------------- | ------------------- | ------ |
| **Endpoints**        | 20+              | 1                   | 95%    |
| **Métodos DAO**      | 25+              | 3                   | 88%    |
| **Linhas de Código** | ~2.000           | ~500                | 75%    |
| **Funcionalidades**  | 100%             | 15-20%              | 80-85% |
| **Relatórios**       | 6                | 0                   | 100%   |
| **Exportações**      | 2                | 0                   | 100%   |

---

## 📦 MÓDULO UNI NO NPD-LEGACY (PHP)

### **Estrutura e Complexidade**

```
npd-legacy/com/modules/uni/
├── controller/
│   └── UnimedController.php  (665 linhas, 20+ endpoints)
├── model/
│   ├── UnimedDAO.php         (1004 linhas, 25+ métodos)
│   └── Unimed.php            (330 linhas, Entity)
└── view/
    └── Unimed.php            (Interface HTML/PHP)

Total: ~2.000 linhas de código backend
```

### **Funcionalidades Completas Identificadas**

#### **1. IMPORTAÇÃO DE DADOS (4 métodos)**

##### ✅ SOAP Legacy

- **Método:** `InsertUnimed()`
- **Descrição:** WebService SOAP antigo com parsing XML
- **Endpoint Legacy:** `acao=saveUnimed2`
- **WSDL:** `http://200.167.191.244/wsbhzwebsempre/clientes/servicerelatoriosunimed.asmx?wsdl`
- **Tabela Destino:** `nbs.uni_rd_cobr`

##### ✅ API REST por CNPJ

- **Método:** `getDadosUniCnpj()`
- **Descrição:** Importa dados por CNPJ de empresas cadastradas
- **Endpoint Legacy:** `acao=saveUnimedCnpj`
- **API:** `https://ws.unimedcuiaba.coop.br/api/Demonstrativo/buscaporperiodocnpj`
- **Tabela Destino:** `gc.UNI_DADOS_COBRANCA`
- **Processo:**
  1. Busca empresas com `processa_unimed='S'`
  2. Para cada empresa, consulta API
  3. Limpa dados antigos do período
  4. Insere novos dados com tratamento de acentos

##### ✅ API REST por Contrato

- **Método:** `getDadosUniContrato()`
- **Descrição:** Importa por número de contrato específico
- **Endpoint Legacy:** `acao=saveUnimedContrato`
- **API:** `https://ws.unimedcuiaba.coop.br/api/Demonstrativo/BuscarPorPeriodoContrato`
- **Tabela Destino:** `gc.UNI_DADOS_COBRANCA`

##### ✅ Importação de Detalhes

- **Método:** `InsertUnimedDetalhes()`
- **Descrição:** Importa detalhes de coparticipação
- **Tabela Destino:** `nbs.uni_rd_cobr_detalhe`
- **Campos Adicionais:** PRESTADOR, DATA_HORA, QTDE, PREST_TRASITO

#### **2. PROCESSAMENTO E CÁLCULOS (7 métodos)**

##### ✅ Procedure de Resumo

- **Método:** `procedure_p_uni_insert_extrato()`
- **Endpoint Legacy:** `acao=save`
- **Procedure Oracle:** `gc.PKG_UNI_SAUDE.p_uni_resumo(mes_ref, ano_ref)`
- **Descrição:** Processa dados brutos e gera resumo por colaborador
- **Tabela Gerada:** `gc.uni_resumo_colaborador`

##### ✅ Processamento de Fechamento

- **Método:** `processarUnimed()`
- **Endpoint Legacy:** `acao=Execute`
- **Procedure Oracle:** `GC.PGK_GLOBAL.P_MCW_FECHA_COMISSAO_GLOBAL()`
- **Parâmetros:**
  - Código do processo
  - Mês/Ano de referência
  - Flag de prévia (S/N)
  - Flag de apagar dados antigos (S/N)
  - Usuário
  - Todas empresas ou empresa específica
  - Código empresa, bandeira
  - Tipo de dado, categoria
  - CPF (opcional para colaborador específico)
- **Validações:**
  - Verifica data limite de fechamento
  - Valida permissões especiais para processar fora do prazo
  - Log de erros detalhado

##### ✅ Listagem de Processos

- **Método:** `carregaProcessosProcessa()`
- **Endpoint Legacy:** `acao=Buscarprocesso`
- **Descrição:** Lista processos disponíveis para execução
- **Tabela:** `gc.mcw_processo`
- **Filtros:** categoria, tipo_dado, ativo='S'
- **Join com Log:** Mostra última data de execução

##### ✅ Histórico de Processos

- **Método:** `carregaProcessoshistUnimed()`
- **Endpoint Legacy:** `acao=H_unimed`
- **View:** `gc.vw_mcw_processo_log`
- **Retorna:** código, descrição, usuário, data_proc, tempo de execução

##### ✅ Histórico Específico

- **Endpoint Legacy:** `acao=HistoricoProcesso`
- **Descrição:** Histórico detalhado de um processo específico

##### ✅ Validação de Período

- **Método:** `carrregaPeriodoFechamento()`
- **Tabela:** `gc.mcw_periodo`
- **Retorna:** data_final para validação de prazos

##### ✅ Detalhes de Processo

- **Método:** `carregaProcessoInterno($a)`
- **Retorna:** dias limite, descrição do processo

#### **3. GERENCIAMENTO DE COLABORADORES (4 métodos)**

##### ✅ Atualização Individual

- **Método:** `updateColaborador($valor, $busca_usuario, $busca_mes, $busca_ano)`
- **Endpoint Legacy:** `acao=update`
- **Tabela:** `gc.uni_resumo_colaborador`
- **Campo Atualizado:** `exporta` (S/N)
- **Descrição:** Define se o colaborador terá desconto na folha

##### ✅ Atualização em Massa

- **Método:** `updateTodosColaborador()`
- **Endpoint Legacy:** `acao=updateTodosColaborador`
- **Tabela:** `gc.uni_resumo_colaborador`
- **Escopo:** Todos colaboradores de uma empresa/período
- **Filtros:** cod_empresa, codcoligada, codfilial, mes_ref, ano_ref

##### ✅ Atualização de Valor Empresa

- **Método:** `updateValorColaborador($codempresa, $coligada, $filial, $valor)`
- **Endpoint Legacy:** `acao=updateValor`
- **Tabela:** `nbs.mcw_colaborador`
- **Campo Atualizado:** `unimed` (percentual pago pela empresa)
- **Descrição:** Define quanto a empresa paga do plano

##### ✅ Consulta de Colaboradores

- **Endpoint Legacy:** `acao=Buscar`
- **View:** `gc.vw_uni_resumo_colaborador`
- **Filtros:**
  - empresa (cod_empresa, codcoligada)
  - CPF do colaborador
  - Mês/Ano de referência
  - Departamento
  - Função
- **Retorno:** DataTables JSON com dados formatados
- **Campos Exibidos:**
  - Apelido, Colaborador
  - Status Ativo (S/N)
  - Mês/Ano referência
  - Valor titular, dependentes
  - Valor consumo, percentual empresa
  - Valor total, valor líquido
  - Botão exporta (S/N)

#### **4. AUTENTICAÇÃO E TOKEN (4 métodos)**

##### ✅ Obtenção de Token

- **Método:** `getDadosToken()`
- **API:** `https://ws.unimedcuiaba.coop.br/api/Token/geratoken`
- **Método HTTP:** POST
- **Headers:**
  - `usuario: cometa`
  - `senha: C0m3t42019`
- **Retorno:** Token JWT
- **Validade:** Aproximadamente 6 horas

##### ✅ Verificação e Renovação

- **Método:** `VerificaHashToken()`
- **Descrição:** Verifica se token existe e está válido
- **Lógica:**
  1. Busca token armazenado no banco
  2. Se não existe ou expirou, gera novo
  3. Atualiza banco com novo token
  4. Define token no objeto Unimed

##### ✅ Carregamento de Token

- **Método:** `carrregaHash()`
- **Tabela:** `gc.api_gc_servicos`
- **Filtros:** `tipo='U'`, `ativo='S'`, `data_atualizacao = hoje`
- **Retorna:** Hash (token) válido para o dia

##### ✅ Atualização de Token

- **Método:** `updateHash($hash)`
- **Tabela:** `gc.api_gc_servicos`
- **Atualiza:** `hash` e `data_atualizacao`
- **Descrição:** Persiste novo token no banco

#### **5. CONSULTAS E BUSCAS (2 métodos)**

##### ✅ Listagem de Empresas

- **Método:** `getDadosCnpj()`
- **Tabela:** `gc.empresa_filial`
- **Filtros:** `processa_unimed='S'`
- **Retorna:** cod_empresa, codcoligada, codfilial, cod_band, cnpj
- **Ordem:** cod_band, cod_empresa

##### ✅ Listagem de Contratos

- **Método:** `getDadosContrato()`
- **Tabela:** `gc.uni_dados_contrato`
- **Filtros:** `ativo='S'`
- **Retorna:** cod_empresa, codcoligada, codfilial, cod_band, cnpj, contrato

#### **6. RELATÓRIOS JASPER (6 relatórios PDF)**

| Ação                        | Endpoint Legacy                    | Arquivo Jasper                         | Parâmetros                       |
| --------------------------- | ---------------------------------- | -------------------------------------- | -------------------------------- |
| **Relatório Colaborador**   | `acao=RelatorioColaborador`        | `RelatorioColaborador.jasper`          | empresa, cpf, contrato, mês, ano |
| **Relatório Empresa**       | `acao=RelatorioEmpresaColaborador` | `relatorioCobranca_por_empresa.jasper` | empresa, contrato, mês, ano      |
| **Relatório Pagamento**     | `acao=RelatorioPagamento`          | `relatorioPagamentos.jasper`           | empresa, contrato, mês, ano      |
| **Relatório Não Pagamento** | `acao=RelatorioNaoPagamento`       | `relatorioNaolancamento.jasper`        | empresa, contrato, mês, ano      |
| **Resumo Departamento**     | `acao=resumoDept`                  | `resumoCentro.jasper`                  | empresa, contrato, mês, ano      |
| **Resumo Centro Custo**     | `acao=resumoCentroCust`            | `relatorioCentroCusto.jasper`          | empresa, contrato, mês, ano      |

**Parâmetros Comuns:**

- `in_codEmpresa` - Código da empresa
- `in_codColigada` - Código da coligada
- `in_codFilial` - Código da filial
- `in_mesRef` - Mês de referência (MM)
- `in_anoRef` - Ano de referência (YYYY)
- `in_codBand` - Código da bandeira
- `in_cpf` - CPF do colaborador (opcional)
- `in_codContrato` - Código do contrato (opcional)

**Geração:**

- Classe: `Jasper::loadReport($dir, $arr, $file)`
- Header: `Content-Type: application/pdf`
- Diretório: `/jasper/uni/`

#### **7. EXPORTAÇÃO E INTEGRAÇÃO (2 métodos)**

##### ✅ Exportação Totvs

- **Endpoint Legacy:** `acao=ExUnimed`
- **Descrição:** Exporta dados para sistema de folha Totvs RM
- **Procedure:** `GC.PGK_GLOBAL.P_MCW_FECHA_COMISSAO_GLOBAL()`
- **Validações:**
  - Verifica mês permitido (apenas mês atual)
  - Valida data limite de exportação
  - Verifica permissões especiais (código acesso 78004 para apagar, 78005 para fora do prazo)
- **Modos:**
  - Exportação normal (apagar='N')
  - Exportação com exclusão de dados antigos (apagar='S')
  - Prévia (comissao_previa='S')
- **Escopo:**
  - Por empresa específica
  - Todas empresas
  - Por bandeira

##### ✅ Geração DIRF

- **Endpoint Legacy:** `acao=unimedDIRF`
- **Método DAO:** `unimedDIRFDAO()` (não mostrado no código analisado)
- **Descrição:** Gera dados para Declaração de Imposto de Renda
- **Parâmetros:** empresa, mês, ano

#### **8. UTILITÁRIOS (2 métodos)**

##### ✅ Remoção de Acentos

- **Método:** `_deletaAcentos($string)`
- **Descrição:** Remove acentuação para padronização no banco
- **Conversão:** Para uppercase após remoção
- **Uso:** Campos como contratante, beneficiário, lançamento, prestador

##### ✅ Limpeza de Dados

- **Método:** `delImport()`
- **Descrição:** Limpa dados antes de reimportar
- **Tabela:** `gc.uni_dados_cobranca`
- **Filtros:** cod_empresa, codcoligada, codfilial, mes_import, ano_import, cod_band

---

## 🏗️ MÓDULO UNIMED NO API-UNIMED (NestJS)

### **Estrutura Atual**

```
api-unimed/src/modules/
├── importacao/
│   ├── importacao.controller.ts
│   ├── importacao.module.ts
│   ├── services/
│   │   ├── unimed-import.service.ts       ✅ (implementado)
│   │   └── busca-empresas-unimed.service.ts ✅ (implementado)
│   ├── dtos/
│   │   ├── demonstrativo.dto.ts           ✅
│   │   └── import-unimed.dto.ts           ✅
│   └── utils/
│       └── remove-acentos.ts              ✅
│
└── unimed/
    ├── unimed.controller.ts               ⚠️ (quase vazio - 1 endpoint)
    ├── unimed.module.ts                   ✅
    ├── services/
    │   └── unimed-api.service.ts          ✅ (comunicação API)
    ├── entities/
    │   ├── uni-dados-cobranca.entity.ts   ✅ (interface)
    │   └── uni-resumo-colaborador.entity.ts ✅ (interface)
    └── dtos/
        ├── busca-colaborador.dto.ts       ✅ (criado, não usado)
        ├── update-colaborador.dto.ts      ✅ (criado, não usado)
        └── empresa-filial-list.dto.ts     ✅

Total: ~500 linhas de código
```

### **✅ FUNCIONALIDADES IMPLEMENTADAS**

#### **1. Importação Básica (40% implementado)**

##### **UnimedImportService** (`unimed-import.service.ts`)

**✅ Método: `importarPorCnpj(dto: ImportUnimedDto)`**

- **Equivalente Legacy:** `getDadosUniCnpj()`
- **Status:** ✅ Implementado e funcional
- **Processo:**
  1. ✅ Valida mês e ano
  2. ✅ Formata período (MMYYYY)
  3. ✅ Busca empresas via `buscaEmpresasUnimedService`
  4. ✅ Para cada empresa:
     - Chama API Unimed via `unimedApiService.buscarPorPeriodoCnpj()`
     - Limpa dados antigos via `limparDadosImportacao()`
     - Insere dados via `inserirDadosCobranca()`
     - Calcula mês/ano de referência
  5. ✅ Log de progresso e erros
- **Retorno:** Total de registros importados

**⚠️ Método: `importPorContrato(dto: ImportUnimedDto)`**

- **Equivalente Legacy:** `getDadosUniContrato()`
- **Status:** ⚠️ Apenas SQL definido, não implementado
- **TODO:** Implementar lógica similar ao importarPorCnpj

**✅ Método: `executarResumo(dto: ImportUnimedDto)`**

- **Equivalente Legacy:** `procedure_p_uni_insert_extrato()`
- **Status:** ✅ Implementado
- **Procedure:** `gc.PKG_UNI_SAUDE.p_uni_resumo(:mes_ref, :ano_ref)`
- **Tratamento de Erros:** ✅ Try/catch com log
- **Retorno:** `{ result: boolean, msg: string }`

**✅ Método Privado: `limparDadosImportacao()`**

- **SQL:** `DELETE FROM gc.uni_dados_cobranca WHERE ...`
- **Parâmetros:** codEmpresa, codColigada, codFilial, mes, ano

**✅ Método Privado: `inserirDadosCobranca()`**

- **SQL:** Batch insert com `executeMany()`
- **Tratamento:**
  - ✅ Processa mensalidades e composições
  - ✅ Remove acentos dos campos
  - ✅ Formata valores
  - ✅ Calcula mes_ref e ano_ref automaticamente
- **Retorno:** Quantidade de registros inseridos

**✅ Métodos de Cálculo:**

- `calcularMesRef()` - Subtrai 1 do mês
- `calcularAnoRef()` - Ajusta ano se necessário

##### **BuscaEmpresasUnimedService**

**✅ Método: `execute()`**

- **Equivalente Legacy:** `getDadosCnpj()`
- **SQL:** Busca empresas com `processa_unimed='S'`
- **Retorno:** Array de `EmpresaFilialListDto`

##### **UnimedApiService** (`unimed-api.service.ts`)

**⚠️ Atributo: `token`**

- **Status:** ⚠️ HARDCODED no código (má prática de segurança)
- **Valor:** Token JWT fixo
- **TODO:** Remover e implementar refresh dinâmico

**✅ Método: `getToken()`**

- **Equivalente Legacy:** `getDadosToken()`
- **API:** `POST /Token/geratoken`
- **Headers:** `usuario`, `senha`
- **Atualiza:** `this.token`
- **Log:** ✅ Sucesso e erro

**✅ Método: `buscarPorPeriodoCnpj(periodo, cnpj)`**

- **Equivalente Legacy:** `getWebserviceCNPJ()`
- **API:** `GET /Demonstrativo/buscaporperiodocnpj`
- **Params:** periodo, cnpj
- **Headers:** `Authorization: Bearer ${token}`
- **Retry:** ✅ Se 401, renova token e tenta novamente
- **Retorno:** `DemonstrativoDto`

**✅ Método: `buscaPorPeriodoContrato(periodo, contrato)`**

- **Equivalente Legacy:** `getWebserviceContrato()`
- **API:** `GET /Demonstrativo/BuscarPorPeriodoContrato`
- **Retry:** ✅ Se 401, renova token
- **Retorno:** `DemonstrativoDto`

#### **2. Controller (5% implementado)**

**UnimedController** (`unimed.controller.ts`)

**✅ Endpoint: `GET /busca-empresas-unimed`**

- **Único endpoint ativo**
- **Retorna:** Lista de empresas
- **TODO:** Mover para módulo correto (está usando serviço de importação)

#### **3. Entities e DTOs (100% - estrutura)**

**✅ Interface: `UniDadosCobranca`**

- **Arquivo:** `uni-dados-cobranca.entity.ts`
- **Campos:** 31 campos mapeados corretamente
- **Tipos:** number, string, Date

**✅ Interface: `UniResumoColaborador`**

- **Arquivo:** `uni-resumo-colaborador.entity.ts`
- **Campos:** 16 campos
- **Status:** Estrutura completa

**✅ DTOs Criados:**

- `BuscaColaboradorDto` - Filtros de busca (não usado ainda)
- `UpdateColaboradorDto` - Atualização de exporta (não usado)
- `EmpresaFilialListDto` - Lista empresas (✅ em uso)
- `DemonstrativoDto` - Resposta API Unimed (✅ em uso)
- `ImportUnimedDto` - Payload importação (✅ em uso)

#### **4. Utilitários**

**✅ Função: `removerAcentos(texto)`**

- **Arquivo:** `remove-acentos.ts`
- **Equivalente Legacy:** `_deletaAcentos()`
- **Implementação:** Similar ao PHP

---

## ⚠️ FUNCIONALIDADES FALTANTES (85%)

### **❌ 1. Gerenciamento de Colaboradores (0% implementado)**

#### **Endpoints Necessários:**

**❌ `GET /api/v1/unimed/colaboradores`**

- **Equivalente Legacy:** `acao=Buscar`
- **Funcionalidade:** Listar colaboradores com filtros
- **Filtros:** empresa, cpf, mês, ano, departamento, função
- **Retorno:** Paginado com DataTables format
- **View Oracle:** `gc.vw_uni_resumo_colaborador`

**❌ `PATCH /api/v1/unimed/colaboradores/:cpf`**

- **Equivalente Legacy:** `acao=update`
- **Funcionalidade:** Atualizar flag exportação individual
- **Body:** `{ busca_mes, busca_ano, checkbox: 'S'|'N' }`
- **Tabela:** `gc.uni_resumo_colaborador`
- **Campo:** `exporta`

**❌ `PATCH /api/v1/unimed/colaboradores/empresa/:sigla`**

- **Equivalente Legacy:** `acao=updateTodosColaborador`
- **Funcionalidade:** Atualizar todos colaboradores de uma empresa
- **Body:** `{ mes, ano, valor: 'S'|'N' }`
- **Escopo:** Por empresa/filial/período

**❌ `PATCH /api/v1/unimed/valores/empresa/:sigla`**

- **Equivalente Legacy:** `acao=updateValor`
- **Funcionalidade:** Atualizar percentual pago pela empresa
- **Body:** `{ valor: number }`
- **Tabela:** `nbs.mcw_colaborador`
- **Campo:** `unimed`

#### **Services Necessários:**

- `ColaboradorService` com métodos de busca e atualização
- `EmpresaService` para atualização de valores

### **❌ 2. Processamento e Fechamentos (0% implementado)**

#### **Endpoints Necessários:**

**❌ `GET /api/v1/unimed/processos`**

- **Equivalente Legacy:** `acao=Buscarprocesso`
- **Funcionalidade:** Listar processos disponíveis
- **Query:** categoria, tipo, mes, ano
- **Tabela:** `gc.mcw_processo`
- **Join:** `mcw_processo_log` para última execução

**❌ `POST /api/v1/unimed/processos/executar`**

- **Equivalente Legacy:** `acao=Execute`
- **Funcionalidade:** Executar processos de fechamento
- **Body:**
  ```typescript
  {
    proc_mes: number,
    proc_ano: number,
    tipo: string,
    categoria: string,
    checkAPAGA: 'S'|'N',
    checkPrevia: 'S'|'N',
    processo: string[],
    proc_band?: string,
    proc_emp?: string,
    proc_colab?: string
  }
  ```
- **Procedure:** `GC.PGK_GLOBAL.P_MCW_FECHA_COMISSAO_GLOBAL()`
- **Validações:**
  - Data limite de fechamento
  - Permissões especiais
  - Empresa obrigatória se CPF informado

**❌ `GET /api/v1/unimed/processos/historico`**

- **Equivalente Legacy:** `acao=H_unimed`
- **Funcionalidade:** Histórico de processamentos
- **Query:** mes, ano, param (categoria), codigo
- **View:** `gc.vw_mcw_processo_log`

**❌ `GET /api/v1/unimed/processos/:codigo/historico`**

- **Equivalente Legacy:** `acao=HistoricoProcesso`
- **Funcionalidade:** Histórico específico de um processo
- **Params:** codigo do processo
- **Query:** mes_ref, ano_ref, cat_ref

#### **Services Necessários:**

- `ProcessoService` - Gerenciamento de processos
- `FechamentoService` - Lógica de fechamento
- `PeriodoService` - Validação de datas

### **❌ 3. Relatórios (0% implementado)**

#### **Tecnologia a Definir:**

- **Opção 1:** JasperReports (mantém compatibilidade)
  - Requer: `jasper-reports-node` ou similar
  - Prós: Reutiliza relatórios existentes
  - Contras: Complexidade de setup
- **Opção 2:** Biblioteca Node.js alternativa
  - `pdfmake`, `puppeteer`, `@ag-grid/enterprise`
  - Prós: Mais moderno, TypeScript nativo
  - Contras: Precisa recriar layouts

#### **Endpoints Necessários:**

**❌ `GET /api/v1/relatorios/unimed/colaborador`**

- **Query:** empresa, cpf, contrato, busca_mes, ano_ref
- **Formato:** PDF
- **Conteúdo:** Detalhamento por colaborador

**❌ `GET /api/v1/relatorios/unimed/empresa`**

- **Query:** empresa, contrato, busca_mes, ano_ref
- **Formato:** PDF
- **Conteúdo:** Resumo por empresa

**❌ `GET /api/v1/relatorios/unimed/pagamento`**

- **Query:** empresa, contrato, busca_mes, ano_ref
- **Formato:** PDF
- **Conteúdo:** Lançamentos confirmados

**❌ `GET /api/v1/relatorios/unimed/nao-pagamento`**

- **Query:** empresa, contrato, busca_mes, ano_ref
- **Formato:** PDF
- **Conteúdo:** Não lançados na folha

**❌ `GET /api/v1/relatorios/unimed/departamento`**

- **Query:** empresa, contrato, busca_mes, ano_ref
- **Formato:** PDF
- **Conteúdo:** Resumo por departamento

**❌ `GET /api/v1/relatorios/unimed/centro-custo`**

- **Query:** empresa, contrato, busca_mes, ano_ref
- **Formato:** PDF
- **Conteúdo:** Resumo por centro de custo

#### **Services Necessários:**

- `RelatorioService` - Geração de PDFs
- `JasperService` - Se optar por manter Jasper

### **❌ 4. Exportação (0% implementado)**

#### **Endpoints Necessários:**

**❌ `POST /api/v1/unimed/exportacao/totvs`**

- **Equivalente Legacy:** `acao=ExUnimed`
- **Funcionalidade:** Exportar para Totvs RM
- **Body:**
  ```typescript
  {
    busca_mes_t: number,
    busca_ano_t: number,
    busca_empresa_t: string,
    zerar_dados?: 'S'|'N',
    comissao_previa?: 'S'|'N',
    processo: string,
    tipo_comissao: string
  }
  ```
- **Validações:**
  - Apenas mês atual
  - Permissões especiais (ACL)
  - Data limite de exportação
- **Procedure:** `GC.PGK_GLOBAL.P_MCW_FECHA_COMISSAO_GLOBAL()`

**❌ `POST /api/v1/unimed/dirf`**

- **Equivalente Legacy:** `acao=unimedDIRF`
- **Funcionalidade:** Gerar dados para DIRF
- **Body:**
  ```typescript
  {
    empresa: string,
    mes: number,
    ano: number
  }
  ```
- **Método DAO:** Não identificado no código analisado

#### **Services Necessários:**

- `ExportacaoService` - Lógica de exportação
- `TotvsIntegrationService` - Integração específica Totvs
- `DirfService` - Geração DIRF

### **❌ 5. Segurança e Logs (0% implementado)**

#### **Sistema de Logs:**

- **Tabela:** `gc.mcw_log` (presumido)
- **Campos:** usuario, descricao, modulo, tipo_acao, data
- **Ações a Logar:**
  - Importações
  - Atualizações de colaboradores
  - Execução de processos
  - Exportações
  - Alterações de valores

#### **Controle de Acesso (ACL):**

- **Códigos Identificados:**
  - `78003` - Atualizar flag exportação colaborador
  - `78004` - Apagar dados antigos na exportação
  - `78005` - Processar fora do prazo permitido
  - `78000` - Outros acessos (presumidos)

#### **Implementação Necessária:**

- `AuthGuard` com verificação de permissões
- `LogService` para auditoria
- `AclService` para controle de acesso
- Decorator `@RequirePermission(code)`

### **❌ 6. Importação de Detalhes (0% implementado)**

**❌ Método: `importarDetalhes()`**

- **Equivalente Legacy:** `InsertUnimedDetalhes()`
- **API Unimed:** `RelatorioDetalhadoCoParticipacao`
- **Tabela:** `nbs.uni_rd_cobr_detalhe`
- **Campos Adicionais:**
  - PRESTADOR
  - PRESTADOR_TRASITO
  - DATA_HORA
  - HORA
  - QTDE

### **❌ 7. Melhorias de Token (Prioridade Alta)**

**⚠️ Problema Atual:**

- Token hardcoded no código fonte
- Sem verificação de expiração
- Sem armazenamento no banco

**✅ Implementação Necessária:**

- Remover token hardcoded
- Implementar armazenamento em `gc.api_gc_servicos`
- Verificar validade por `data_atualizacao`
- Renovação automática quando expirado
- Cache em memória para performance

```typescript
// Exemplo de implementação necessária
async getValidToken(): Promise<string> {
  // 1. Buscar do cache
  // 2. Se não existe ou expirou, buscar do banco
  // 3. Se banco também expirou, gerar novo
  // 4. Salvar no banco e cache
  // 5. Retornar token válido
}
```

---

## 📊 BANCO DE DADOS

### **Tabelas Principais Utilizadas:**

| Tabela                     | Schema | Uso                        | Status API-Unimed           |
| -------------------------- | ------ | -------------------------- | --------------------------- |
| **UNI_DADOS_COBRANCA**     | gc     | Dados importados da Unimed | ✅ Usado (INSERT/DELETE)    |
| **uni_dados_contrato**     | gc     | Contratos ativos           | ✅ Consultado (SELECT)      |
| **uni_resumo_colaborador** | gc     | Resumo após procedure      | ⚠️ Entity criado, não usado |
| **uni_rd_cobr**            | nbs    | Dados SOAP legado          | ❌ Não usado                |
| **uni_rd_cobr_detalhe**    | nbs    | Detalhes coparticipação    | ❌ Não usado                |
| **mcw_colaborador**        | nbs    | Dados gerais colaboradores | ❌ Não usado                |
| **mcw_processo**           | gc     | Processos de fechamento    | ❌ Não usado                |
| **mcw_processo_log**       | gc     | Log de processos           | ❌ Não usado                |
| **mcw_periodo**            | gc     | Períodos de fechamento     | ❌ Não usado                |
| **empresa_filial**         | gc     | Empresas e filiais         | ✅ Usado (SELECT)           |
| **api_gc_servicos**        | gc     | Armazenamento de tokens    | ❌ Não usado                |

### **Views Oracle:**

| View                          | Uso                                 | Status       |
| ----------------------------- | ----------------------------------- | ------------ |
| **vw_uni_resumo_colaborador** | Consulta principal de colaboradores | ❌ Não usado |
| **vw_mcw_processo_log**       | Histórico de processos              | ❌ Não usado |

### **Stored Procedures Oracle:**

| Procedure                                       | Descrição                          | Status         |
| ----------------------------------------------- | ---------------------------------- | -------------- |
| **gc.PKG_UNI_SAUDE.p_uni_resumo()**             | Gera resumo por colaborador        | ✅ Chamada     |
| **GC.PGK_GLOBAL.P_MCW_FECHA_COMISSAO_GLOBAL()** | Processamento global de fechamento | ❌ Não chamada |

### **Estrutura de Tabelas:**

#### **gc.UNI_DADOS_COBRANCA** (Principal)

```sql
CREATE TABLE gc.UNI_DADOS_COBRANCA (
    -- Identificação Empresa
    cod_empresa         NUMBER,
    codcoligada         NUMBER,
    codfilial           NUMBER,
    cod_band            NUMBER,

    -- Dados Contrato
    contrato            VARCHAR2(50),
    cnpj                VARCHAR2(20),
    contratante         VARCHAR2(200),
    nomeplano           VARCHAR2(200),
    abrangencia         VARCHAR2(50),

    -- Dados Fatura
    codfatura           VARCHAR2(50),
    valorFatura         NUMBER(10,2),
    periodo             VARCHAR2(10),

    -- Dados Titular
    codtitular          VARCHAR2(50),
    titular             VARCHAR2(200),
    cpftitular          VARCHAR2(14),

    -- Dados Beneficiário
    matricula           VARCHAR2(50),
    acomodacao          VARCHAR2(100),
    codbeneficiario     VARCHAR2(50),
    beneficiario        VARCHAR2(200),
    idade               NUMBER,
    nascimento          VARCHAR2(10),
    inclusao            VARCHAR2(10),
    dependencia         VARCHAR2(50),
    cpf                 VARCHAR2(14),

    -- Valores
    valor               NUMBER(10,2),
    descricao           VARCHAR2(500),

    -- Controle Importação
    mes_import          VARCHAR2(2),
    ano_import          VARCHAR2(4),
    mes_ref             VARCHAR2(2),
    ano_ref             VARCHAR2(4),
    data_import         DATE
);
```

#### **gc.uni_resumo_colaborador** (Gerada por Procedure)

```sql
CREATE TABLE gc.uni_resumo_colaborador (
    cod_empresa         NUMBER,
    codcoligada         NUMBER,
    codfilial           NUMBER,
    cod_band            NUMBER,
    codigo_cpf          VARCHAR2(14),
    colaborador         VARCHAR2(200),
    apelido             VARCHAR2(100),
    mes_ref             VARCHAR2(2),
    ano_ref             VARCHAR2(4),
    m_titular           NUMBER(10,2),
    m_dependente        NUMBER(10,2),
    valor_consumo       NUMBER(10,2),
    perc_empresa        NUMBER(10,2),
    valor_total         NUMBER(10,2),
    valor_liquido       NUMBER(10,2),
    exporta             CHAR(1) DEFAULT 'S',  -- S/N
    ativo               CHAR(1) DEFAULT 'S'   -- S/N
);
```

---

## 🎯 SITUAÇÃO ATUAL DO PROJETO API-UNIMED

### **Percentual de Conclusão: ~15-20%**

#### **✅ O QUE ESTÁ FUNCIONANDO:**

1. ✅ **Estrutura NestJS** bem organizada e modular
2. ✅ **Conexão Oracle** configurada via DatabaseService
3. ✅ **Importação por CNPJ** funcional e testada
4. ✅ **Integração API Unimed** com retry em caso de 401
5. ✅ **DTOs e Entities** bem definidos e tipados
6. ✅ **Execução de Procedure** de resumo funcionando
7. ✅ **Logger** do NestJS configurado
8. ✅ **Remoção de acentos** implementada
9. ✅ **Busca de empresas** ativas para importação

#### **⚠️ PROBLEMAS IDENTIFICADOS:**

1. ⚠️ **Token hardcoded** no código fonte (falha de segurança grave)
2. ⚠️ **Falta armazenamento** de token no banco
3. ⚠️ **Sem sistema de logs** de auditoria
4. ⚠️ **Sem controle de permissões** (ACL)
5. ⚠️ **Importação por contrato** não implementada (apenas SQL definido)
6. ⚠️ **Sem tratamento** de detalhes de coparticipação
7. ⚠️ **Controller praticamente vazio** (1 endpoint apenas)
8. ⚠️ **Falta validação** de datas de fechamento
9. ⚠️ **Sem tratamento** de valores formatados (R$)

#### **❌ PRINCIPAIS LACUNAS:**

1. ❌ **85% dos endpoints** não existem (19 de 20 faltando)
2. ❌ **0% de relatórios** implementados (6 relatórios faltando)
3. ❌ **0% de exportação** (Totvs/DIRF não implementados)
4. ❌ **CRUD de colaboradores** totalmente inexistente
5. ❌ **Sistema de processos** não implementado (7 métodos faltando)
6. ❌ **Validações de negócio** mínimas ou inexistentes
7. ❌ **Histórico de processos** não implementado
8. ❌ **Importação de detalhes** não implementada
9. ❌ **Gestão de token** inadequada
10. ❌ **Testes unitários** não identificados

---

## 📋 DOCUMENTAÇÃO EXISTENTE

O projeto possui **documentação extensa** em Markdown:

| Arquivo                             | Linhas | Status      | Conteúdo                        |
| ----------------------------------- | ------ | ----------- | ------------------------------- |
| `GUIA_IMPLEMENTACAO_COMPLETO.md`    | 1.472  | ✅ Completo | Guia detalhado de implementação |
| `MAPEAMENTO_ENDPOINTS.md`           | 205    | ✅ Completo | Mapeamento Legacy → NestJS      |
| `DICIONARIO_DADOS.md`               | ?      | ✅ Existe   | Dicionário de dados             |
| `CHECKLIST_IMPLEMENTACAO.md`        | ?      | ✅ Existe   | Checklist de tarefas            |
| `GUIA_CONTINUACAO_IMPLEMENTACAO.md` | ?      | ✅ Existe   | Próximos passos                 |
| `EXEMPLO_PRATICO.md`                | ?      | ✅ Existe   | Exemplos práticos               |
| `DICAS_BOAS_PRATICAS.md`            | ?      | ✅ Existe   | Boas práticas                   |
| `INDICE_DOCUMENTACAO.md`            | ?      | ✅ Existe   | Índice geral                    |
| `PACOTE_COMPLETO.md`                | ?      | ✅ Existe   | Pacote completo                 |

**Conclusão:** A documentação está completa e bem detalhada, mas a **implementação está muito aquém do planejado** (~15% vs 100% documentado).

---

## 🚀 ROADMAP DE IMPLEMENTAÇÃO

### **FASE 1 - FUNDAÇÃO (Prioridade CRÍTICA)**

#### **Sprint 1.1 - Segurança e Token (1 semana)**

- [ ] Remover token hardcoded
- [ ] Implementar `TokenService`
- [ ] Armazenar token em `gc.api_gc_servicos`
- [ ] Cache de token em memória
- [ ] Renovação automática

#### **Sprint 1.2 - Logs e Auditoria (1 semana)**

- [ ] Criar `LogService`
- [ ] Integrar com tabela de logs Oracle
- [ ] Implementar interceptor de logs
- [ ] Log de todas importações e atualizações

#### **Sprint 1.3 - Controle de Acesso (1 semana)**

- [ ] Criar `AclService`
- [ ] Implementar `@RequirePermission` decorator
- [ ] Integrar com sistema de permissões existente
- [ ] Códigos de acesso: 78003, 78004, 78005

### **FASE 2 - COLABORADORES (Prioridade ALTA)**

#### **Sprint 2.1 - Consultas (1 semana)**

- [ ] Criar `ColaboradorService`
- [ ] Implementar `GET /colaboradores` com filtros
- [ ] Integrar com `vw_uni_resumo_colaborador`
- [ ] Paginação e ordenação
- [ ] Formatação de valores (R$)

#### **Sprint 2.2 - Atualizações (1 semana)**

- [ ] Implementar `PATCH /colaboradores/:cpf`
- [ ] Implementar `PATCH /colaboradores/empresa/:sigla`
- [ ] Implementar `PATCH /valores/empresa/:sigla`
- [ ] Validações de negócio
- [ ] Logs de auditoria

### **FASE 3 - PROCESSOS E FECHAMENTOS (Prioridade ALTA)**

#### **Sprint 3.1 - Listagem de Processos (1 semana)**

- [ ] Criar `ProcessoService`
- [ ] Implementar `GET /processos`
- [ ] Integrar com `gc.mcw_processo`
- [ ] Join com logs de execução
- [ ] Filtros por categoria e tipo

#### **Sprint 3.2 - Execução de Processos (2 semanas)**

- [ ] Criar `FechamentoService`
- [ ] Implementar `POST /processos/executar`
- [ ] Chamar procedure `P_MCW_FECHA_COMISSAO_GLOBAL`
- [ ] Validação de datas limite
- [ ] Verificação de permissões
- [ ] Log detalhado de execução
- [ ] Tratamento de erros robusto

#### **Sprint 3.3 - Histórico (1 semana)**

- [ ] Implementar `GET /processos/historico`
- [ ] Implementar `GET /processos/:codigo/historico`
- [ ] Integrar com `vw_mcw_processo_log`
- [ ] Exibição de tempo de execução

### **FASE 4 - IMPORTAÇÕES COMPLEMENTARES (Prioridade MÉDIA)**

#### **Sprint 4.1 - Importação por Contrato (1 semana)**

- [ ] Completar `importPorContrato()` no service
- [ ] Criar endpoint `POST /import/contrato`
- [ ] Testes de integração

#### **Sprint 4.2 - Importação de Detalhes (1 semana)**

- [ ] Criar método `importarDetalhes()`
- [ ] Integrar com API `RelatorioDetalhadoCoParticipacao`
- [ ] Inserir em `nbs.uni_rd_cobr_detalhe`
- [ ] Endpoint `POST /import/detalhes`

### **FASE 5 - RELATÓRIOS (Prioridade MÉDIA-BAIXA)**

#### **Sprint 5.1 - Decisão Tecnológica (1 semana)**

- [ ] Avaliar JasperReports vs alternativas
- [ ] POC com tecnologia escolhida
- [ ] Definir arquitetura de relatórios

#### **Sprint 5.2 - Implementação de Relatórios (4 semanas)**

- [ ] Relatório por Colaborador
- [ ] Relatório por Empresa
- [ ] Relatório de Pagamento
- [ ] Relatório de Não Pagamento
- [ ] Resumo por Departamento
- [ ] Resumo por Centro de Custo

### **FASE 6 - EXPORTAÇÕES (Prioridade BAIXA)**

#### **Sprint 6.1 - Exportação Totvs (2 semanas)**

- [ ] Criar `TotvsIntegrationService`
- [ ] Implementar `POST /exportacao/totvs`
- [ ] Validações de mês atual
- [ ] Permissões especiais
- [ ] Log de exportação

#### **Sprint 6.2 - Exportação DIRF (1 semana)**

- [ ] Investigar método DIRF no legado
- [ ] Criar `DirfService`
- [ ] Implementar `POST /dirf`

### **FASE 7 - QUALIDADE (Contínuo)**

#### **Sprint 7.1 - Testes (2 semanas)**

- [ ] Testes unitários de services
- [ ] Testes de integração de endpoints
- [ ] Testes E2E de fluxos principais
- [ ] Coverage mínimo de 70%

#### **Sprint 7.2 - Refatoração (1 semana)**

- [ ] Code review geral
- [ ] Refatoração de código duplicado
- [ ] Otimização de queries
- [ ] Documentação inline (JSDoc)

---

## 📊 ESTIMATIVA DE TEMPO TOTAL

### **Resumo por Fase:**

| Fase                       | Duração   | Prioridade  | Dependências |
| -------------------------- | --------- | ----------- | ------------ |
| **Fase 1 - Fundação**      | 3 semanas | CRÍTICA     | Nenhuma      |
| **Fase 2 - Colaboradores** | 2 semanas | ALTA        | Fase 1       |
| **Fase 3 - Processos**     | 4 semanas | ALTA        | Fase 1, 2    |
| **Fase 4 - Importações**   | 2 semanas | MÉDIA       | Fase 1       |
| **Fase 5 - Relatórios**    | 5 semanas | MÉDIA-BAIXA | Fase 2       |
| **Fase 6 - Exportações**   | 3 semanas | BAIXA       | Fase 3       |
| **Fase 7 - Qualidade**     | 3 semanas | Contínuo    | Todas        |

### **TOTAL ESTIMADO: 22 semanas (~5.5 meses)**

**Observações:**

- Considerando 1 desenvolvedor full-time
- Com 2 desenvolvedores: ~3 meses
- Fase 7 (Qualidade) é paralela

---

## 🎯 MÉTRICAS DE SUCESSO

### **Critérios de Aceitação:**

#### **MVP (Mínimo Viável):**

- ✅ Importação por CNPJ funcional (já tem)
- ⚠️ Token seguro sem hardcode
- ⚠️ Consulta de colaboradores
- ⚠️ Atualização de flags
- ⚠️ Execução de processos básicos
- ⚠️ Logs de auditoria

#### **Produção (Paridade com Legacy):**

- ✅ Todos 20 endpoints funcionais
- ✅ 6 relatórios gerando PDFs
- ✅ Exportação Totvs e DIRF
- ✅ Sistema de permissões completo
- ✅ Testes automatizados
- ✅ Documentação atualizada

### **KPIs Técnicos:**

- **Coverage de Testes:** ≥ 70%
- **Tempo de Resposta API:** < 2s (95th percentile)
- **Queries Oracle:** Otimizadas (< 1s)
- **Disponibilidade:** ≥ 99.5%
- **Logs:** 100% das operações críticas

---

## 📝 NOTAS FINAIS

### **Pontos Positivos:**

1. ✅ Arquitetura NestJS bem estruturada
2. ✅ Integração Oracle funcionando
3. ✅ DTOs e Entities bem tipados
4. ✅ Documentação extensa e detalhada
5. ✅ Importação básica funcionando corretamente

### **Pontos de Atenção:**

1. ⚠️ **Token hardcoded é GRAVE** - resolver urgentemente
2. ⚠️ Falta de logs pode dificultar troubleshooting
3. ⚠️ Sem controle de acesso pode causar problemas de segurança
4. ⚠️ 85% do sistema ainda por implementar
5. ⚠️ Falta de testes pode gerar bugs em produção

### **Recomendações Estratégicas:**

#### **Curto Prazo (1 mês):**

1. **URGENTE:** Corrigir issue de token hardcoded
2. Implementar logs de auditoria
3. Implementar consulta e atualização de colaboradores
4. Adicionar controle de permissões básico

#### **Médio Prazo (3 meses):**

5. Implementar sistema completo de processos
6. Adicionar importação por contrato
7. Implementar históricos
8. Começar relatórios

#### **Longo Prazo (6 meses):**

9. Completar todos relatórios
10. Implementar exportações
11. Testes completos
12. Go-live em produção

---

## 📞 PRÓXIMOS PASSOS IMEDIATOS

### **Ações Recomendadas (Esta Semana):**

1. **Revisar e priorizar** este documento com a equipe
2. **Definir roadmap** oficial do projeto
3. **Alocar recursos** (desenvolvedores, tempo)
4. **Criar issues/tasks** no sistema de gestão
5. **Iniciar Sprint 1.1** (Token seguro)
6. **Configurar ambiente** de testes integrados
7. **Definir CI/CD** pipeline

### **Decisões Necessárias:**

- [ ] Priorizar MVP ou paridade completa?
- [ ] Prazo para go-live em produção?
- [ ] Tecnologia para relatórios (Jasper ou alternativa)?
- [ ] Estratégia de migração (big bang ou gradual)?
- [ ] Manter ambos sistemas rodando em paralelo?

---

**Documento gerado em:** 12/01/2026  
**Última atualização:** 12/01/2026  
**Versão:** 1.0  
**Autor:** GitHub Copilot (Análise Automatizada)
