# 📦 IMPLEMENTAÇÃO - Listagem Dinâmica de Processos de Exportação

**Data:** 29 de Janeiro de 2026  
**Versão:** 2.0  
**Status:** ✅ Concluído

---

## 🎯 OBJETIVO

Implementar **listagem dinâmica de processos** para exportação, permitindo que o sistema se adapte automaticamente a novos processos sem necessidade de alterações no código.

### Filosofia do Projeto

✅ **Replicar NPD-Legacy exatamente**  
✅ **Flexibilidade** - Novos processos detectados automaticamente  
✅ **Auditoria** - Mostra última execução de cada processo  
✅ **Usabilidade** - Frontend terá modais de confirmação  
✅ **Rastreabilidade** - Sistema registra usuário, data e hora

---

## 📝 MUDANÇA DE ABORDAGEM

### ❌ ANTES: Código Hardcoded

```typescript
// ❌ Processo fixo no código
private readonly CODIGO_PROCESSO_UNIMED = '90000001';

// Usuário não escolhe, sistema usa sempre o mesmo
await this.exportacaoRepository.executarExportacao({
  codigoProcesso: this.CODIGO_PROCESSO_UNIMED,
  // ...
});
```

**Problemas:**

- ⚠️ Criar novo processo = alterar código
- ⚠️ Sem flexibilidade
- ⚠️ Não mostra última execução

### ✅ DEPOIS: Listagem Dinâmica (NPD-Legacy)

```typescript
// ✅ 1. Frontend busca processos disponíveis
GET /api/exportacao/processos?categoria=UNI&tipoDado=C&mesRef=1&anoRef=2026

// Resposta:
[
  {
    "codigo": "90000001",
    "descricao": "Exporta Unimed para Folha",
    "dataUltimaExecucao": "27/01/2026 15:31:05",
    "dias": 5  // Prazo após fechamento
  }
]

// ✅ 2. Usuário escolhe processo
// ✅ 3. Frontend envia código escolhido
POST /api/exportacao/totvs
{
  "codigoProcesso": "90000001",  // ✅ Dinâmico!
  "mesRef": 1,
  "anoRef": 2026,
  // ...
}
```

**Vantagens:**

- ✅ Novos processos aparecem automaticamente
- ✅ Mostra última execução (auditoria)
- ✅ Frontend pode avisar: "Já foi executado hoje às 15:31"
- ✅ Flexível sem alterar código

---

## 🏗️ ARQUITETURA IMPLEMENTADA

### 1. Entity: Processo

**Arquivo:** [processo.entity.ts](src/domain/entities/processo.entity.ts)

```typescript
export class Processo {
  constructor(
    public readonly codigo: string, // '90000001'
    public readonly categoria: string, // 'UNI'
    public readonly procedure: string, // Nome da procedure Oracle
    public readonly descricao: string, // 'Exporta Unimed para Folha'
    public readonly ordem: number, // Ordem de execução
    public readonly dias: number, // Prazo após fechamento
    public readonly usuario: string, // Criador
    public readonly tipoEmpresa: string, // 'T' = Todas
    public readonly tipoDado: string, // 'C' ou 'S'
    public readonly ativo: string, // 'S' ou 'N'
    public readonly dataUltimaExecucao?: Date | null, // ✅ Auditoria!
  ) {}
}
```

---

### 2. Repository Interface

**Arquivo:** [processo.repository.interface.ts](src/domain/repositories/processo.repository.interface.ts)

```typescript
export interface IProcessoRepository {
  /**
   * Busca processos disponíveis com última execução
   * Réplica do NPD-Legacy: carregaProcessosProcessa()
   */
  buscarProcessosDisponiveis(params: {
    categoria: string;
    tipoDado: string;
    mesRef: number;
    anoRef: number;
  }): Promise<Processo[]>;

  /**
   * Busca processo específico para validação
   */
  buscarPorCodigo(codigo: string): Promise<Processo | null>;
}
```

