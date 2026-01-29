# 🌍 Ambientes de Exportação TOTVS

## 📋 Visão Geral

O módulo de exportação TOTVS suporta **3 modos de operação** baseados no ambiente:

| Ambiente         | NODE_ENV            | Comportamento          | DB_LINK Usado           |
| ---------------- | ------------------- | ---------------------- | ----------------------- |
| **Development**  | `development`       | 🔍 PREVIEW (simulação) | Nenhum (apenas queries) |
| **Test/Staging** | `test` ou `staging` | ⚡ EXECUÇÃO REAL       | `@rmteste`              |
| **Production**   | `production`        | ⚡ EXECUÇÃO REAL       | `@dblrm`                |

---

## 🔍 Modo 1: PREVIEW (Development)

### Quando Ativa

- `NODE_ENV=development` (ou não definido)
- **E** `ALLOW_TOTVS_EXPORT` ≠ `true`

### Comportamento

✅ Retorna preview com dados simulados  
❌ **NÃO** executa procedure `P_MCW_FECHA_COMISSAO_GLOBAL`  
❌ **NÃO** afeta tabelas TOTVS RM  
✅ Query apenas `gc.vw_uni_resumo_colaborador` para simular

### Response Exemplo

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
  },
  "timestamp": "2026-01-28T10:30:00Z"
}
```

### Uso

```bash
# Modo padrão - sempre preview
npm run start:dev

# Status do sistema
curl http://localhost:3000/exportacao/status
```

---

## ⚡ Modo 2: EXECUÇÃO EM TESTE (Test/Staging)

### Quando Ativa

- `NODE_ENV=test` **OU** `NODE_ENV=staging`

### Comportamento

⚠️ Executa procedure `P_MCW_FECHA_COMISSAO_GLOBAL`  
⚠️ **AFETA tabelas TOTVS RM de TESTE**  
⚠️ Require DB_LINK `@rmteste` configurado no Oracle

### 🛠️ Configuração do DB_LINK

A procedure **PKG_UNI_SAUDE.P_EXP_PLANO_SAUDE** tem linhas comentadas com `@rmteste`:

```sql
-- LINHAS COMENTADAS (para usar em teste):
--delete from rm.pffinanc@rmteste
--insert into rm.pfperff@rmteste
--update rm.pffinanc@rmteste
--insert into rm.pffinanc@rmteste

-- LINHAS ATIVAS (produção):
delete from rm.pffinanc@dblrm
insert into rm.pfperff@dblrm
update rm.pffinanc@dblrm
insert into rm.pffinanc@dblrm
```

#### Opção 1: Criar Versão de Teste da Procedure

```sql
-- Criar versão separada para teste
CREATE OR REPLACE PACKAGE BODY PKG_UNI_SAUDE AS
  PROCEDURE P_EXP_PLANO_SAUDE(...) IS
  BEGIN
    -- Comentar @dblrm, descomentar @rmteste
    delete from rm.pffinanc@rmteste  -- ← ativar
    ...
  END;
END;
```

#### Opção 2: DB_LINK Dinâmico

```sql
-- Criar sinônimo baseado em ambiente
CREATE OR REPLACE SYNONYM rm.pffinanc_target
  FOR rm.pffinanc@rmteste;  -- ou @dblrm em produção

-- Usar sinônimo na procedure
delete from rm.pffinanc_target;
```

### Response Exemplo

```json
{
  "sucesso": true,
  "mensagem": "EXPORTAÇÃO executada com sucesso para todos os colaboradores da empresa UNI no período 1/2026",
  "modo": "EXECUÇÃO REAL (TESTE)",
  "ambiente": "test",
  "aviso": "⚠️ Executando em base de teste. Certifique-se que @rmteste está configurado.",
  "timestamp": "2026-01-28T10:30:00Z"
}
```

### Uso

```bash
# Configurar ambiente de teste
export NODE_ENV=test

# Iniciar aplicação
npm start

# Executar exportação (vai executar REAL na base de teste)
curl -X POST http://localhost:3000/exportacao/totvs \
  -H "Content-Type: application/json" \
  -d '{
    "mesRef": 1,
    "anoRef": 2026,
    "empresa": "UNI",
    "previa": false,
    "apagar": false
  }'
```

---

## ⚡ Modo 3: EXECUÇÃO EM PRODUÇÃO

### Quando Ativa

- `NODE_ENV=production`

### Comportamento

🔴 Executa procedure `P_MCW_FECHA_COMISSAO_GLOBAL`  
🔴 **AFETA tabelas TOTVS RM de PRODUÇÃO**  
🔴 Usa DB_LINK `@dblrm` (produção)

### Tabelas Afetadas

- `rm.pffinanc@dblrm` - Lançamentos financeiros (evento 7611)
- `rm.pfperff@dblrm` - Períodos de folha (nroperiodo=4)

### Response Exemplo

```json
{
  "sucesso": true,
  "mensagem": "EXPORTAÇÃO executada com sucesso para todos os colaboradores da empresa UNI no período 1/2026",
  "modo": "EXECUÇÃO REAL",
  "ambiente": "production",
  "timestamp": "2026-01-28T10:30:00Z"
}
```

### Uso

```bash
# Configurar ambiente de produção
export NODE_ENV=production

