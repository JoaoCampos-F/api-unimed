# DICIONÁRIO DE DADOS - SISTEMA UNIMED

## Tabelas do Sistema

### 1. `gc.UNI_DADOS_COBRANCA`

**Descrição:** Armazena os dados brutos importados da API Unimed Cuiabá

| Coluna          | Tipo          | Nulo | Descrição                                          |
| --------------- | ------------- | ---- | -------------------------------------------------- |
| cod_empresa     | NUMBER        | NÃO  | Código da empresa no sistema                       |
| codcoligada     | NUMBER        | NÃO  | Código da coligada (Totvs)                         |
| codfilial       | NUMBER        | NÃO  | Código da filial                                   |
| cod_band        | NUMBER        | NÃO  | Código da bandeira (grupo empresarial)             |
| contrato        | VARCHAR2(50)  | SIM  | Número do contrato Unimed                          |
| cnpj            | VARCHAR2(20)  | SIM  | CNPJ da empresa contratante                        |
| contratante     | VARCHAR2(200) | SIM  | Razão social do contratante                        |
| nomeplano       | VARCHAR2(200) | SIM  | Nome do plano de saúde                             |
| abrangencia     | VARCHAR2(50)  | SIM  | Abrangência do plano (Nacional, Regional, etc)     |
| codfatura       | VARCHAR2(50)  | SIM  | Código da fatura                                   |
| valorFatura     | NUMBER(10,2)  | SIM  | Valor total da fatura                              |
| periodo         | VARCHAR2(10)  | SIM  | Período de competência (MM-YYYY)                   |
| codtitular      | VARCHAR2(50)  | SIM  | Código do titular do plano                         |
| titular         | VARCHAR2(200) | SIM  | Nome do titular                                    |
| cpftitular      | VARCHAR2(14)  | SIM  | CPF do titular                                     |
| matricula       | VARCHAR2(50)  | SIM  | Matrícula Unimed                                   |
| acomodacao      | VARCHAR2(100) | SIM  | Tipo de acomodação                                 |
| codbeneficiario | VARCHAR2(50)  | SIM  | Código do beneficiário                             |
| beneficiario    | VARCHAR2(200) | SIM  | Nome do beneficiário                               |
| idade           | NUMBER        | SIM  | Idade do beneficiário                              |
| nascimento      | VARCHAR2(10)  | SIM  | Data de nascimento (DD/MM/YYYY)                    |
| inclusao        | VARCHAR2(10)  | SIM  | Data de inclusão no plano                          |
| dependencia     | VARCHAR2(50)  | SIM  | Grau de dependência (Titular, Cônjuge, Filho, etc) |
| cpf             | VARCHAR2(14)  | SIM  | CPF do beneficiário                                |
| valor           | NUMBER(10,2)  | SIM  | Valor cobrado do beneficiário                      |
| descricao       | VARCHAR2(500) | SIM  | Descrição do lançamento                            |
| mes_import      | VARCHAR2(2)   | SIM  | Mês da importação                                  |
| ano_import      | VARCHAR2(4)   | SIM  | Ano da importação                                  |
| mes_ref         | VARCHAR2(2)   | SIM  | Mês de referência (competência)                    |
| ano_ref         | VARCHAR2(4)   | SIM  | Ano de referência (competência)                    |
| data_import     | DATE          | SIM  | Data/hora da importação                            |

**Índices:**

- PK: cod_empresa, codcoligada, codfilial, cpf, mes_ref, ano_ref
- IX1: mes_import, ano_import
- IX2: cpftitular

---

### 2. `gc.uni_resumo_colaborador`

**Descrição:** View materializada com resumo consolidado por colaborador (gerada pela procedure)