---

### 3. Repository Implementation

**Arquivo:** [processo.repository.ts](src/infrastructure/repositories/processo.repository.ts)

**Query Principal (Réplica Exata do NPD-Legacy):**

```typescript
const sql = `
  SELECT 
    a.codigo,
    a.categoria,
    a.procedure,
    a.descricao,
    a.ordem,
    a.dias,
    a.usuario,
    a.tipo_empresa,
    a.tipo_dado,
    a.ativo,
    (SELECT MAX(TO_CHAR(b.data_proc, 'DD/MM/YYYY HH24:MI:SS'))
     FROM gc.mcw_processo_log b
     WHERE b.mes_ref = :mesRef
       AND b.ano_ref = :anoRef
       AND b.categoria = :categoria
       AND b.codigo = a.codigo) AS data_proc  -- ✅ Última execução!
  FROM gc.mcw_processo a
  WHERE a.ativo = 'S'
    AND a.codigo NOT IN ('70000008', '70000009')  -- Processos internos
    AND a.categoria = :categoria
    AND a.tipo_dado = :tipoDado
  ORDER BY a.ordem_procedure
`;
```

**Conversão de Data Brasileira:**

```typescript
private parseDataBrasileira(dataStr: string): Date | null {
  try {
    // '27/01/2026 15:31:05' -> Date
    const [datePart, timePart] = dataStr.split(' ');
    const [dia, mes, ano] = datePart.split('/');
    const [hora, minuto, segundo] = timePart.split(':');

    return new Date(
      parseInt(ano),
      parseInt(mes) - 1,  // Mês é 0-indexed
      parseInt(dia),
      parseInt(hora),
      parseInt(minuto),
      parseInt(segundo),
    );
  } catch (error) {
    return null;
  }
}
```

---

### 4. DTOs

**Arquivo:** [listar-processos.dto.ts](src/application/dtos/exportacao/listar-processos.dto.ts)

**Request:**

```typescript
export class ListarProcessosDto {
  @IsString()
  categoria: string; // 'UNI'

  @IsString()
  tipoDado: string; // 'S' ou 'C'

  @IsInt()
  @Min(1)
  @Max(12)
  mesRef: number; // 1-12

  @IsInt()
  @Min(2000)
  anoRef: number; // 2026
}
```

**Response:**

```typescript
export class ProcessoResponseDto {
  codigo: string; // '90000001'
  descricao: string; // 'Exporta Unimed para Folha'
  dias: number; // 5 dias de prazo
  dataUltimaExecucao: string | null; // '27/01/2026 15:31:05' ou null
  // ... outros campos
}
```

---

### 5. Use Case: Listar Processos

**Arquivo:** [listar-processos.use-case.ts](src/application/use-cases/exportacao/listar-processos.use-case.ts)

```typescript
async execute(dto: ListarProcessosDto): Promise<ProcessoResponseDto[]> {
  const processos = await this.processoRepository.buscarProcessosDisponiveis({
    categoria: dto.categoria,
    tipoDado: dto.tipoDado,
    mesRef: dto.mesRef,
    anoRef: dto.anoRef,
  });

  return processos.map((processo) => ({
    codigo: processo.codigo,
    descricao: processo.descricao,
    dias: processo.dias,
    dataUltimaExecucao: processo.dataUltimaExecucao
      ? this.formatarDataBrasileira(processo.dataUltimaExecucao)
      : null,
    // ...
  }));
}
```

---

### 6. Use Case: Exportar (Modificado)

**Arquivo:** [exportar-para-totvs.use-case.ts](src/application/use-cases/exportacao/exportar-para-totvs.use-case.ts)

**Mudanças:**

