# Documentação - Módulo de Relatórios

## 📋 Visão Geral

Módulo responsável pela geração de relatórios PDF utilizando JasperReports Server. Implementa proxy transparente para os templates existentes, mantendo 100% de compatibilidade com o sistema legado.

## 🎯 Objetivo

Fornecer endpoints REST para geração de 6 tipos de relatórios:

- RelatorioColaborador - Relatório individual ou filtrado por CPF
- RelatorioEmpresaColaborador - Resumo de todos colaboradores
- RelatorioPagamento - Apenas colaboradores com exporta='S'
- RelatorioNaoPagamento - Apenas colaboradores com exporta='N'
- ResumoDepto - Agrupamento por colaborador e centro de custo
- ResumoCentroCusto - Totalização por centro de custo

## 🏗️ Arquitetura

### Domain Layer

```
src/domain/repositories/
└── relatorio.repository.interface.ts - Interface com 6 métodos + tipos
```

### Application Layer

```
src/application/
├── dtos/relatorio/
│   ├── gerar-relatorio-colaborador.dto.ts
│   ├── gerar-relatorio-empresa.dto.ts
│   ├── gerar-relatorio-pagamento.dto.ts
│   └── index.ts
├── use-cases/relatorio/
│   ├── gerar-relatorio-colaborador.use-case.ts
│   ├── gerar-relatorio-empresa.use-case.ts
│   ├── gerar-relatorio-pagamento.use-case.ts
│   ├── gerar-relatorio-nao-pagamento.use-case.ts
│   ├── gerar-resumo-depto.use-case.ts
│   ├── gerar-resumo-centro-custo.use-case.ts
│   └── index.ts
└── relatorio-application.module.ts
```

### Infrastructure Layer

```
src/infrastructure/
├── external-apis/
│   └── jasper-client.service.ts - Cliente HTTP para JasperServer
├── repositories/
│   └── relatorio.repository.ts - Implementação com mapeamento de parâmetros
└── relatorio-infrastructure.module.ts
```

### Presentation Layer

```
src/presentation/
├── controllers/
│   └── relatorio.controller.ts - 6 endpoints GET
└── relatorio-presentation.module.ts
```

## 🔌 Endpoints

### Base URL

```
GET /relatorios/*
```

### 1. Relatório de Colaborador

```http
GET /relatorios/colaborador?codEmpresa=1&codColigada=1&codFilial=1&mesRef=01&anoRef=2025&codBand=1&cpf=12345678900
```

**Parâmetros:**

- `codEmpresa` (required): Código da empresa
- `codColigada` (required): Código da coligada
- `codFilial` (required): Código da filial
- `mesRef` (required): Mês (01-12)
- `anoRef` (required): Ano (>= 2000)
- `codBand` (required): Código da bandeira
- `cpf` (optional): Filtro por CPF (11 dígitos)
- `codContrato` (optional): Filtro por contrato

**Response:** PDF (application/pdf)

### 2. Relatório Resumo Empresa

```http
GET /relatorios/empresa?codEmpresa=1&codColigada=1&codFilial=1&mesRef=01&anoRef=2025&codBand=1
```

**Observação:** NÃO aceita filtro por CPF (sempre retorna todos)

### 3. Relatório Pagamento

```http
GET /relatorios/pagamento?codEmpresa=1&codColigada=1&codFilial=1&mesRef=01&anoRef=2025&codBand=1
```

**Filtro:** Apenas colaboradores com `EXPORTA='S'`

### 4. Relatório Não-Pagamento

```http
GET /relatorios/nao-pagamento?codEmpresa=1&codColigada=1&codFilial=1&mesRef=01&anoRef=2025&codBand=1
```

**Filtro:** Apenas colaboradores com `EXPORTA='N'`

### 5. Resumo por Departamento

```http
GET /relatorios/resumo-depto?codEmpresa=1&codColigada=1&codFilial=1&mesRef=01&anoRef=2025&codBand=1
```

**Agrupamento:** Colaborador + Centro de Custo

### 6. Resumo por Centro de Custo

```http
GET /relatorios/resumo-centro-custo?codEmpresa=1&codColigada=1&codFilial=1&mesRef=01&anoRef=2025&codBand=1
```

**Agrupamento:** Apenas Centro de Custo (totais agregados)

## ⚙️ Configuração

### Variáveis de Ambiente (.env)

```bash
# JasperReports Server
JASPER_SERVER_URL=http://relatorio.viacometa.com.br:8080/jasperserver
JASPER_USERNAME=npd
JASPER_PASSWORD=npd1234@
```

