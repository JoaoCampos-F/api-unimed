# ✅ CHECKLIST DE IMPLEMENTAÇÃO - API UNIMED

## 📋 Como Usar Este Checklist

Marque cada item conforme você completa. Copie este arquivo para `CHECKLIST_PROGRESSO.md` para acompanhar seu progresso pessoal.

---

## 🎯 FASE 1: CONFIGURAÇÃO BASE (Dias 1-2)

### Dia 1 - Setup Inicial

- [ ] **1.1 Instalar Dependências**
  - [ ] Executar `pnpm install`
  - [ ] Instalar dependências principais (`@nestjs/config`, `oracledb`, etc)
  - [ ] Instalar dependências de desenvolvimento
  - [ ] Verificar `package.json` atualizado

- [ ] **1.2 Oracle Instant Client**
  - [ ] Baixar Oracle Instant Client
  - [ ] Extrair para `C:\oracle\instantclient_21_12`
  - [ ] Adicionar ao PATH do Windows
  - [ ] Reiniciar terminal/VSCode
  - [ ] Testar comando `sqlplus` (opcional)

- [ ] **1.3 Configurar .env**
  - [ ] Criar arquivo `.env`
  - [ ] Configurar variáveis de banco de dados
  - [ ] Configurar variáveis da API Unimed
  - [ ] Configurar JWT secret
  - [ ] Testar conexão manual com banco

### Dia 2 - Estrutura Base

- [ ] **2.1 Criar Estrutura de Diretórios**
  - [ ] `src/database/`
  - [ ] `src/config/`
  - [ ] `src/modules/unimed/`
  - [ ] `src/modules/unimed/controllers/`
  - [ ] `src/modules/unimed/services/`
  - [ ] `src/modules/unimed/dto/`
  - [ ] `src/modules/unimed/entities/`
  - [ ] `src/modules/unimed/interfaces/`

- [ ] **2.2 Implementar DatabaseService**
  - [ ] Criar `database.service.ts`
  - [ ] Implementar `executeQuery()`
  - [ ] Implementar `executeMany()`
  - [ ] Implementar `executeProcedure()`
  - [ ] Implementar gerenciamento de pool
  - [ ] Adicionar logs

- [ ] **2.3 Implementar DatabaseModule**
  - [ ] Criar `database.module.ts`
  - [ ] Marcar como `@Global()`
  - [ ] Exportar DatabaseService

- [ ] **2.4 Atualizar AppModule**
  - [ ] Importar `ConfigModule.forRoot()`
  - [ ] Importar `DatabaseModule`
  - [ ] Configurar como global

- [ ] **2.5 Atualizar main.ts**
  - [ ] Configurar `ValidationPipe` global
  - [ ] Configurar prefixo da API
  - [ ] Configurar CORS
  - [ ] Adicionar logs de inicialização

- [ ] **2.6 Testes Iniciais**
  - [ ] Endpoint `/health` funcionando
  - [ ] Conexão com Oracle OK
  - [ ] Query de teste executando
  - [ ] Logs aparecendo corretamente

---

## 🎯 FASE 2: MÓDULO UNIMED - IMPORTAÇÃO (Dias 3-7)

### Dia 3 - DTOs e Interfaces

- [ ] **3.1 Criar DTOs**
  - [ ] `import-unimed.dto.ts`
  - [ ] `busca-colaborador.dto.ts`
  - [ ] `update-colaborador.dto.ts`
  - [ ] Adicionar validações com decorators
  - [ ] Testar validações

- [ ] **3.2 Criar Entities/Interfaces**
  - [ ] `uni-dados-cobranca.entity.ts`
  - [ ] `uni-resumo-colaborador.entity.ts`
  - [ ] `unimed-api-response.interface.ts`
  - [ ] Documentar propriedades

### Dia 4 - Integração API Unimed

- [ ] **4.1 Implementar UnimedApiService**
  - [ ] Criar `unimed-api.service.ts`
  - [ ] Implementar `getToken()`
  - [ ] Implementar `buscarPorPeriodoCnpj()`
  - [ ] Implementar `buscarPorPeriodoContrato()`
  - [ ] Adicionar tratamento de erros
  - [ ] Adicionar renovação automática de token
  - [ ] Adicionar logs

- [ ] **4.2 Testar API Unimed**
  - [ ] Testar geração de token
  - [ ] Testar busca por CNPJ
  - [ ] Testar busca por Contrato
  - [ ] Validar estrutura de resposta

### Dia 5-6 - Service de Importação

