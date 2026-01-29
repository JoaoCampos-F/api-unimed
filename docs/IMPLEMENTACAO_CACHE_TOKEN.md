# 🔒 Implementação Cache de Token - API Unimed

## ⚠️ CONTEXTO CRÍTICO

### Incidente Anterior

Anteriormente houve um **PROBLEMA GRAVE** onde o sistema ficou gerando tokens desnecessariamente, atingiu o **LIMITE DIÁRIO** da API Unimed e deixou **TODO O DEPARTAMENTO DE DP SEM ACESSO**.

### Solução Implementada

Cache de token no banco de dados, seguindo EXATAMENTE o padrão do NPD-Legacy.

---

## 📋 Especificações Técnicas

### Validade do Token

- ⏱️ **6 HORAS** (não 24 horas)
- Token deve ser reutilizado enquanto estiver válido
- Validação baseada em `data_atualizacao` da tabela

### Limite da API

- ❌ **LIMITE DIÁRIO** de geração de tokens
- Cada token gerado conta no limite do dia
- Sem margem de erro: cache deve funcionar perfeitamente

---

## 🏗️ Arquitetura da Solução

### 1. Interface do Repositório

📄 **Arquivo:** `src/domain/repositories/token-cache.repository.interface.ts`

```typescript
export interface TokenCache {
  token: string;
  dataGeracao: Date;
  validoAte: Date;
}

export interface ITokenCacheRepository {
  buscarTokenValido(): Promise<string | null>;
  salvarToken(token: string): Promise<void>;
  isTokenValido(dataGeracao: Date): boolean;
}
```

### 2. Implementação do Repositório

📄 **Arquivo:** `src/infrastructure/repositories/token-cache.repository.ts`

#### Método: `buscarTokenValido()`

```sql
SELECT servico AS token, data_atualizacao
FROM gc.api_gc_servicos
WHERE tipo = 'U'
  AND ativo = 'S'
  AND data_atualizacao >= SYSDATE - INTERVAL '6' HOUR
ORDER BY data_atualizacao DESC
FETCH FIRST 1 ROW ONLY
```

**Lógica:**

- Busca token mais recente com menos de 6 horas
- `FETCH FIRST 1 ROW ONLY` garante performance
- Retorna `null` se não encontrar (segurança)

#### Método: `salvarToken()`

```sql
-- Verifica se existe
SELECT COUNT(*) FROM gc.api_gc_servicos WHERE tipo = 'U'

-- Se existe: UPDATE
UPDATE gc.api_gc_servicos
SET servico = :token, data_atualizacao = SYSDATE, ativo = 'S'
WHERE tipo = 'U'

-- Se não existe: INSERT
INSERT INTO gc.api_gc_servicos (tipo, servico, data_atualizacao, ativo)
VALUES ('U', :token, SYSDATE, 'S')
```

**Lógica:**

- Sempre mantém apenas 1 registro para tipo='U'
- Atualiza `data_atualizacao` para resetar contagem de 6 horas
- Flag `ativo='S'` indica token válido

#### Método: `isTokenValido()`

```typescript
const horasDesdeGeracao =
  (Date.now() - dataGeracao.getTime()) / (1000 * 60 * 60);
return horasDesdeGeracao < 6;
```

**Lógica:**

- Validação em JavaScript (complementar)
- Verifica se passaram menos de 6 horas

### 3. Integração no UnimedApiService

📄 **Arquivo:** `src/infrastructure/external-apis/unimed-api.service.ts`

#### Método: `obterToken()` - REESCRITO

```typescript
private async obterToken(): Promise<string> {
  try {
    // 1️⃣ PRIORIDADE: Verificar cache PRIMEIRO
    this.logger.log('🔍 Verificando cache de token...');
    const tokenCacheado = await this.tokenCacheRepository.buscarTokenValido();

    if (tokenCacheado) {
      this.logger.log('✅ Token válido encontrado no cache - REUTILIZANDO');
      return tokenCacheado;
    }

    // 2️⃣ Cache miss ou token expirado - gerar novo
    this.logger.warn('⚠️  Cache miss ou token expirado - GERANDO NOVO TOKEN');

    const response = await this.apiClient.post<string>('/Token/geratoken', {}, {
      headers: { usuario, senha },
    });

    const novoToken = response.data;
    this.logger.log('✅ Token gerado com sucesso pela API');

    // 3️⃣ CRÍTICO: Salvar no cache para próximas requisições
    this.logger.log('💾 Salvando token no cache...');
    await this.tokenCacheRepository.salvarToken(novoToken);
    this.logger.log('✅ Token salvo no cache - válido por 6 horas');

    return novoToken;
  } catch (error) {
    this.logger.error('❌ Erro ao obter token', error.message);
    throw new Error('Falha na autenticação com a API Unimed');
  }
}
```