```typescript
async execute(dto: ExportarParaTOTVSDto, ...): Promise<...> {
  // ✅ 1. Validar processo selecionado
  const processo = await this.processoRepository.buscarPorCodigo(
    dto.codigoProcesso,  // ✅ Agora vem do DTO!
  );

  if (!processo) {
    throw new NotFoundException(
      `Processo ${dto.codigoProcesso} não encontrado ou inativo`,
    );
  }

  // ✅ 2. Usar dias do processo selecionado (não hardcoded)
  const dataMaxima = new Date(dataFinal);
  dataMaxima.setDate(dataMaxima.getDate() + processo.dias);  // ✅ Dinâmico!

  // ✅ 3. Mensagens personalizadas
  this.logger.log(
    `Processo selecionado: ${processo.descricao} (${processo.codigo})`,
  );
}
```

---

### 7. DTO de Exportação (Modificado)

**Arquivo:** [exportar-para-totvs.dto.ts](src/application/dtos/exportacao/exportar-para-totvs.dto.ts)

```typescript
export class ExportarParaTOTVSDto {
  @IsInt()
  mesRef: number;

  @IsInt()
  anoRef: number;

  @IsString()
  codigoProcesso: string; // ✅ NOVO: Código do processo selecionado

  @IsString()
  @IsOptional()
  bandeira?: string;

  @IsString()
  @IsOptional()
  empresa?: string;

  // ... outros campos
}
```

---

### 8. Controller (Novo Endpoint)

**Arquivo:** [exportacao.controller.ts](src/presentation/controllers/exportacao.controller.ts)

```typescript
@Controller('exportacao')
export class ExportacaoController {
  constructor(
    private readonly exportarParaTOTVSUseCase: ExportarParaTOTVSUseCase,
    private readonly listarProcessosUseCase: ListarProcessosUseCase,  // ✅ NOVO
  ) {}

  /**
   * ✅ NOVO ENDPOINT: Listar processos disponíveis
   */
  @Get('processos')
  @Roles('DP', 'ADMIN')
  async listarProcessos(
    @Query() dto: ListarProcessosDto,
  ): Promise<ProcessoResponseDto[]> {
    return await this.listarProcessosUseCase.execute(dto);
  }

  /**
   * Executar exportação (modificado para aceitar codigoProcesso)
   */
  @Post('totvs')
  @Roles('DP', 'ADMIN')
  async exportarParaTOTVS(@Body() dto: ExportarParaTOTVSDto) {
    // dto.codigoProcesso agora é obrigatório
    return await this.exportarParaTOTVSUseCase.execute(dto, ...);
  }
}
```

---

## 🔄 FLUXO COMPLETO (Frontend → Backend)

### 1️⃣ Usuário Abre Tela de Exportação

```
Frontend carrega componente ExportacaoUnimed
↓
Mostra filtros: Mês, Ano, Bandeira/Empresa
```

### 2️⃣ Usuário Preenche Período

```
Usuário seleciona:
- Mês: Janeiro (1)
- Ano: 2026
- Tipo: Completo (C)

Frontend automaticamente faz:
↓
GET /api/exportacao/processos?categoria=UNI&tipoDado=C&mesRef=1&anoRef=2026
```

### 3️⃣ Backend Retorna Processos Disponíveis

```json
[
  {
    "codigo": "90000001",
    "categoria": "UNI",
    "descricao": "Exporta Unimed para Folha",
    "ordem": 1,
    "dias": 5,
    "dataUltimaExecucao": "27/01/2026 15:31:05"
  }
]
```

### 4️⃣ Frontend Exibe Select/Dropdown

```html
<select name="processo">
  <option value="90000001">
    Exporta Unimed para Folha (Última: 27/01/2026 15:31:05)
  </option>
</select>
```

### 5️⃣ Usuário Seleciona e Clica "Exportar"