- [ ] **5.1 Implementar UnimedImportService - Parte 1**
  - [ ] Criar `unimed-import.service.ts`
  - [ ] Implementar `buscarEmpresasUnimed()`
  - [ ] Implementar `limparDadosImportacao()`
  - [ ] Implementar `removerAcentos()`
  - [ ] Implementar `calcularMesRef()`
  - [ ] Implementar `calcularAnoRef()`

- [ ] **5.2 Implementar UnimedImportService - Parte 2**
  - [ ] Implementar `importarPorCnpj()` completo
  - [ ] Implementar `inserirDadosCobranca()`
  - [ ] Implementar `importarPorContrato()`
  - [ ] Implementar `executarResumo()`
  - [ ] Adicionar logs detalhados
  - [ ] Adicionar tratamento de erros

- [ ] **5.3 Testar Importação**
  - [ ] Testar importação por CNPJ
  - [ ] Verificar dados no banco
  - [ ] Testar importação por Contrato
  - [ ] Testar execução de procedure
  - [ ] Validar dados importados

### Dia 7 - Controllers e Rotas

- [ ] **7.1 Criar Controllers**
  - [ ] `unimed-import.controller.ts`
  - [ ] Implementar rota POST `/import/cnpj`
  - [ ] Implementar rota POST `/import/contrato`
  - [ ] Implementar rota POST `/import/resumo`
  - [ ] Adicionar validação de DTOs

- [ ] **7.2 Criar UnimedModule**
  - [ ] Criar `unimed.module.ts`
  - [ ] Registrar Controllers
  - [ ] Registrar Services
  - [ ] Configurar imports/exports

- [ ] **7.3 Registrar no AppModule**
  - [ ] Importar `UnimedModule`
  - [ ] Testar rotas com Postman/Thunder Client

---

## 🎯 FASE 3: COLABORADORES (Dias 8-10)

### Dia 8 - Service de Colaboradores

- [ ] **8.1 Criar UnimedColaboradorService**
  - [ ] Criar `unimed-colaborador.service.ts`
  - [ ] Implementar `buscarColaboradores()`
  - [ ] Implementar `buscarPorCpf()`
  - [ ] Implementar filtros (empresa, mês, ano, etc)
  - [ ] Formatar resposta para DataTables

- [ ] **8.2 Implementar Atualizações**
  - [ ] Implementar `atualizarColaborador()`
  - [ ] Implementar `atualizarTodosColaboradores()`
  - [ ] Implementar `atualizarValorEmpresa()`
  - [ ] Adicionar validações

### Dia 9 - Controllers de Colaboradores

- [ ] **9.1 Criar Controller**
  - [ ] `unimed-colaborador.controller.ts`
  - [ ] Rota GET `/colaboradores`
  - [ ] Rota GET `/colaboradores/:cpf`
  - [ ] Rota PATCH `/colaboradores/:cpf`
  - [ ] Rota PATCH `/colaboradores/empresa/:sigla`
  - [ ] Rota PATCH `/valores/empresa/:sigla`

- [ ] **9.2 Testes**
  - [ ] Testar listagem com filtros
  - [ ] Testar busca por CPF
  - [ ] Testar atualização individual
  - [ ] Testar atualização em massa
  - [ ] Validar queries no banco

### Dia 10 - Refinamento

- [ ] **10.1 Otimizações**
  - [ ] Adicionar paginação
  - [ ] Adicionar ordenação
  - [ ] Otimizar queries
  - [ ] Cache se necessário

- [ ] **10.2 Documentação**
  - [ ] Documentar endpoints
  - [ ] Adicionar exemplos de uso
  - [ ] Atualizar MAPEAMENTO_ENDPOINTS.md

---

## 🎯 FASE 4: PROCESSOS (Dias 11-12)

### Dia 11 - Service de Processos

- [ ] **11.1 Criar UnimedProcessoService**
  - [ ] Criar `unimed-processo.service.ts`
  - [ ] Implementar `listarProcessos()`
  - [ ] Implementar `buscarHistorico()`
  - [ ] Implementar `buscarHistoricoDetalhado()`
  - [ ] Implementar `validarPeriodoFechamento()`

- [ ] **11.2 Implementar Execução**
  - [ ] Implementar `executarProcessos()`
  - [ ] Implementar chamada à procedure global
  - [ ] Implementar validação de prazos
  - [ ] Implementar registro de logs

### Dia 12 - Controllers de Processos