# Iniciar aplicação
npm start

# ⚠️ CUIDADO: Afeta produção!
curl -X POST http://localhost:3000/exportacao/totvs \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "mesRef": 1,
    "anoRef": 2026,
    "empresa": "UNI",
    "previa": false,
    "apagar": false
  }'
```

---

## 🔐 Override Manual: ALLOW_TOTVS_EXPORT

### Quando Usar

Forçar execução REAL mesmo em `development`:

```bash
# Forçar execução em development (usar com CAUTELA!)
export NODE_ENV=development
export ALLOW_TOTVS_EXPORT=true

npm start
```

⚠️ **ATENÇÃO**: Isso vai executar na base de produção se `@dblrm` estiver configurado!

---

## 📊 Endpoint de Status

### Request

```bash
GET /exportacao/status
Authorization: Bearer <token>
```

### Response - Development

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
  "descricao": "Exportação Plano Saúde Unimed"
}
```

### Response - Test/Staging

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
  "descricao": "Exportação Plano Saúde Unimed"
}
```

### Response - Production

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
  "descricao": "Exportação Plano Saúde Unimed"
}
```

---

## 🧪 Fluxo de Testes Recomendado

### 1. Development (Preview)

```bash
# Testar lógica de negócio sem afetar banco
NODE_ENV=development npm run start:dev

# Verificar preview
curl http://localhost:3000/exportacao/totvs -d '{...}'
# → Deve retornar modo: "PREVIEW"
```

### 2. Test/Staging (Base Teste)

```bash
# Configurar @rmteste no Oracle antes!
# Editar procedure ou criar sinônimo

NODE_ENV=test npm start

# Executar na base de teste
curl http://localhost:3000/exportacao/totvs -d '{...}'
# → Deve retornar modo: "EXECUÇÃO REAL (TESTE)"

# Validar dados no RM teste
SELECT * FROM rm.pffinanc@rmteste WHERE codperFF = 4;
```

### 3. Production (Base Produção)

```bash
# Deploy com NODE_ENV=production
NODE_ENV=production npm start

# Executar com validação prévia
curl http://localhost:3000/exportacao/totvs -d '{"previa": true, ...}'
# → Verifica dados sem gravar (flag P_PREVIA='S')

# Executar definitivo após validação
curl http://localhost:3000/exportacao/totvs -d '{"previa": false, ...}'
# → Grava na produção
```

---

## ⚙️ Variáveis de Ambiente

| Variável             | Valores                                        | Padrão        | Efeito                        |
| -------------------- | ---------------------------------------------- | ------------- | ----------------------------- |
| `NODE_ENV`           | `development`, `test`, `staging`, `production` | `development` | Define ambiente               |
| `ALLOW_TOTVS_EXPORT` | `true`, `false`                                | `false`       | Override para forçar execução |

---

## 🔧 Checklist de Deploy

### Development

- [ ] `NODE_ENV=development`
- [ ] Validar que retorna `modo: "PREVIEW"`
- [ ] Testar preview com diferentes cenários

### Test/Staging

- [ ] Criar/validar DB_LINK `@rmteste` no Oracle
- [ ] Editar procedure ou criar sinônimo para usar `@rmteste`
- [ ] `NODE_ENV=test` ou `NODE_ENV=staging`
- [ ] Validar que executa em base de teste
- [ ] Verificar dados no RM teste após exportação

### Production

- [ ] Validar que DB_LINK `@dblrm` está correto
- [ ] `NODE_ENV=production`
- [ ] **NÃO** definir `ALLOW_TOTVS_EXPORT` (deixar padrão)
- [ ] Testar com `previa: true` antes de executar definitivo
- [ ] Monitorar logs durante primeira execução

---

## 🚨 Troubleshooting

### "ORA-02019: connection description for remote database not found"

**Causa**: DB_LINK não configurado  
**Solução**: Criar `@rmteste` para ambiente de teste

```sql
CREATE DATABASE LINK rmteste
  CONNECT TO <user> IDENTIFIED BY <password>
  USING '(DESCRIPTION=...)';
```

### "Exportação retorna preview mas quero executar em teste"

**Causa**: `NODE_ENV` não está como `test`  
**Solução**: `export NODE_ENV=test`

### "Executou em produção sem querer"

**Causa**: `NODE_ENV=production` ou `ALLOW_TOTVS_EXPORT=true`  
**Prevenção**: Sempre validar ambiente antes com `GET /exportacao/status`

---

## 📚 Referências

- [ANALISE_MODULO_EXPORTACAO.md](./ANALISE_MODULO_EXPORTACAO.md) - Análise completa da procedure
- [pkg.uni_saude.sql](./pkg.uni_saude.sql) - Código fonte da procedure (linha 328: @rmteste comentado)
- [Endpoint Swagger](http://localhost:3000/api) - Documentação interativa