```
Frontend abre modal de confirmação:
┌─────────────────────────────────────┐
│  ⚠️  Confirmar Exportação           │
├─────────────────────────────────────┤
│ Processo: Exporta Unimed para Folha │
│ Período: Janeiro/2026                │
│ Última execução: 27/01 às 15:31     │
│                                      │
│ ⚠️ Este processo já foi executado   │
│ recentemente. Deseja continuar?     │
│                                      │
│  [Cancelar]  [Sim, Exportar]        │
└─────────────────────────────────────┘
```

### 6️⃣ Frontend Envia Request

```javascript
POST /api/exportacao/totvs
{
  "codigoProcesso": "90000001",  // ✅ Código selecionado
  "mesRef": 1,
  "anoRef": 2026,
  "bandeira": "1",
  "previa": false,
  "apagar": false
}
```

### 7️⃣ Backend Valida e Executa

```
1. ✅ Valida se processo existe e está ativo
2. ✅ Valida permissões do usuário
3. ✅ Valida prazo (usando processo.dias)
4. ✅ Executa exportação
5. ✅ Registra log (usuário, data, hora)
6. ✅ Retorna sucesso
```

---

## 📊 COMPARAÇÃO: NPD-Legacy vs NestJS

| Aspecto                   | NPD-Legacy (PHP)                          | NestJS (TypeScript)             |
| ------------------------- | ----------------------------------------- | ------------------------------- |
| **Listagem de Processos** | ✅ carregaProcessosProcessa()             | ✅ buscarProcessosDisponiveis() |
| **Query**                 | ✅ SELECT com subquery de última execução | ✅ Idêntica                     |
| **Validação de Processo** | ❌ Não valida (confia no frontend)        | ✅ Valida antes de executar     |
| **Formato de Data**       | ✅ 'DD/MM/YYYY HH24:MI:SS'                | ✅ Idêntico                     |
| **Auditoria**             | ✅ Mostra última execução                 | ✅ Idêntico                     |
| **Flexibilidade**         | ✅ Novos processos automáticos            | ✅ Idêntico                     |
| **Tipagem**               | ❌ PHP dinâmico                           | ✅ TypeScript type-safe         |
| **Validações**            | ⚠️ No frontend                            | ✅ Backend + Frontend           |
| **Logs**                  | ⚠️ Básicos                                | ✅ Estruturados (Winston)       |
| **Prazo de Execução**     | ✅ Usa processo.dias                      | ✅ Idêntico                     |

---

## 🎯 BENEFÍCIOS DA IMPLEMENTAÇÃO

### 1. Flexibilidade

✅ **Novo processo?** Apenas INSERT na tabela `gc.mcw_processo`

```sql
INSERT INTO gc.mcw_processo (
  codigo, categoria, procedure, descricao, dias, ativo, tipo_dado
) VALUES (
  '90000002', 'UNI', 'P_NOVA_EXPORTACAO',
  'Nova Exportação Unimed', 3, 'S', 'C'
);
```

✅ Sistema detecta automaticamente  
✅ Aparece no dropdown do frontend  
✅ Zero alterações no código

### 2. Auditoria

✅ **Última execução visível**

- Frontend pode avisar: "Já executado hoje"
- Evita duplicações acidentais
- Rastreabilidade completa

### 3. Usabilidade

✅ **Informações claras**

- Usuário vê descrição amigável
- Prazo de execução visível
- Histórico disponível

### 4. Manutenibilidade

✅ **Código limpo**

- Sem hardcoded
- Única fonte de verdade (banco)
- Fácil de testar

### 5. Segurança

✅ **Validações robustas**

- Backend valida processo existe
- Backend valida processo está ativo
- Backend valida prazo de execução
- Backend registra quem executou

---

## 🧪 EXEMPLOS DE USO

### Exemplo 1: Listar Processos Disponíveis

**Request:**

```http
GET /api/exportacao/processos?categoria=UNI&tipoDado=C&mesRef=1&anoRef=2026
Authorization: Bearer {token}
```

**Response:**

