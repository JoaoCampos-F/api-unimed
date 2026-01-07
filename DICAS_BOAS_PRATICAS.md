# 💡 DICAS E BOAS PRÁTICAS - API UNIMED

## 🎯 Dicas Gerais de Desenvolvimento

### 1. Organização do Trabalho

#### ✅ FAÇA

- Trabalhe em pequenos incrementos
- Teste cada funcionalidade individualmente antes de avançar
- Faça commits frequentes com mensagens descritivas
- Mantenha o checklist atualizado
- Documente decisões importantes

#### ❌ NÃO FAÇA

- Tentar implementar tudo de uma vez
- Pular testes para "ir mais rápido"
- Copiar código sem entender o que faz
- Ignorar erros "pequenos"
- Deixar documentação para depois

### 2. Fluxo de Desenvolvimento Recomendado

```
1. Leia a documentação da funcionalidade
   ↓
2. Entenda o código PHP original
   ↓
3. Desenhe a arquitetura no papel
   ↓
4. Implemente o código NestJS
   ↓
5. Teste localmente
   ↓
6. Valide no banco de dados
   ↓
7. Documente o que foi feito
   ↓
8. Commit e próxima funcionalidade
```

---

## 🔧 Dicas de Configuração

### Oracle Instant Client

**Problema Comum:** `DPI-1047: Cannot locate Oracle Client`

**Solução:**

```bash
# 1. Verifique se está no PATH
echo %PATH%

# 2. Se não estiver, adicione:
# Windows: Painel de Controle → Sistema → Variáveis de Ambiente
# Adicionar: C:\oracle\instantclient_21_12

# 3. Reinicie o terminal E o VSCode

# 4. Teste
node -e "console.log(require('oracledb').oracleClientVersion)"
```

### Variáveis de Ambiente

**Dica:** Crie múltiplos arquivos .env

```bash
.env                 # Desenvolvimento local
.env.development     # Desenvolvimento
.env.staging         # Homologação
.env.production      # Produção
```

**No código:**

```typescript
// Carregar arquivo específico
ConfigModule.forRoot({
  envFilePath: `.env.${process.env.NODE_ENV}`,
});
```

---

## 📝 Dicas de Código

### 1. Services - Lógica de Negócio

#### ✅ BOM

```typescript
@Injectable()
export class UnimedImportService {
  private readonly logger = new Logger(UnimedImportService.name);

  async importarPorCnpj(dto: ImportUnimedDto) {
    try {
      this.logger.log(`Iniciando importação para ${dto.mes}/${dto.ano}`);

      // Lógica aqui

      return { result: true, msg: 'Sucesso' };
    } catch (error) {
      this.logger.error(`Erro na importação: ${error.message}`);
      throw new HttpException(
        'Erro ao importar dados',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
```

#### ❌ RUIM

```typescript
async importarPorCnpj(mes, ano) {
  // Sem logs
  // Sem tratamento de erro
  // Sem tipagem
  const result = await this.api.buscar(mes, ano);
  return result;
}
```

### 2. Controllers - Camada de Apresentação

#### ✅ BOM

```typescript
@Controller('unimed/import')
export class UnimedImportController {
  constructor(private readonly importService: UnimedImportService) {}

  @Post('cnpj')
  @HttpCode(HttpStatus.OK)
  async importarPorCnpj(@Body() dto: ImportUnimedDto) {
    return this.importService.importarPorCnpj(dto);
  }
}
```

#### ❌ RUIM

```typescript
@Controller('unimed')
export class UnimedController {
  @Post('import')
  async import(@Body() data: any) {
    // 'any' = sem validação
    // Lógica de negócio no controller (ERRADO!)
    const result = await db.query('SELECT * FROM ...');
    return result;
  }
}
```

### 3. DTOs - Validação de Dados

#### ✅ BOM

```typescript
export class ImportUnimedDto {
  @IsNumberString({}, { message: 'Mês deve ser um número' })
  @IsNotEmpty({ message: 'Mês é obrigatório' })
  @Length(1, 2, { message: 'Mês deve ter 1 ou 2 dígitos' })
  mes: string;

  @IsNumberString({}, { message: 'Ano deve ser um número' })
  @IsNotEmpty({ message: 'Ano é obrigatório' })
  @Length(4, 4, { message: 'Ano deve ter 4 dígitos' })
  ano: string;
}
```

#### ❌ RUIM

```typescript
export class ImportDto {
  mes: any;
  ano: any;
}
```

### 4. Queries Oracle - SQL Seguro

#### ✅ BOM - Bind Variables

```typescript
const sql = `
  SELECT * FROM gc.uni_dados_cobranca
  WHERE cod_empresa = :codEmpresa
    AND mes_ref = :mes
    AND ano_ref = :ano