| Coluna        | Tipo          | Nulo | Descrição                                 |
| ------------- | ------------- | ---- | ----------------------------------------- |
| cod_empresa   | NUMBER        | NÃO  | Código da empresa                         |
| codcoligada   | NUMBER        | NÃO  | Código da coligada                        |
| codfilial     | NUMBER        | NÃO  | Código da filial                          |
| cod_band      | NUMBER        | NÃO  | Código da bandeira                        |
| codigo_cpf    | VARCHAR2(14)  | NÃO  | CPF do colaborador                        |
| colaborador   | VARCHAR2(200) | SIM  | Nome do colaborador                       |
| apelido       | VARCHAR2(50)  | SIM  | Apelido/Sigla da empresa                  |
| mes_ref       | VARCHAR2(2)   | NÃO  | Mês de referência                         |
| ano_ref       | VARCHAR2(4)   | NÃO  | Ano de referência                         |
| m_titular     | NUMBER(10,2)  | SIM  | Valor titular                             |
| m_dependente  | NUMBER(10,2)  | SIM  | Valor dependentes                         |
| valor_consumo | NUMBER(10,2)  | SIM  | Valor total consumido                     |
| perc_empresa  | NUMBER(10,2)  | SIM  | Valor pago pela empresa                   |
| valor_total   | NUMBER(10,2)  | SIM  | Valor total                               |
| valor_liquido | NUMBER(10,2)  | SIM  | Valor líquido (descontado do colaborador) |
| exporta       | CHAR(1)       | SIM  | Flag exportação (S/N)                     |
| ativo         | CHAR(1)       | SIM  | Colaborador ativo (S/N)                   |

**Índices:**

- PK: codigo_cpf, mes_ref, ano_ref, cod_empresa
- IX1: exporta
- IX2: ativo

---

### 3. `nbs.UNI_DADOS_COBRANCA` (Tabela Antiga - SOAP)

**Descrição:** Tabela legada do WebService SOAP (manter compatibilidade)

| Coluna           | Tipo          | Descrição            |
| ---------------- | ------------- | -------------------- |
| contrato         | VARCHAR2(50)  | Número do contrato   |
| cnpj             | VARCHAR2(20)  | CNPJ                 |
| contratante      | VARCHAR2(200) | Nome contratante     |
| planomod         | VARCHAR2(50)  | Código do plano      |
| modalidade       | VARCHAR2(100) | Modalidade do plano  |
| abrangencia      | VARCHAR2(50)  | Abrangência          |
| fatura           | VARCHAR2(50)  | Código fatura        |
| venda            | VARCHAR2(50)  | Código venda         |
| valor_total      | NUMBER(10,2)  | Valor total          |
| titular          | VARCHAR2(50)  | Código titular       |
| matricula        | VARCHAR2(50)  | Matrícula            |
| plano            | VARCHAR2(50)  | Código plano         |
| codigo           | VARCHAR2(50)  | Código beneficiário  |
| beneficiario     | VARCHAR2(200) | Nome beneficiário    |
| idade            | NUMBER        | Idade                |
| nascimento       | VARCHAR2(10)  | Data nascimento      |
| inclusao         | VARCHAR2(10)  | Data inclusão        |
| situacao         | VARCHAR2(50)  | Situação cadastral   |
| dependencia      | VARCHAR2(50)  | Grau dependência     |
| lancamento       | VARCHAR2(200) | Descrição lançamento |
| debito           | NUMBER(10,2)  | Valor débito         |
| credito          | NUMBER(10,2)  | Valor crédito        |
| valor            | NUMBER(10,2)  | Valor                |
| ben_lotacao      | VARCHAR2(100) | Lotação beneficiário |
| periodo          | VARCHAR2(4)   | Ano período          |
| codlanc          | VARCHAR2(50)  | Código lançamento    |
| codtitular       | VARCHAR2(50)  | Código titular       |
| cpf              | VARCHAR2(14)  | CPF beneficiário     |
| mes              | VARCHAR2(2)   | Mês                  |
| cpf_titular      | VARCHAR2(14)  | CPF titular          |
| codigo_increment | NUMBER        | ID sequencial        |
| ano_uni          | VARCHAR2(4)   | Ano referência       |
| mes_uni          | VARCHAR2(2)   | Mês referência       |

---

### 4. `gc.uni_dados_contrato`