```json
[
  {
    "codigo": "90000001",
    "categoria": "UNI",
    "procedure": "P_MCW_FECHA_COMISSAO_GLOBAL",
    "descricao": "Exporta Unimed para Folha",
    "ordem": 1,
    "dias": 5,
    "usuario": "SISTEMA",
    "tipoEmpresa": "T",
    "tipoDado": "C",
    "ativo": "S",
    "dataUltimaExecucao": "27/01/2026 15:31:05"
  }
]
```

### Exemplo 2: Executar Processo Selecionado

**Request:**

```http
POST /api/exportacao/totvs
Authorization: Bearer {token}
Content-Type: application/json

{
  "codigoProcesso": "90000001",
  "mesRef": 1,
  "anoRef": 2026,
  "bandeira": "1",
  "previa": false,
  "apagar": false
}
```

**Response:**

```json
{
  "sucesso": true,
  "mensagem": "EXPORTAÇÃO executada com sucesso para todas as 5 empresas da bandeira 1 no período 1/2026",
  "empresasProcessadas": 5,
  "timestamp": "2026-01-29T18:45:00.000Z"
}
```

### Exemplo 3: Processo Inválido

**Request:**

```http
POST /api/exportacao/totvs
{
  "codigoProcesso": "99999999",
  "mesRef": 1,
  "anoRef": 2026
}
```

**Response:**

```json
{
  "statusCode": 404,
  "message": "Processo 99999999 não encontrado ou inativo",
  "error": "Not Found"
}
```

---

## ✅ CHECKLIST DE IMPLEMENTAÇÃO

- [x] **Entity Processo** criada
- [x] **Interface IProcessoRepository** atualizada
- [x] **ProcessoRepository** implementado
- [x] **ListarProcessosDto** criado
- [x] **ProcessoResponseDto** criado
- [x] **ListarProcessosUseCase** criado
- [x] **ExportarParaTOTVSDto** modificado (+ codigoProcesso)
- [x] **ExportarParaTOTVSUseCase** modificado (valida processo)
- [x] **ExportacaoController** adicionado endpoint GET /processos
- [x] **ApplicationModule** registrado ListarProcessosUseCase
- [x] **InfrastructureModule** já tinha ProcessoRepository registrado
- [x] **Documentação** completa criada

---

## 🚀 PRÓXIMOS PASSOS

### 1. Frontend

- [ ] Criar componente de seleção de processo
- [ ] Implementar modal de confirmação
- [ ] Mostrar última execução
- [ ] Aviso visual se já foi executado recentemente

### 2. Testes

- [ ] Teste unitário: ListarProcessosUseCase
- [ ] Teste unitário: ExportarParaTOTVSUseCase (com processo dinâmico)
- [ ] Teste de integração: GET /processos
- [ ] Teste de integração: POST /totvs (validação de processo)
- [ ] Teste E2E: Fluxo completo

### 3. Melhorias Futuras

- [ ] Cache de processos (atualizar a cada 5 min)
- [ ] Notificação se processo demorar muito
- [ ] Dashboard de execuções por processo
- [ ] Comparação: execução atual vs anterior

---

## 📚 REFERÊNCIAS

- [NPD-Legacy: UnimedController.php](npd-legacy/com/modules/uni/controller/UnimedController.php) - case 'Buscarprocesso'
- [NPD-Legacy: UnimedDAO.php](npd-legacy/com/modules/uni/model/UnimedDAO.php) - carregaProcessosProcessa()
- [ANALISE_EXPORTACAO_NPD_LEGACY.md](ANALISE_EXPORTACAO_NPD_LEGACY.md) - Análise completa do fluxo
- [IMPLEMENTACAO_FILTROS_CASCATA_EXPORTACAO.md](IMPLEMENTACAO_FILTROS_CASCATA_EXPORTACAO.md) - Filtros em cascata

---

**Última Atualização:** 29/01/2026 19:00  
**Implementado por:** GitHub Copilot  
**Status:** ✅ Implementação Completa - Pronto para Testes