`;

const binds = {
  codEmpresa: empresa,
  mes: dto.mes,
  ano: dto.ano,
};

const result = await this.db.executeQuery(sql, binds);
```

#### ❌ RUIM - SQL Injection

```typescript
const sql = `
  SELECT * FROM gc.uni_dados_cobranca
  WHERE cod_empresa = ${empresa}
    AND mes_ref = '${dto.mes}'
`;
```

### 5. Logs - Rastreabilidade

#### ✅ BOM

```typescript
this.logger.log(`📥 Iniciando importação - Período: ${periodo}`);
this.logger.log(`✅ ${empresas.length} empresa(s) encontrada(s)`);
this.logger.warn(`⚠️ Empresa ${cod} não possui CNPJ cadastrado`);
this.logger.error(`❌ Erro ao processar: ${error.message}`, error.stack);
```

#### ❌ RUIM

```typescript
console.log('iniciando'); // Sem contexto
console.log(error); // Sem mensagem clara
```

---

## 🗄️ Dicas de Banco de Dados Oracle

### 1. Pool de Conexões

#### ✅ Configuração Recomendada

```typescript
poolMin: 2,          // Mínimo de conexões sempre abertas
poolMax: 10,         // Máximo de conexões simultâneas
poolIncrement: 2,    // Incremento quando pool está cheio
queueTimeout: 60000, // Timeout na fila (60s)
```

### 2. Executar Procedures

#### ✅ BOM

```typescript
const plsql = `
  BEGIN
    gc.PKG_UNI_SAUDE.p_uni_resumo(:mes_ref, :ano_ref);
  END;
`;

const binds = {
  mes_ref: { dir: oracledb.BIND_IN, val: mes },
  ano_ref: { dir: oracledb.BIND_IN, val: ano },
};

await this.db.executeProcedure(plsql, binds);
```

### 3. Tratar Datas Oracle

#### ✅ Conversões Corretas

```typescript
// Inserir data
TO_DATE('25/12/2024', 'DD/MM/YYYY');

// Converter para string
TO_CHAR(data_campo, 'DD/MM/YYYY');
TO_CHAR(data_campo, 'DD/MM/YYYY HH24:MI:SS');

// Data atual
SYSDATE;
```

### 4. Performance - ROWNUM

#### ✅ Limitar Resultados

```typescript
const sql = `
  SELECT * FROM (
    SELECT a.*, ROWNUM rnum
    FROM gc.uni_dados_cobranca a
    WHERE mes_ref = :mes
  )
  WHERE rnum <= 100
`;
```

---

## 🔐 Dicas de Segurança

### 1. Variáveis Sensíveis

#### ✅ SEMPRE no .env

```env
DB_PASSWORD=senha_forte_aqui
JWT_SECRET=token_super_secreto
UNIMED_API_PASSWORD=senha_api
```

#### ❌ NUNCA no código

```typescript
// NUNCA FAÇA ISSO:
const password = 'minha_senha';
const dbConfig = {
  password: 'senha123',
};
```

### 2. Validação de Entrada

#### ✅ Sempre valide

```typescript
@Post('import')
async import(@Body() dto: ImportUnimedDto) {
  // DTO já valida automaticamente com class-validator
  return this.service.import(dto);
}
```

### 3. Tratamento de Erros

#### ✅ Não exponha detalhes internos

```typescript
catch (error) {
  this.logger.error(`Erro interno: ${error.message}`, error.stack);

  // Para o usuário, mensagem genérica:
  throw new HttpException(
    'Erro ao processar solicitação',
    HttpStatus.INTERNAL_SERVER_ERROR,
  );
}
```

---

## 🧪 Dicas de Testes

### 1. Teste Incremental

```bash
# 1. Teste conexão
GET /health

# 2. Teste query simples
GET /test-empresas

# 3. Teste funcionalidade básica
POST /unimed/import/cnpj

# 4. Teste casos de erro
POST /unimed/import/cnpj (com dados inválidos)

# 5. Valide no banco
SELECT * FROM gc.uni_dados_cobranca WHERE mes_import = '12'
```

### 2. Thunder Client (VSCode)

**Dica:** Crie uma coleção de requisições

```json
{
  "name": "API Unimed",
  "requests": [
    {
      "name": "Health Check",
      "method": "GET",
      "url": "{{baseUrl}}/health"
    },
    {
      "name": "Importar CNPJ",
      "method": "POST",
      "url": "{{baseUrl}}/unimed/import/cnpj",
      "body": {
        "mes": "12",
        "ano": "2024"
      }
    }
  ]
}
```

---

## 📊 Dicas de Performance

### 1. Batch Inserts

#### ✅ Use executeMany

```typescript
const binds = [
  { col1: 'valor1', col2: 'valor2' },
  { col1: 'valor3', col2: 'valor4' },
  // ... mais registros
];

await this.db.executeMany(sql, binds); // Muito mais rápido!
```