**Descrição:** Contratos Unimed cadastrados por empresa

| Coluna      | Tipo         | Descrição       |
| ----------- | ------------ | --------------- |
| cod_empresa | NUMBER       | Código empresa  |
| codcoligada | NUMBER       | Código coligada |
| codfilial   | NUMBER       | Código filial   |
| cod_band    | NUMBER       | Código bandeira |
| cnpj        | VARCHAR2(20) | CNPJ            |
| contrato    | VARCHAR2(50) | Número contrato |
| ativo       | CHAR(1)      | Status (S/N)    |

---

### 5. `gc.empresa_filial`

**Descrição:** Cadastro de empresas e filiais

| Coluna          | Tipo         | Descrição              |
| --------------- | ------------ | ---------------------- |
| cod_empresa     | NUMBER       | Código empresa         |
| codcoligada     | NUMBER       | Código coligada        |
| codfilial       | NUMBER       | Código filial          |
| cod_band        | NUMBER       | Código bandeira        |
| sigla           | VARCHAR2(10) | Sigla empresa          |
| cnpj            | VARCHAR2(20) | CNPJ                   |
| processa_unimed | CHAR(1)      | Processa Unimed? (S/N) |
| bandeira        | VARCHAR2(50) | Nome bandeira          |

---

### 6. `nbs.mcw_colaborador`

**Descrição:** Cadastro de colaboradores

| Coluna      | Tipo          | Descrição       |
| ----------- | ------------- | --------------- |
| cod_empresa | NUMBER        | Código empresa  |
| codcoligada | NUMBER        | Código coligada |
| codfilial   | NUMBER        | Código filial   |
| cpf         | VARCHAR2(14)  | CPF             |
| nome        | VARCHAR2(200) | Nome completo   |
| ativo       | CHAR(1)       | Status (S/N)    |
| unimed      | NUMBER(10,2)  | Valor Unimed    |

---

### 7. `gc.mcw_processo`

**Descrição:** Processos de fechamento/exportação

| Coluna          | Tipo          | Descrição                           |
| --------------- | ------------- | ----------------------------------- |
| codigo          | VARCHAR2(10)  | Código processo (ex: 70000001)      |
| descricao       | VARCHAR2(200) | Descrição processo                  |
| categoria       | VARCHAR2(10)  | Categoria (UNI, CDC, etc)           |
| procedure       | VARCHAR2(200) | Nome procedure Oracle               |
| ordem           | NUMBER        | Ordem execução                      |
| ordem_procedure | NUMBER        | Ordem procedure                     |
| dias            | NUMBER        | Prazo limite (dias após fechamento) |
| ativo           | CHAR(1)       | Status (S/N)                        |
| tipo_empresa    | VARCHAR2(10)  | Tipo empresa                        |
| tipo_dado       | VARCHAR2(10)  | Tipo dado (U=Unimed)                |
| usuario         | VARCHAR2(50)  | Usuário responsável                 |

---

### 8. `gc.mcw_processo_log`

**Descrição:** Log de execuções de processos

| Coluna    | Tipo         | Descrição               |
| --------- | ------------ | ----------------------- |
| codigo    | VARCHAR2(10) | Código processo         |
| mes_ref   | NUMBER       | Mês referência          |
| ano_ref   | NUMBER       | Ano referência          |
| usuario   | VARCHAR2(50) | Usuário executor        |
| data_proc | DATE         | Data/hora processamento |
| apaga     | CHAR(1)      | Apagou dados? (S/N)     |
| previa    | CHAR(1)      | É prévia? (S/N)         |
| categoria | VARCHAR2(10) | Categoria               |
| hora1     | NUMBER       | Hora início             |
| hora2     | NUMBER       | Hora fim                |

---

### 9. `gc.mcw_periodo`

**Descrição:** Períodos de fechamento

| Coluna     | Tipo   | Descrição          |
| ---------- | ------ | ------------------ |
| mes_ref    | NUMBER | Mês                |
| ano_ref    | NUMBER | Ano                |
| data_final | DATE   | Data final período |