- [ ] **12.1 Criar Controller**
  - [ ] `unimed-processo.controller.ts`
  - [ ] Rota GET `/processos`
  - [ ] Rota POST `/processos/executar`
  - [ ] Rota GET `/processos/historico`
  - [ ] Rota GET `/processos/:codigo/historico`

- [ ] **12.2 Testes Completos**
  - [ ] Testar listagem de processos
  - [ ] Testar execução com validação
  - [ ] Testar histórico
  - [ ] Validar logs no banco

---

## 🎯 FASE 5: EXPORTAÇÃO (Dias 13-14)

### Dia 13 - Exportação Totvs

- [ ] **13.1 Implementar Exportação**
  - [ ] Criar service de exportação
  - [ ] Implementar lógica de exportação
  - [ ] Implementar validações
  - [ ] Implementar geração de arquivo/dados

- [ ] **13.2 DIRF**
  - [ ] Implementar geração de dados DIRF
  - [ ] Validar formato
  - [ ] Testar com dados reais

### Dia 14 - Controllers de Exportação

- [ ] **14.1 Criar Controllers**
  - [ ] Rota POST `/exportacao/totvs`
  - [ ] Rota POST `/dirf`
  - [ ] Adicionar validações
  - [ ] Testar endpoints

---

## 🎯 FASE 6: RELATÓRIOS (Dias 15-16)

### Dia 15 - Integração JasperReports

- [ ] **15.1 Configurar JasperReports**
  - [ ] Instalar dependências necessárias
  - [ ] Configurar conexão com banco
  - [ ] Testar geração de PDF

- [ ] **15.2 Implementar Service**
  - [ ] Criar `relatorios.service.ts`
  - [ ] Implementar métodos para cada relatório
  - [ ] Adicionar parâmetros dinâmicos

### Dia 16 - Controllers de Relatórios

- [ ] **16.1 Criar Controller**
  - [ ] `relatorios.controller.ts`
  - [ ] Implementar todas as rotas GET
  - [ ] Adicionar validações de parâmetros
  - [ ] Testar geração de PDFs

---

## 🎯 FASE 7: FINALIZAÇÃO (Dias 17-18)

### Dia 17 - Autenticação e Segurança

- [ ] **17.1 Implementar JWT**
  - [ ] Criar módulo de autenticação
  - [ ] Implementar estratégia JWT
  - [ ] Criar guards
  - [ ] Proteger rotas

- [ ] **17.2 Documentação Swagger**
  - [ ] Instalar `@nestjs/swagger`
  - [ ] Adicionar decorators nos controllers
  - [ ] Configurar Swagger no main.ts
  - [ ] Testar documentação gerada

### Dia 18 - Testes e Deploy

- [ ] **18.1 Testes E2E**
  - [ ] Escrever testes principais
  - [ ] Executar suite de testes
  - [ ] Corrigir falhas

- [ ] **18.2 Preparar Deploy**
  - [ ] Configurar variáveis de produção
  - [ ] Build de produção
  - [ ] Testar build
  - [ ] Documentar processo de deploy

---

## 🎉 CONCLUSÃO

- [ ] **Validação Final**
  - [ ] Todas as funcionalidades testadas
  - [ ] Documentação completa
  - [ ] Performance validada
  - [ ] Segurança verificada

- [ ] **Entrega**
  - [ ] Demonstração para stakeholders
  - [ ] Treinamento de usuários
  - [ ] Documentação entregue
  - [ ] Suporte pós-implementação acordado

---

## 📊 Progresso Geral

```
Total de Tarefas: ~150
Concluídas: 0
Em Andamento: 0
Pendentes: 150

Progresso: [░░░░░░░░░░] 0%
```

---

## 🏆 Conquistas Desbloqueadas

- [ ] 🎯 **Primeira Conexão** - Conectou com Oracle
- [ ] 🚀 **Hello API** - Primeiro endpoint funcionando
- [ ] 📥 **Importador** - Importou dados da Unimed
- [ ] 👥 **Gerente** - CRUD de colaboradores completo
- [ ] ⚙️ **Processador** - Executou processos de fechamento
- [ ] 📊 **Relator** - Gerou primeiro PDF
- [ ] 🔐 **Guardião** - Implementou autenticação
- [ ] 📚 **Documentador** - Documentação completa
- [ ] 🏁 **Finalizador** - Projeto 100% completo!

---

## 📝 Notas Pessoais

Use este espaço para anotar observações, dúvidas ou desafios encontrados:

```
Data: ___/___/___
Nota:


Data: ___/___/___
Nota:


Data: ___/___/___
Nota:


```

---

**Dica:** Atualize este checklist diariamente e comemore cada conquista! 🎉