#### ❌ Evite loops de insert

```typescript
for (const item of items) {
  await this.db.executeQuery(sql, item); // LENTO!
}
```

### 2. Índices no Banco

```sql
-- Certifique-se de que existem índices nas colunas de busca
CREATE INDEX idx_uni_cpf ON gc.uni_dados_cobranca(cpf);
CREATE INDEX idx_uni_periodo ON gc.uni_dados_cobranca(mes_ref, ano_ref);
```

---

## 🐛 Debugging

### 1. Logs Estruturados

```typescript
this.logger.debug('Dados recebidos', { dto });
this.logger.log('Processando empresa', { codEmpresa, sigla });
this.logger.warn('Nenhum dado encontrado', { periodo });
this.logger.error('Erro crítico', { error: error.message, stack: error.stack });
```

### 2. VSCode Debug

**Arquivo:** `.vscode/launch.json`

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Debug NestJS",
      "runtimeExecutable": "pnpm",
      "runtimeArgs": ["start:debug"],
      "port": 9229,
      "restart": true,
      "console": "integratedTerminal"
    }
  ]
}
```

### 3. SQL Developer / SQL\*Plus

**Testar queries diretamente:**

```sql
-- Conectar
sqlplus usuario/senha@host:1521/service

-- Testar query
SELECT COUNT(*) FROM gc.uni_dados_cobranca WHERE mes_import = '12';

-- Ver erros
SHOW ERRORS;
```

---

## 📚 Recursos Úteis

### Documentação

- **NestJS:** https://docs.nestjs.com
- **TypeScript:** https://www.typescriptlang.org/docs
- **node-oracledb:** https://node-oracledb.readthedocs.io
- **class-validator:** https://github.com/typestack/class-validator

### Ferramentas

- **Thunder Client:** Extensão VSCode para testes de API
- **Oracle SQL Developer:** Cliente visual para Oracle
- **Postman:** Alternativa para testes de API
- **DBeaver:** Cliente universal de banco de dados

---

## ⚠️ Erros Comuns e Soluções

### 1. Erro: Cannot find module 'oracledb'

**Solução:**

```bash
pnpm install oracledb
# Se der erro de compilação:
pnpm install --force
```

### 2. Erro: ORA-01017: invalid username/password

**Solução:**

- Verifique credenciais no .env
- Teste conexão com SQL\*Plus
- Verifique se usuário tem permissões

### 3. Erro: Validation failed

**Solução:**

- Verifique DTOs
- Confira formato dos dados enviados
- Leia mensagem de erro (ela diz qual campo está errado)

### 4. Erro: Connection pool timeout

**Solução:**

- Aumente `poolMax` e `queueTimeout`
- Verifique se conexões estão sendo fechadas
- Cheque queries lentas

---

## 🎯 Checklist de Qualidade

Antes de considerar uma funcionalidade "pronta":

- [ ] Código implementado e funcionando
- [ ] Testes manuais realizados
- [ ] Validações de entrada implementadas
- [ ] Tratamento de erros adequado
- [ ] Logs informativos adicionados
- [ ] Documentação atualizada
- [ ] Commit com mensagem descritiva
- [ ] Performance validada
- [ ] Segurança verificada
- [ ] Code review (auto-revisão)

---

## 💬 Mensagens de Commit

### ✅ BOAS

```
feat: adiciona endpoint de importação por CNPJ
fix: corrige erro ao calcular mês de referência
refactor: melhora tratamento de erros no import service
docs: atualiza guia de implementação
test: adiciona testes para colaborador service
```

### ❌ RUINS

```
Update
fix
changes
teste
wip
```

---

## 🎓 Aprendendo com os Erros

### Mantenha um "Diário de Erros"

```markdown
## 2024-12-15

### Erro

Conexão com Oracle falhando

### Causa

Oracle Instant Client não estava no PATH

### Solução

1. Adicionei C:\oracle\instantclient_21_12 ao PATH
2. Reiniciei VSCode
3. Funcionou!

### Aprendizado

Sempre verificar variáveis de ambiente após instalar dependências nativas
```

---

## 🚀 Próximos Passos Após Conclusão

1. **Otimização de Performance**
   - Profiling de queries
   - Cache de dados frequentes
   - Lazy loading quando apropriado

2. **Monitoramento**
   - Logs centralizados (Winston, ELK)
   - Métricas (Prometheus)
   - Health checks avançados

3. **CI/CD**
   - Pipeline de build
   - Testes automatizados
   - Deploy automatizado

4. **Documentação Avançada**
   - Swagger/OpenAPI completo
   - Diagramas de arquitetura
   - Manual do usuário

---

**Lembre-se:** Código bom é código que você consegue explicar! 💡

**Boa sorte na implementação! 🚀**