---

### 10. `gc.api_gc_servicos`

**Descrição:** Controle de tokens/autenticação APIs

| Coluna           | Tipo          | Descrição                     |
| ---------------- | ------------- | ----------------------------- |
| tipo             | CHAR(1)       | Tipo (U=Unimed, H=HapVida)    |
| hash             | VARCHAR2(500) | Token/Hash                    |
| ativo            | CHAR(1)       | Status (S/N)                  |
| data_atualizacao | VARCHAR2(10)  | Data atualização (DD/MM/YYYY) |

---

## Views Importantes

### `gc.vw_uni_resumo_colaborador`

View materializada para consultas rápidas do resumo de colaboradores

### `gc.vw_uni_dados_contratos`

View com contratos ativos e informações consolidadas

### `gc.vw_mcw_processo_log`

View com histórico detalhado de processos

---

## Stored Procedures

### `gc.PKG_UNI_SAUDE.p_uni_resumo(p_mes_ref, p_ano_ref)`

**Descrição:** Processa dados importados e gera resumo por colaborador
**Parâmetros:**

- p_mes_ref: NUMBER - Mês referência
- p_ano_ref: NUMBER - Ano referência

**O que faz:**

1. Consolida dados de `gc.UNI_DADOS_COBRANCA`
2. Agrupa por colaborador (CPF)
3. Calcula valores (titular, dependentes, total)
4. Popula `gc.uni_resumo_colaborador`
5. Atualiza flags de controle

---

### `GC.PGK_GLOBAL.P_MCW_FECHA_COMISSAO_GLOBAL(...)`

**Descrição:** Procedure global de fechamento e exportação

**Parâmetros:**

- p_codigo: VARCHAR2 - Código do processo
- p_mes_ref: NUMBER - Mês referência
- p_ano_ref: NUMBER - Ano referência
- p_previa: VARCHAR2 - Gerar prévia (S/N)
- p_apaga: VARCHAR2 - Apagar dados antigos (S/N)
- p_usuario: VARCHAR2 - Usuário executor
- p_todas_empresas: VARCHAR2 - Todas empresas (S/N)
- p_cod_empresa: VARCHAR2 - Código empresa específica
- p_cod_band: VARCHAR2 - Código bandeira
- p_tipo_dado: VARCHAR2 - Tipo dado
- p_categoria: VARCHAR2 - Categoria
- p_cpf: VARCHAR2 - CPF colaborador específico

**O que faz:**

1. Valida período de fechamento
2. Executa rotinas específicas por processo
3. Registra log de execução
4. Prepara dados para exportação

---

## Relacionamentos

```
gc.empresa_filial (1) ----< (N) gc.uni_dados_cobranca
gc.empresa_filial (1) ----< (N) gc.uni_dados_contrato
gc.uni_dados_cobranca (N) ----> (1) nbs.mcw_colaborador [CPF]
gc.uni_resumo_colaborador (N) --> (1) gc.empresa_filial
gc.mcw_processo (1) ----< (N) gc.mcw_processo_log
```

---

## Códigos e Enumerações

### Flag Exporta

- `S` = Sim, será exportado
- `N` = Não, não será exportado

### Flag Ativo

- `S` = Ativo
- `N` = Inativo

### Tipos de Processo

- `U` = Unimed
- `H` = HapVida
- `C` = CDC
- etc.

### Graus de Dependência

- `Titular`
- `Cônjuge`
- `Filho(a)`
- `Pai/Mãe`
- `Outros`

---

## Convenções de Nomenclatura

- **Tabelas:** MAIÚSCULAS com underline (ex: UNI_DADOS_COBRANCA)
- **Colunas:** minúsculas com underline (ex: cod_empresa)
- **Procedures:** PascalCase com prefixo (ex: p_uni_resumo)
- **Packages:** MAIÚSCULAS (ex: PKG_UNI_SAUDE)
- **Views:** prefixo vw\_ (ex: vw_uni_resumo_colaborador)