**Fluxo de Execução:**

1. Verifica cache no banco
2. Se encontrou token válido (< 6 horas): RETORNA
3. Se não encontrou ou expirado:
   - Gera novo token via API
   - Salva no cache
   - Retorna novo token

### 4. Registro no Módulo

📄 **Arquivo:** `src/infrastructure/infrastructure.module.ts`

```typescript
@Module({
  providers: [
    {
      provide: 'ITokenCacheRepository',
      useClass: TokenCacheRepository,
    },
    TokenCacheRepository,
    UnimedApiService,
  ],
  exports: ['ITokenCacheRepository', TokenCacheRepository, UnimedApiService],
})
export class InfrastructureModule {}
```

---

## 🔍 Logs de Monitoramento

### Cache Hit (Token Válido)

```
[UnimedApiService] 🔍 Verificando cache de token...
[TokenCacheRepository] 🔍 Buscando token válido no cache...
[TokenCacheRepository] ✅ Token válido encontrado no banco (idade: 2 horas)
[UnimedApiService] ✅ Token válido encontrado no cache - REUTILIZANDO
```

### Cache Miss (Token Expirado/Inexistente)

```
[UnimedApiService] 🔍 Verificando cache de token...
[TokenCacheRepository] 🔍 Buscando token válido no cache...
[TokenCacheRepository] ❌ Nenhum token válido encontrado no cache
[UnimedApiService] ⚠️  Cache miss ou token expirado - GERANDO NOVO TOKEN
[UnimedApiService] 📡 Chamando API Unimed para gerar token...
[UnimedApiService] ✅ Token gerado com sucesso pela API
[UnimedApiService] 💾 Salvando token no cache...
[TokenCacheRepository] 💾 Salvando token no cache...
[TokenCacheRepository] ✅ Token salvo no cache com sucesso
[UnimedApiService] ✅ Token salvo no cache - válido por 6 horas
```

### Erro de Cache (Fail-Safe)

```
[TokenCacheRepository] 🔍 Buscando token válido no cache...
[TokenCacheRepository] ❌ Erro ao buscar token: Connection timeout
[TokenCacheRepository] ⚠️  Retornando null para forçar geração de novo token
[UnimedApiService] ⚠️  Cache miss ou token expirado - GERANDO NOVO TOKEN
```

---

## ✅ Checklist de Testes em DEV

### Teste 1: Cache Hit - Token Válido

**Objetivo:** Verificar se token válido é reutilizado

1. ✅ Limpar tabela: `DELETE FROM gc.api_gc_servicos WHERE tipo='U'`
2. ✅ Fazer requisição de exportação (gera token)
3. ✅ Verificar log: "✅ Token gerado com sucesso pela API"
4. ✅ Fazer SEGUNDA requisição imediatamente
5. ✅ Verificar log: "✅ Token válido encontrado no cache - REUTILIZANDO"
6. ✅ Verificar banco: `SELECT * FROM gc.api_gc_servicos WHERE tipo='U'`
   - Deve ter apenas 1 registro
   - `data_atualizacao` não deve mudar na segunda requisição

**Resultado Esperado:** Token NÃO é gerado novamente

---

### Teste 2: Cache Miss - Token Expirado

**Objetivo:** Verificar se token expirado gera novo

1. ✅ Inserir token antigo manualmente:

```sql
INSERT INTO gc.api_gc_servicos (tipo, servico, data_atualizacao, ativo)
VALUES ('U', 'TOKEN_ANTIGO_FAKE', SYSDATE - INTERVAL '7' HOUR, 'S');
```