## 🔄 Fluxo de Execução

```
1. Cliente → GET /relatorios/colaborador
2. Controller → Valida DTO (class-validator)
3. Controller → Chama Use Case
4. Use Case → Valida se empresa existe (Oracle)
5. Use Case → Chama Repository
6. Repository → Constrói parâmetros JasperServer
7. Repository → Chama JasperClientService
8. JasperClientService → HTTP GET para JasperServer REST API
9. JasperServer → Executa template .jrxml
10. JasperServer → Consulta Oracle (gc.vw_uni_resumo_colaborador)
11. JasperServer → Gera PDF
12. JasperClientService → Retorna Buffer
13. Controller → Envia PDF como Response
```

## 🗂️ Mapeamento de Templates

| Endpoint               | Template JasperServer                                       |
| ---------------------- | ----------------------------------------------------------- |
| `/colaborador`         | `/reports/INTRANET/uni/RelatorioColaborador.jrxml`          |
| `/empresa`             | `/reports/INTRANET/uni/relatorioCobranca_por_empresa.jrxml` |
| `/pagamento`           | `/reports/INTRANET/uni/RelatorioPagamento.jrxml`            |
| `/nao-pagamento`       | `/reports/INTRANET/uni/RelatorioNaoPagamento.jrxml`         |
| `/resumo-depto`        | `/reports/INTRANET/uni/resumoDept.jrxml`                    |
| `/resumo-centro-custo` | `/reports/INTRANET/uni/resumoCentroCust.jrxml`              |

## 📊 Parâmetros JasperServer

Todos os parâmetros seguem padrão `in_*` conforme sistema legado:

```typescript
{
  in_codEmpresa: number,
  in_codColigada: number,
  in_codFilial: number,
  in_mesRef: string,      // "01", "02", etc
  in_anoRef: number,
  in_codBand: number,
  in_cpf: string,         // Opcional
  in_usuario: 'API',      // Fixo
  in_codContrato: string  // Opcional
}
```

## 🔐 Segurança

- ✅ JWT Authentication via `@UseGuards(JwtAuthGuard)`
- ✅ Validação de empresa existente antes de gerar relatório
- ✅ Validação de parâmetros via class-validator
- ✅ Timeout de 60 segundos para relatórios pesados

## 🧪 Testes

### Teste de Conexão

```typescript
const jasperClient = app.get(JasperClientService);
const isConnected = await jasperClient.testConnection();
// Expected: true
```

### Teste de Endpoint

```bash
curl -X GET "http://localhost:3000/relatorios/colaborador?codEmpresa=1&codColigada=1&codFilial=1&mesRef=01&anoRef=2025&codBand=1" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  --output relatorio.pdf
```

## ⚠️ Tratamento de Erros

### Empresa não encontrada

```json
{
  "statusCode": 404,
  "message": "Empresa 1/1/1 não encontrada"
}
```

### Erro no JasperServer

```json
{
  "statusCode": 500,
  "message": "Erro ao gerar relatório no JasperServer",
  "reportPath": "/reports/INTRANET/uni/RelatorioColaborador",
  "params": {...},
  "jasperError": "Connection timeout"
}
```

### Validação de parâmetros

```json
{
  "statusCode": 400,
  "message": ["mesRef deve estar no formato 01-12"],
  "error": "Bad Request"
}
```

## 📝 Observações Importantes

1. **Sem Alteração de Regras**: Sistema mantém 100% compatibilidade com templates e queries existentes
2. **Templates Externos**: Arquivos .jrxml estão no JasperServer, não no repositório
3. **Permissões Legadas**: No sistema legado, 5 relatórios avançados exigem permissão 161003 (não implementado ainda - será tratado em fase futura)
4. **Performance**: Relatórios complexos (resumo-depto, resumo-centro-custo) podem levar até 60 segundos
5. **Formato Fixo**: Apenas PDF é suportado (parâmetro `format='pdf'` hardcoded)

## 🚀 Próximos Passos

- [ ] Implementar controle de permissões (mapear 161003 → roles)
- [ ] Adicionar cache de relatórios frequentes
- [ ] Implementar fila assíncrona para relatórios pesados
- [ ] Logs estruturados de geração de relatórios
- [ ] Métricas de tempo de geração por tipo

## 📚 Referências

- **Análise Completa**: Ver `ANALISE_MODULO_RELATORIOS.md`
- **Sistema Legado**: `npd-legacy/com/modules/uni/controller/UnimedController.php`
- **Templates**: Jasper Server `/reports/INTRANET/uni/`
- **View Oracle**: `gc.vw_uni_resumo_colaborador`
