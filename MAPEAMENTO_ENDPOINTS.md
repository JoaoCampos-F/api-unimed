# API UNIMED - MAPEAMENTO DE ENDPOINTS

## Endpoints do Sistema Legacy (PHP) → NestJS

### 📥 IMPORTAÇÃO DE DADOS

| Endpoint Legacy           | Método | NestJS Proposto                | Descrição                   |
| ------------------------- | ------ | ------------------------------ | --------------------------- |
| `acao=saveUnimedCnpj`     | POST   | `POST /unimed/import/cnpj`     | Importa dados por CNPJ      |
| `acao=saveUnimedContrato` | POST   | `POST /unimed/import/contrato` | Importa dados por Contrato  |
| `acao=saveUnimed2`        | POST   | `POST /unimed/import/soap`     | Importa via SOAP (legado)   |
| `acao=save`               | POST   | `POST /unimed/import/resumo`   | Executa procedure de resumo |

### 👥 GERENCIAMENTO DE COLABORADORES

| Endpoint Legacy               | Método | NestJS Proposto                              | Descrição                       |
| ----------------------------- | ------ | -------------------------------------------- | ------------------------------- |
| `acao=Buscar`                 | GET    | `GET /unimed/colaboradores`                  | Lista colaboradores com filtros |
| `acao=update`                 | POST   | `PATCH /unimed/colaboradores/:cpf`           | Atualiza flag exportação        |
| `acao=updateTodosColaborador` | POST   | `PATCH /unimed/colaboradores/empresa/:sigla` | Atualiza todos da empresa       |
| `acao=updateValor`            | POST   | `PATCH /unimed/valores/empresa/:sigla`       | Atualiza valor empresa          |

### ⚙️ PROCESSOS E FECHAMENTOS

| Endpoint Legacy          | Método | NestJS Proposto                           | Descrição                   |
| ------------------------ | ------ | ----------------------------------------- | --------------------------- |
| `acao=Buscarprocesso`    | POST   | `GET /unimed/processos`                   | Lista processos disponíveis |
| `acao=Execute`           | POST   | `POST /unimed/processos/executar`         | Executa processos           |
| `acao=ExUnimed`          | POST   | `POST /unimed/exportacao/totvs`           | Exporta para Totvs          |
| `acao=H_unimed`          | POST   | `GET /unimed/processos/historico`         | Histórico de processos      |
| `acao=HistoricoProcesso` | POST   | `GET /unimed/processos/:codigo/historico` | Histórico específico        |

### 📊 RELATÓRIOS

| Endpoint Legacy                    | Método | NestJS Proposto                        | Descrição        |
| ---------------------------------- | ------ | -------------------------------------- | ---------------- |
| `acao=RelatorioColaborador`        | GET    | `GET /relatorios/unimed/colaborador`   | PDF Colaborador  |
| `acao=RelatorioEmpresaColaborador` | GET    | `GET /relatorios/unimed/empresa`       | PDF Empresa      |
| `acao=RelatorioPagamento`          | GET    | `GET /relatorios/unimed/pagamento`     | PDF Pagamento    |
| `acao=RelatorioNaoPagamento`       | GET    | `GET /relatorios/unimed/nao-pagamento` | PDF Não Lançado  |
| `acao=resumoDept`                  | GET    | `GET /relatorios/unimed/departamento`  | PDF Departamento |
| `acao=resumoCentroCust`            | GET    | `GET /relatorios/unimed/centro-custo`  | PDF Centro Custo |
| `acao=unimedDIRF`                  | POST   | `POST /unimed/dirf`                    | Gera dados DIRF  |

---

## Estrutura de Rotas NestJS

```typescript
// Módulo Unimed
/api/v1/unimed
  ├── /import
  │   ├── POST /cnpj           # Importar por CNPJ
  │   ├── POST /contrato       # Importar por Contrato
  │   ├── POST /soap           # Importar SOAP (legado)
  │   └── POST /resumo         # Executar procedure resumo
  │
  ├── /colaboradores
  │   ├── GET  /               # Listar com filtros
  │   ├── GET  /:cpf           # Buscar por CPF
  │   ├── PATCH /:cpf          # Atualizar flag exportação
  │   └── PATCH /empresa/:sigla # Atualizar todos da empresa
  │
  ├── /valores
  │   └── PATCH /empresa/:sigla # Atualizar valor empresa
  │
  ├── /processos
  │   ├── GET  /               # Listar processos
  │   ├── POST /executar       # Executar processos
  │   ├── GET  /historico      # Histórico geral
  │   └── GET  /:codigo/historico # Histórico específico
  │
  ├── /exportacao
  │   └── POST /totvs          # Exportar para Totvs
  │
  └── /dirf
      └── POST /               # Gerar dados DIRF

// Módulo Relatórios
/api/v1/relatorios/unimed
  ├── GET /colaborador         # Relatório Colaborador
  ├── GET /empresa             # Relatório Empresa
  ├── GET /pagamento           # Relatório Pagamento
  ├── GET /nao-pagamento       # Relatório Não Pagamento
  ├── GET /departamento        # Resumo Departamento
  └── GET /centro-custo        # Resumo Centro Custo
```

---

## Parâmetros de Query/Body

### Importação por CNPJ

```typescript
POST /api/v1/unimed/import/cnpj
Body: {
  "mes": "12",
  "ano": "2024"
}
```

### Buscar Colaboradores

```typescript
GET /api/v1/unimed/colaboradores?busca_empresa=CML&busca_mes=12&busca_ano=2024
Query Params:
  - busca_empresa: string (opcional)
  - busca_usuario: string (CPF, opcional)
  - busca_mes: string (opcional)
  - busca_ano: string (opcional)
  - busca_contrato: string (opcional)
```

### Atualizar Colaborador

```typescript
PATCH /api/v1/unimed/colaboradores/12345678900
Body: {
  "mes_ref": "12",
  "ano_ref": "2024",
  "exporta": "S" // ou "N"
}
```

### Executar Processos

```typescript
POST /api/v1/unimed/processos/executar
Body: {
  "processos": ["70000001", "70000002"],
  "mes_ref": 12,
  "ano_ref": 2024,
  "empresa": "CML",
  "bandeira": "1",
  "apagar": "N",
  "previa": "N",
  "cpf_colaborador": "" // opcional
}
```

---

## Status Codes

| Código | Situação           |
| ------ | ------------------ |
| 200    | Sucesso            |
| 201    | Criado com sucesso |
| 400    | Erro de validação  |
| 401    | Não autorizado     |
| 404    | Não encontrado     |
| 500    | Erro interno       |

---

## Exemplos de Resposta

### Sucesso

```json
{
  "result": true,
  "message": "Dados importados com sucesso",
  "data": {
    "registros_importados": 150
  }
}
```

### Erro

```json
{
  "result": false,
  "message": "Erro ao importar dados",
  "error": "Empresa não configurada para processar Unimed"
}
```

### Lista de Colaboradores (DataTables)

```json
{
  "recordsTotal": 100,
  "recordsFiltered": 100,
  "data": [
    {
      "apelido": "CML",
      "colaborador": "JOAO DA SILVA",
      "ativo": "S",
      "mes_ref": "12",
      "ano_ref": "2024",
      "m_titular": "R$ 350,00",
      "m_dependente": "R$ 150,00",
      "valor_consumo": "R$ 500,00",
      "perc_empresa": "R$ 400,00",
      "valor_total": "R$ 500,00",
      "valor_liquido": "R$ 100,00",
      "exporta": "S"
    }
  ]
}
```