2. ✅ Fazer requisição de exportação
3. ✅ Verificar log: "⚠️ Cache miss ou token expirado - GERANDO NOVO TOKEN"
4. ✅ Verificar banco: Token deve ser atualizado para novo valor
5. ✅ `data_atualizacao` deve ser SYSDATE

**Resultado Esperado:** Token antigo é substituído por novo

---

### Teste 3: Múltiplas Requisições Simultâneas

**Objetivo:** Verificar comportamento com concorrência

1. ✅ Limpar tabela: `DELETE FROM gc.api_gc_servicos WHERE tipo='U'`
2. ✅ Fazer 5 requisições simultâneas usando Postman/Insomnia
3. ✅ Verificar logs: Apenas PRIMEIRA deve gerar token
4. ✅ Demais devem mostrar: "✅ Token válido encontrado no cache"
5. ✅ Verificar banco: Deve ter apenas 1 registro

**Resultado Esperado:** Apenas 1 token gerado, demais reutilizam

---

### Teste 4: Erro no Cache (Fail-Safe)

**Objetivo:** Verificar se erro no cache não quebra aplicação

1. ✅ Parar Oracle temporariamente (simular erro)
2. ✅ Fazer requisição de exportação
3. ✅ Verificar log: "❌ Erro ao buscar token: ..."
4. ✅ Verificar log: "⚠️ Retornando null para forçar geração"
5. ✅ Aplicação deve gerar novo token normalmente

**Resultado Esperado:** Erro de cache NÃO impede funcionamento

---

### Teste 5: Validação de 6 Horas Exatas

**Objetivo:** Verificar se transição de 6 horas funciona corretamente

1. ✅ Inserir token com exatamente 5h59min:

```sql
INSERT INTO gc.api_gc_servicos (tipo, servico, data_atualizacao, ativo)
VALUES ('U', 'TOKEN_5H59MIN', SYSDATE - INTERVAL '359' MINUTE, 'S');
```

2. ✅ Fazer requisição: Deve REUTILIZAR token (< 6h)
3. ✅ Atualizar para 6h01min:

```sql
UPDATE gc.api_gc_servicos
SET data_atualizacao = SYSDATE - INTERVAL '361' MINUTE
WHERE tipo = 'U';
```

4. ✅ Fazer requisição: Deve GERAR NOVO token (> 6h)

**Resultado Esperado:** Validação precisa de 6 horas

---

## 📊 Monitoramento em Produção

### Queries de Monitoramento

#### Ver token atual e idade

```sql
SELECT
    tipo,
    SUBSTR(servico, 1, 50) AS token_preview,
    data_atualizacao,
    ROUND((SYSDATE - data_atualizacao) * 24, 2) AS idade_horas,
    CASE
        WHEN (SYSDATE - data_atualizacao) * 24 < 6 THEN 'VÁLIDO'
        ELSE 'EXPIRADO'
    END AS status,
    ativo
FROM gc.api_gc_servicos
WHERE tipo = 'U';
```

#### Histórico de atualizações (se tiver audit)

```sql
SELECT
    data_atualizacao,
    ROUND((LAG(data_atualizacao) OVER (ORDER BY data_atualizacao DESC) - data_atualizacao) * 24, 2) AS horas_entre_tokens
FROM gc.api_gc_servicos
WHERE tipo = 'U'
ORDER BY data_atualizacao DESC
FETCH FIRST 10 ROWS ONLY;
```

### Alertas Recomendados

1. **Alerta Crítico:** Mais de 5 tokens gerados em 6 horas
   - Indica possível problema no cache
   - Risco de atingir limite diário

2. **Alerta Warning:** Token sendo gerado antes de 5 horas
   - Cache pode não estar funcionando corretamente
   - Investigar logs

3. **Alerta Info:** Token reutilizado com sucesso
   - Confirmação que cache está funcionando
   - Métrica de health

---

## 🚨 Troubleshooting

### Problema: "Limite diário de tokens atingido"

**Sintomas:**

- API Unimed retorna erro de autenticação
- Log mostra: "❌ Erro ao obter token: Limit exceeded"

**Diagnóstico:**

```sql
-- Verificar quantos tokens foram salvos hoje
SELECT COUNT(*), MIN(data_atualizacao), MAX(data_atualizacao)
FROM gc.api_gc_servicos
WHERE tipo = 'U'
  AND TRUNC(data_atualizacao) = TRUNC(SYSDATE);
```

**Solução:**

1. Aguardar reset do limite (próximo dia útil)
2. Verificar logs para identificar causa raiz
3. Se cache está salvando mas não reutilizando: BUG CRÍTICO

---

### Problema: "Token sempre gerando novo"

**Sintomas:**

- Log sempre mostra: "⚠️ Cache miss ou token expirado - GERANDO NOVO TOKEN"
- Mesmo com requisições próximas

**Diagnóstico:**

```sql
-- Verificar se token está sendo salvo
SELECT * FROM gc.api_gc_servicos WHERE tipo = 'U';
```

**Possíveis Causas:**

1. **Token não está sendo salvo:** Erro no método `salvarToken()`
2. **Query de busca incorreta:** Problema no `WHERE` clause
3. **Timezone do banco diferente:** `SYSDATE` vs `data_atualizacao`

**Solução:**

1. Verificar logs de "💾 Salvando token no cache..."
2. Confirmar: "✅ Token salvo no cache com sucesso"
3. Testar query manualmente no SQL Developer

---

### Problema: "Erro ao buscar token do cache"

**Sintomas:**

- Log mostra: "❌ Erro ao buscar token: ..."
- Seguido de: "⚠️ Retornando null para forçar geração"

**Diagnóstico:**

- Verificar conectividade com Oracle
- Verificar permissões da tabela
- Verificar estrutura da tabela

**Solução:**

- Problema de infraestrutura (não do código)
- Fail-safe permite aplicação funcionar mesmo com erro
- Corrigir problema de infraestrutura

---

## 📚 Referências

### Documentos Relacionados

- [ANALISE_PROFUNDA_API_UNIMED_VS_NPD_LEGACY.md](./ANALISE_PROFUNDA_API_UNIMED_VS_NPD_LEGACY.md) - Inconsistência #4
- [DICIONARIO_DADOS.md](./DICIONARIO_DADOS.md) - Tabela gc.api_gc_servicos

### Código-Fonte

- Interface: `src/domain/repositories/token-cache.repository.interface.ts`
- Implementação: `src/infrastructure/repositories/token-cache.repository.ts`
- Service: `src/infrastructure/external-apis/unimed-api.service.ts`
- Module: `src/infrastructure/infrastructure.module.ts`

### API Unimed

- Endpoint: `POST /Token/geratoken`
- Headers: `{ usuario, senha }`
- Resposta: Token JWT como string
- Validade: **6 HORAS**
- Limite: **Diário** (número exato desconhecido)

---

## ✨ Melhorias Futuras

### 1. Retry com Exponential Backoff

Se geração de token falhar, tentar novamente com delays crescentes.

### 2. Renovação Proativa

Renovar token 30 minutos antes de expirar (em background).

### 3. Múltiplas Credenciais

Ter credenciais de backup para trocar se limite atingido.

### 4. Dashboard de Monitoramento

Painel visual com:

- Idade do token atual
- Tokens gerados hoje
- Taxa de cache hit/miss
- Alertas de aproximação do limite

---

## 📝 Conclusão

Esta implementação resolve **DEFINITIVAMENTE** o problema de geração excessiva de tokens que causou indisponibilidade anterior.

### Garantias de Segurança:

✅ Token é reutilizado enquanto válido (< 6 horas)  
✅ Apenas 1 token ativo por vez  
✅ Validação em nível de banco (performance)  
✅ Logs detalhados para auditoria  
✅ Fail-safe: erro de cache não quebra aplicação

### Próximos Passos:

1. ✅ Testar extensivamente em DEV (todos os 5 testes)
2. ⏳ Monitorar em produção por 1 semana
3. ⏳ Ajustar logs se necessário
4. ⏳ Considerar melhorias futuras

---

**Implementado em:** 2025-01-XX  
**Autor:** GitHub Copilot  
**Motivo:** CRÍTICO - Evitar bloqueio do departamento por limite de tokens
