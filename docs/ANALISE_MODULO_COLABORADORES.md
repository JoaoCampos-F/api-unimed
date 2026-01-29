# 👥 ANÁLISE COMPLETA - MÓDULO COLABORADORES UNIMED

**Data:** 21 de Janeiro de 2026  
**Versão:** 1.0  
**Status:** Análise para implementação do zero  
**Prioridade:** 🔴 CRÍTICA - Bloqueador para produção

---

## 📋 ÍNDICE

1. [Visão Geral](#visão-geral)
2. [Análise do Legacy (PHP)](#análise-do-legacy-php)
3. [Estado Atual no NestJS](#estado-atual-no-nestjs)
4. [Especificação de Implementação](#especificação-de-implementação)
5. [Plano de Implementação](#plano-de-implementação)
6. [Estimativas e Prioridades](#estimativas-e-prioridades)

---

## 🎯 VISÃO GERAL

### O Que É o Módulo de Colaboradores?

O módulo de colaboradores gerencia os **dados consolidados** dos beneficiários Unimed após a importação, permitindo:

1. **Consultar** colaboradores com filtros (empresa, CPF, mês, ano)
2. **Marcar/desmarcar** colaboradores individuais para exportação/pagamento (flag `EXPORTA`)
3. **Atualizar em massa** todos colaboradores de uma empresa/período
4. **Configurar** percentual que a empresa paga pela Unimed (campo `UNIMED` na tabela `nbs.mcw_colaborador`)

### 📊 Status Atual

| Componente           | Legacy PHP       | NestJS       | Gap  |
| -------------------- | ---------------- | ------------ | ---- |
| **Endpoints**        | 4 actions        | 0 endpoints  | 100% |
| **DTOs**             | N/A              | 0 criados    | 100% |
| **Use Cases**        | 4 métodos DAO    | 0 use cases  | 100% |
| **Repository**       | UnimedDAO        | 0 repository | 100% |
| **Controller**       | UnimedController | 0 controller | 100% |
| **Entity/Interface** | N/A              | 0 entities   | 100% |

**Conclusão:** Módulo 0% implementado. Precisa ser criado do zero.

---

## 🔍 ANÁLISE DO LEGACY (PHP)

### 1. 📂 Arquitetura Atual

**Arquivo Principal:** `npd-legacy/com/modules/uni/controller/UnimedController.php`  
**DAO:** `npd-legacy/com/modules/uni/model/UnimedDAO.php`

### 2. 🔌 Endpoints Identificados

#### **2.1. Buscar Colaboradores (GET/POST)**

**Action:** `case 'Buscar'`  
**Linha:** 259-348 (UnimedController.php)  
**Método DAO:** Query direto no controller

**Request:**

```php
GET/POST ?acao=Buscar
  &busca_empresa=SIGLA_EMPRESA    // Obrigatório
  &busca_usuario=CPF              // Opcional - filtra por CPF
  &busca_mes=01                   // Opcional - filtro mês
  &busca_ano=2026                 // Opcional - filtro ano
  &departamento=DEPT-BAND         // Opcional - não usado na query
  &funcao=FUNC-BAND              // Opcional - não usado na query
```

**SQL Executada:**

```sql
SELECT *
FROM gc.vw_uni_resumo_colaborador a
WHERE 1=1
  AND a.cod_empresa = {getCodEmpresa()}
  AND a.codcoligada = {getCodColigada()}
  AND a.mes_ref = '01'              -- se informado
  AND a.ano_ref = '2026'            -- se informado
  AND ltrim(a.codigo_cpf,'0000') = ltrim('12345678901','0000')  -- se informado
ORDER BY a.cod_band, a.apelido, a.colaborador
```

**Response:**

```json
{
  "recordsTotal": 150,
  "recordsFiltered": 150,
  "data": [
    [
      "EMPRESA_X", // APELIDO
      "JOAO DA SILVA", // COLABORADOR (sem acentos)
      "<a class='btn btn-info'>Ativo</a>", // Botão status ATIVO
      "01", // MES_REF
      "2026", // ANO_REF
      "R$ 120.50", // M_TITULAR
      "R$ 80.30", // M_DEPENDENTE
      "R$ 200.80", // VALOR_CONSUMO
      "R$ 150.60", // PERC_EMPRESA (valor que empresa paga)
      "R$ 350.00", // VALOR_TOTAL
      "R$ 199.40", // VALOR_LIQUIDO (desc. colaborador)
      "<a id='_bt1' onclick='atualizaColaborador(...)' class='btn btn-info'><i class='fa fa-thumbs-up'></i></a>" // Botão EXPORTA
    ]
    // ... mais registros
  ]
}
```

**Campos da View `gc.vw_uni_resumo_colaborador`:**

- `COD_EMPRESA`, `CODCOLIGADA`, `CODFILIAL`, `COD_BAND`
- `CODIGO_CPF` - CPF do colaborador
- `COLABORADOR` - Nome completo
- `APELIDO` - Sigla/apelido da empresa
- `MES_REF`, `ANO_REF` - Período de referência
- `M_TITULAR` - Valor mensalidade titular (numeric)
- `M_DEPENDENTE` - Valor mensalidade dependentes (numeric)
- `VALOR_CONSUMO` - Total consumido (numeric)
- `PERC_EMPRESA` - Valor pago pela empresa (numeric)
- `VALOR_TOTAL` - Soma geral (numeric)
- `VALOR_LIQUIDO` - Valor descontado do colaborador (numeric)
- `EXPORTA` - Flag 'S' ou 'N' (se será enviado para pagamento)
- `ATIVO` - Flag 'S' ou 'N' (se colaborador está ativo)

**Observações:**

- Frontend usa DataTables para paginação/ordenação
- Botões são renderizados no backend com JavaScript inline
- Verifica permissão `isAcesso(78003,$User)` para exibir botão de atualização
- Remove acentos com `_retirarAcentos()` e converte para UTF-8

---

#### **2.2. Atualizar Colaborador Individual (POST)**

**Action:** `case 'update'`  
**Linha:** 352-357 (UnimedController.php)  
**Método DAO:** `updateColaborador($exporta, $cpf, $mes, $ano)`  
**Linha DAO:** 300-323 (UnimedDAO.php)

**Request:**

```php
POST ?acao=update
  busca_usuario=12345678901    // CPF do colaborador
  busca_mes=01                 // Mês de referência
  busca_ano=2026               // Ano de referência
  ckeckbox=N                   // Novo valor: 'S' ou 'N'
```

**SQL Executada:**

```sql
UPDATE gc.uni_resumo_colaborador
SET exporta = 'N'
WHERE codigo_cpf = '12345678901'
  AND mes_ref = '01'
  AND ano_ref = '2026'
```

**Response:**

```json
{
  "msg": "O Valor da Unimed referente ao mês 01 da Unimed não será enviado"
  // OU
  "msg": "O Valor da Unimed referente ao mês 01, foi readicionado ao Colaborador"
}
```

**Lógica:**

- Se `exporta = 'N'`: Remove colaborador da exportação (não vai para pagamento)
- Se `exporta = 'S'`: Adiciona colaborador de volta para exportação

**Try/Catch:** Retorna `$e->getMessage()` em caso de erro Oracle

---

#### **2.3. Atualizar Todos Colaboradores de Empresa (POST)**

**Action:** `case 'updateTodosColaborador'`  
**Linha:** 399-418 (UnimedController.php)  
**Método DAO:** `updateTodosColaborador()`  
**Linha DAO:** 324-343 (UnimedDAO.php)

**Request:**

```php
POST ?acao=updateTodosColaborador
  emp=SIGLA_EMPRESA    // Sigla da empresa
  mes=01               // Mês de referência
  ano=2026             // Ano de referência
  valor=N              // Novo valor: 'S' ou 'N'
```

**SQL Executada:**

```sql
UPDATE gc.uni_resumo_colaborador
SET exporta = 'N'
WHERE 1=1
  AND mes_ref = '01'
  AND ano_ref = '2026'
  AND cod_empresa = {getCodEmpresaGC()}
  AND codcoligada = {getCodColigadaGC()}
  AND codfilial = {getCodFilialGC()}
```

**Response:**

```json
{
  "result": true,
  "msg": "Todos os colaboradores não serão enviados para Pagamento!!"
}
// OU em caso de erro
{
  "result": false,
  "msg": "Ocorreu erro !!!ORA-12345: ..."
}
```

**Uso Típico:**

- Desmarcar todos (`valor=N`) antes de processar comissão/exportação
- Marcar todos (`valor=S`) para reprocessar após correção de dados

**Observações:**

- Usa métodos `_isCodEmpresaGC()`, `_isCodColigadaGC()`, `_isCodFilialGC()` para obter IDs
- Busca pela sigla da empresa via `$Empresa->setSigla()`

---

#### **2.4. Atualizar Valor Empresa (POST)**

**Action:** `case 'updateValor'`  
**Linha:** 358-378 (UnimedController.php)  
**Método DAO:** `updateValorColaborador($codEmpresa, $coligada, $filial, $valor)`  
**Linha DAO:** 345-366 (UnimedDAO.php)

**Request:**

```php
POST ?acao=updateValor
  empresa=SIGLA_EMPRESA    // Sigla da empresa
  valor=75.50              // Novo valor que empresa paga (percentual ou fixo)
```

**SQL Executada:**

```sql
UPDATE nbs.mcw_colaborador b
SET b.unimed = '75,50'        -- Troca ponto por vírgula
WHERE b.ativo = 'S'
  AND b.cod_empresa = {codempresa}
  AND b.codcoligada = {coligada}
  AND b.codfilial = {filial}
```

**Response:**

```json
{
  "msg": "Atualizado com sucesso !!!"
}
// OU em caso de erro
{
  "msg": "Error ao atualizar valor ORA-12345: ..."
}
```

**Log Oracle:**

```sql
INSERT INTO gc.log_sistema (
  usuario, descricao, modulo, tipo_acao
) VALUES (
  'joao.silva',
  'ALTERADO O VALOR QUE CORRESPONDE A EMPRESA: EMPRESA_X e valor: 75,50',
  'UNI',
  'ALTERACAO DO VALOR PAGO PELA EMPRESA:'
)
```

**Observações:**

- **IMPORTANTE:** Atualiza tabela `nbs.mcw_colaborador`, NÃO `gc.uni_resumo_colaborador`
- Valor é armazenado com vírgula como separador decimal (formato brasileiro)
- Registra em log toda alteração para auditoria
- Aplica para **TODOS** colaboradores ativos da empresa (sem filtro de mês/ano)

---

### 3. 🗄️ Estrutura de Dados

#### **3.1. View: `gc.vw_uni_resumo_colaborador`**

**Estrutura inferida do código:**

```sql
CREATE OR REPLACE VIEW gc.vw_uni_resumo_colaborador AS
SELECT
  -- Identificadores da Empresa/Filial
  ef.cod_empresa,
  ef.codcoligada,
  ef.codfilial,
  ef.cod_band,
  ef.apelido,                    -- Sigla da empresa

  -- Dados do Colaborador
  c.codigo_cpf,
  c.colaborador,                 -- Nome completo
  c.ativo,                       -- 'S' ou 'N'

  -- Período
  ur.mes_ref,
  ur.ano_ref,

  -- Valores Financeiros (somados dos beneficiários)
  SUM(ur.m_titular) as m_titular,
  SUM(ur.m_dependente) as m_dependente,
  SUM(ur.valor_consumo) as valor_consumo,
  SUM(ur.perc_empresa) as perc_empresa,
  SUM(ur.valor_total) as valor_total,
  SUM(ur.valor_liquido) as valor_liquido,

  -- Flag de Exportação
  ur.exporta                     -- 'S' ou 'N'

FROM gc.uni_dados_cobranca ur
JOIN nbs.mcw_colaborador c ON ltrim(c.cpf,'0') = ltrim(ur.cpf_titular,'0')
JOIN gc.empresa_filial ef ON ef.cod_empresa = c.cod_empresa
WHERE ef.processa_unimed = 'S'
GROUP BY
  ef.cod_empresa, ef.codcoligada, ef.codfilial, ef.cod_band, ef.apelido,
  c.codigo_cpf, c.colaborador, c.ativo,
  ur.mes_ref, ur.ano_ref, ur.exporta
```

**Observação:** Esta é uma inferência baseada no código. A view real pode ter lógica adicional.

---

#### **3.2. Tabela: `nbs.mcw_colaborador`**

**Campos relevantes:**

```sql
CREATE TABLE nbs.mcw_colaborador (
  cod_empresa NUMBER,
  codcoligada NUMBER,
  codfilial NUMBER,
  cpf VARCHAR2(11),
  codigo_cpf VARCHAR2(11),      -- CPF sem pontos/traços
  nome VARCHAR2(100),           -- Nome do colaborador
  ativo CHAR(1),                -- 'S' ou 'N'
  unimed NUMBER(10,2),          -- Valor/percentual que empresa paga
  -- outros campos...
)
```

**Relação com Unimed:**

- Campo `unimed` armazena valor fixo ou percentual que empresa paga
- Join com `uni_dados_cobranca` pelo CPF (com ltrim de zeros à esquerda)
- Usado para calcular `perc_empresa` na view consolidada

---

### 4. 🎨 Interface do Usuário (Legacy)

**Arquivo:** `npd-legacy/com/modules/uni/view/Unimed.php` (linha 58)

**Fluxo:**

1. Usuário seleciona empresa, mês, ano, CPF (opcional)
2. Clica em "Buscar" (`onclick="Unimed.buscarColaborador()"`)
3. DataTable é populada com resultados via AJAX
4. Cada linha tem botões:
   - **Botão Ativo/Desligado** (read-only, apenas visual)
   - **Botão Exportar** (clicável se usuário tem permissão 78003)
5. Ao clicar em "Exportar":
   - JavaScript inverte valor do campo hidden (`checkCol`)
   - Chama `Unimed.atualizaColaborador(index, cpf, mes, ano)`
   - Atualiza botão via AJAX sem reload da página

**Botões de Ação em Massa:**

- "Marcar Todos para Exportar" → `updateTodosColaborador` com `valor=S`
- "Desmarcar Todos" → `updateTodosColaborador` com `valor=N`
- "Configurar Valor Empresa" → Modal que chama `updateValor`

---

## 🏗️ ESTADO ATUAL NO NESTJS

### ❌ Implementação: **0%**

**Arquivos Existentes:** NENHUM relacionado a colaboradores

**O que NÃO existe:**

- ❌ Entity/Interface `Colaborador` ou `UniResumoColaborador`
- ❌ DTOs (`BuscarColaboradorDto`, `UpdateColaboradorDto`, etc.)
- ❌ Repository `ColaboradorRepository`
- ❌ Use Cases (buscar, atualizar individual, atualizar em massa, atualizar valor)
- ❌ Controller `ColaboradorController`
- ❌ Testes unitários/integração

**Estrutura atual do projeto:**

```
src/
├── application/
│   ├── dtos/
│   ├── use-cases/
│   └── factories/
├── domain/
│   ├── entities/
│   ├── repositories/
│   └── value-objects/
├── infrastructure/
│   ├── repositories/
│   └── external-apis/
└── presentation/
    └── controllers/
```

**Observação:** Seguir mesma estrutura Clean Architecture usada no módulo de importação.

---

## 📝 ESPECIFICAÇÃO DE IMPLEMENTAÇÃO

### 1. 🎯 Domain Layer

#### **1.1. Value Object: CPF**

**Arquivo:** `src/domain/value-objects/cpf.value-object.ts`  
**Status:** ✅ JÁ EXISTE (usado em importação)

```typescript
export class CPF {
  constructor(private readonly _value: string) {
    this.validate();
  }

  get value(): string {
    return this._value;
  }

  private validate(): void {
    // Validação já implementada
  }
}
```

---

#### **1.2. Entity: Colaborador**

**Arquivo:** `src/domain/entities/colaborador.entity.ts`

```typescript
import { CPF } from '../value-objects/cpf.value-object';

export class Colaborador {
  constructor(
    public readonly codEmpresa: number,
    public readonly codColigada: number,
    public readonly codFilial: number,
    public readonly codBand: number,
    public readonly cpf: CPF,
    public readonly nome: string,
    public readonly apelido: string,
    public readonly mesRef: string,
    public readonly anoRef: string,
    public readonly valorTitular: number,
    public readonly valorDependente: number,
    public readonly valorConsumo: number,
    public readonly valorEmpresa: number,
    public readonly valorTotal: number,
    public readonly valorLiquido: number,
    public readonly exporta: 'S' | 'N',
    public readonly ativo: 'S' | 'N',
  ) {}

  get cpfFormatado(): string {
    const cpf = this.cpf.value;
    return `${cpf.slice(0, 3)}.${cpf.slice(3, 6)}.${cpf.slice(6, 9)}-${cpf.slice(9)}`;
  }

  get periodoCompleto(): string {
    return `${this.mesRef}/${this.anoRef}`;
  }

  deveExportar(): boolean {
    return this.exporta === 'S' && this.ativo === 'S';
  }
}
```

---

#### **1.3. Repository Interface**

**Arquivo:** `src/domain/repositories/colaborador.repository.interface.ts`

```typescript
import { Colaborador } from '../entities/colaborador.entity';
import { CPF } from '../value-objects/cpf.value-object';

export interface BuscarColaboradoresParams {
  codEmpresa: number;
  codColigada: number;
  mes?: string;
  ano?: string;
  cpf?: string;
}

export interface AtualizarColaboradorParams {
  cpf: string;
  mesRef: string;
  anoRef: string;
  exporta: 'S' | 'N';
}

export interface AtualizarTodosParams {
  codEmpresa: number;
  codColigada: number;
  codFilial: number;
  mesRef: string;
  anoRef: string;
  exporta: 'S' | 'N';
}

export interface AtualizarValorEmpresaParams {
  codEmpresa: number;
  codColigada: number;
  codFilial: number;
  valor: number;
}

export interface IColaboradorRepository {
  buscarColaboradores(
    params: BuscarColaboradoresParams,
  ): Promise<Colaborador[]>;
  atualizarExporta(params: AtualizarColaboradorParams): Promise<void>;
  atualizarTodosExporta(params: AtualizarTodosParams): Promise<number>; // retorna qtd atualizada
  atualizarValorEmpresa(params: AtualizarValorEmpresaParams): Promise<void>;
}
```

---

### 2. 📦 Application Layer

#### **2.1. DTOs**

**Arquivo:** `src/application/dtos/buscar-colaboradores.dto.ts`

```typescript
import { IsNumber, IsString, IsOptional, Matches } from 'class-validator';
import { Type } from 'class-transformer';

export class BuscarColaboradoresDto {
  @IsNumber()
  @Type(() => Number)
  codEmpresa: number;

  @IsNumber()
  @Type(() => Number)
  codColigada: number;

  @IsOptional()
  @IsString()
  @Matches(/^(0[1-9]|1[0-2])$/, { message: 'Mês deve estar entre 01 e 12' })
  mes?: string;

  @IsOptional()
  @IsString()
  @Matches(/^(202[0-9]|203[0-9])$/, {
    message: 'Ano deve estar entre 2020 e 2039',
  })
  ano?: string;

  @IsOptional()
  @IsString()
  @Matches(/^\d{11}$/, { message: 'CPF deve ter 11 dígitos' })
  cpf?: string;
}
```

**Arquivo:** `src/application/dtos/atualizar-colaborador.dto.ts`

```typescript
import { IsString, IsNotEmpty, IsIn, Matches } from 'class-validator';

export class AtualizarColaboradorDto {
  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{11}$/, { message: 'CPF deve ter 11 dígitos' })
  cpf: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^(0[1-9]|1[0-2])$/)
  mesRef: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^(202[0-9]|203[0-9])$/)
  anoRef: string;

  @IsString()
  @IsIn(['S', 'N'])
  exporta: 'S' | 'N';
}
```

**Arquivo:** `src/application/dtos/atualizar-todos-colaboradores.dto.ts`

```typescript
import { IsNumber, IsString, IsIn, Matches } from 'class-validator';
import { Type } from 'class-transformer';

export class AtualizarTodosColaboradoresDto {
  @IsNumber()
  @Type(() => Number)
  codEmpresa: number;

  @IsNumber()
  @Type(() => Number)
  codColigada: number;

  @IsNumber()
  @Type(() => Number)
  codFilial: number;

  @IsString()
  @Matches(/^(0[1-9]|1[0-2])$/)
  mesRef: string;

  @IsString()
  @Matches(/^(202[0-9]|203[0-9])$/)
  anoRef: string;

  @IsString()
  @IsIn(['S', 'N'])
  exporta: 'S' | 'N';
}
```

**Arquivo:** `src/application/dtos/atualizar-valor-empresa.dto.ts`

```typescript
import { IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class AtualizarValorEmpresaDto {
  @IsNumber()
  @Type(() => Number)
  codEmpresa: number;

  @IsNumber()
  @Type(() => Number)
  codColigada: number;

  @IsNumber()
  @Type(() => Number)
  codFilial: number;

  @IsNumber()
  @Min(0, { message: 'Valor deve ser maior ou igual a zero' })
  @Type(() => Number)
  valor: number;
}
```

---

#### **2.2. Use Cases**

**Arquivo:** `src/application/use-cases/buscar-colaboradores.use-case.ts`

```typescript
import { Injectable, Logger, Inject } from '@nestjs/common';
import { IColaboradorRepository } from '../../domain/repositories/colaborador.repository.interface';
import { Colaborador } from '../../domain/entities/colaborador.entity';

export interface BuscarColaboradoresRequest {
  codEmpresa: number;
  codColigada: number;
  mes?: string;
  ano?: string;
  cpf?: string;
}

export interface BuscarColaboradoresResponse {
  colaboradores: {
    codEmpresa: number;
    codColigada: number;
    codFilial: number;
    codBand: number;
    cpf: string;
    nome: string;
    apelido: string;
    mesRef: string;
    anoRef: string;
    valorTitular: number;
    valorDependente: number;
    valorConsumo: number;
    valorEmpresa: number;
    valorTotal: number;
    valorLiquido: number;
    exporta: 'S' | 'N';
    ativo: 'S' | 'N';
  }[];
  total: number;
}

@Injectable()
export class BuscarColaboradoresUseCase {
  private readonly logger = new Logger(BuscarColaboradoresUseCase.name);

  constructor(
    @Inject('IColaboradorRepository')
    private readonly colaboradorRepository: IColaboradorRepository,
  ) {}

  async execute(
    request: BuscarColaboradoresRequest,
  ): Promise<BuscarColaboradoresResponse> {
    this.logger.log(
      `Buscando colaboradores - Empresa: ${request.codEmpresa}, Período: ${request.mes}/${request.ano}`,
    );

    const colaboradores =
      await this.colaboradorRepository.buscarColaboradores(request);

    return {
      colaboradores: colaboradores.map((c) => ({
        codEmpresa: c.codEmpresa,
        codColigada: c.codColigada,
        codFilial: c.codFilial,
        codBand: c.codBand,
        cpf: c.cpf.value,
        nome: c.nome,
        apelido: c.apelido,
        mesRef: c.mesRef,
        anoRef: c.anoRef,
        valorTitular: c.valorTitular,
        valorDependente: c.valorDependente,
        valorConsumo: c.valorConsumo,
        valorEmpresa: c.valorEmpresa,
        valorTotal: c.valorTotal,
        valorLiquido: c.valorLiquido,
        exporta: c.exporta,
        ativo: c.ativo,
      })),
      total: colaboradores.length,
    };
  }
}
```

**Arquivo:** `src/application/use-cases/atualizar-colaborador.use-case.ts`

```typescript
import { Injectable, Logger, Inject, NotFoundException } from '@nestjs/common';
import { IColaboradorRepository } from '../../domain/repositories/colaborador.repository.interface';

export interface AtualizarColaboradorRequest {
  cpf: string;
  mesRef: string;
  anoRef: string;
  exporta: 'S' | 'N';
}

export interface AtualizarColaboradorResponse {
  sucesso: boolean;
  mensagem: string;
}

@Injectable()
export class AtualizarColaboradorUseCase {
  private readonly logger = new Logger(AtualizarColaboradorUseCase.name);

  constructor(
    @Inject('IColaboradorRepository')
    private readonly colaboradorRepository: IColaboradorRepository,
  ) {}

  async execute(
    request: AtualizarColaboradorRequest,
  ): Promise<AtualizarColaboradorResponse> {
    this.logger.log(
      `Atualizando colaborador CPF: ${request.cpf}, Período: ${request.mesRef}/${request.anoRef}, Exporta: ${request.exporta}`,
    );

    await this.colaboradorRepository.atualizarExporta(request);

    const mensagem =
      request.exporta === 'N'
        ? `O valor da Unimed referente ao mês ${request.mesRef} não será enviado`
        : `O valor da Unimed referente ao mês ${request.mesRef} foi readicionado ao colaborador`;

    return {
      sucesso: true,
      mensagem,
    };
  }
}
```

**Arquivo:** `src/application/use-cases/atualizar-todos-colaboradores.use-case.ts`

```typescript
import { Injectable, Logger, Inject } from '@nestjs/common';
import { IColaboradorRepository } from '../../domain/repositories/colaborador.repository.interface';

export interface AtualizarTodosColaboradoresRequest {
  codEmpresa: number;
  codColigada: number;
  codFilial: number;
  mesRef: string;
  anoRef: string;
  exporta: 'S' | 'N';
}

export interface AtualizarTodosColaboradoresResponse {
  sucesso: boolean;
  mensagem: string;
  quantidadeAtualizada: number;
}

@Injectable()
export class AtualizarTodosColaboradoresUseCase {
  private readonly logger = new Logger(AtualizarTodosColaboradoresUseCase.name);

  constructor(
    @Inject('IColaboradorRepository')
    private readonly colaboradorRepository: IColaboradorRepository,
  ) {}

  async execute(
    request: AtualizarTodosColaboradoresRequest,
  ): Promise<AtualizarTodosColaboradoresResponse> {
    this.logger.log(
      `Atualizando todos colaboradores - Empresa: ${request.codEmpresa}, Período: ${request.mesRef}/${request.anoRef}, Exporta: ${request.exporta}`,
    );

    const quantidade =
      await this.colaboradorRepository.atualizarTodosExporta(request);

    const mensagem =
      request.exporta === 'N'
        ? `${quantidade} colaboradores não serão enviados para pagamento`
        : `${quantidade} colaboradores foram marcados para exportação`;

    return {
      sucesso: true,
      mensagem,
      quantidadeAtualizada: quantidade,
    };
  }
}
```

**Arquivo:** `src/application/use-cases/atualizar-valor-empresa.use-case.ts`

```typescript
import { Injectable, Logger, Inject } from '@nestjs/common';
import { IColaboradorRepository } from '../../domain/repositories/colaborador.repository.interface';

export interface AtualizarValorEmpresaRequest {
  codEmpresa: number;
  codColigada: number;
  codFilial: number;
  valor: number;
}

export interface AtualizarValorEmpresaResponse {
  sucesso: boolean;
  mensagem: string;
}

@Injectable()
export class AtualizarValorEmpresaUseCase {
  private readonly logger = new Logger(AtualizarValorEmpresaUseCase.name);

  constructor(
    @Inject('IColaboradorRepository')
    private readonly colaboradorRepository: IColaboradorRepository,
  ) {}

  async execute(
    request: AtualizarValorEmpresaRequest,
  ): Promise<AtualizarValorEmpresaResponse> {
    this.logger.log(
      `Atualizando valor empresa: ${request.codEmpresa} para R$ ${request.valor.toFixed(2)}`,
    );

    await this.colaboradorRepository.atualizarValorEmpresa(request);

    return {
      sucesso: true,
      mensagem: `Valor atualizado com sucesso para R$ ${request.valor.toFixed(2).replace('.', ',')}`,
    };
  }
}
```

---

### 3. 🏗️ Infrastructure Layer

#### **3.1. Repository Implementation**

**Arquivo:** `src/infrastructure/repositories/colaborador.repository.ts`

```typescript
import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from '../../database/database.services';
import {
  IColaboradorRepository,
  BuscarColaboradoresParams,
  AtualizarColaboradorParams,
  AtualizarTodosParams,
  AtualizarValorEmpresaParams,
} from '../../domain/repositories/colaborador.repository.interface';
import { Colaborador } from '../../domain/entities/colaborador.entity';
import { CPF } from '../../domain/value-objects/cpf.value-object';

interface ColaboradorRow {
  COD_EMPRESA: number;
  CODCOLIGADA: number;
  CODFILIAL: number;
  COD_BAND: number;
  CODIGO_CPF: string;
  COLABORADOR: string;
  APELIDO: string;
  MES_REF: string;
  ANO_REF: string;
  M_TITULAR: number;
  M_DEPENDENTE: number;
  VALOR_CONSUMO: number;
  PERC_EMPRESA: number;
  VALOR_TOTAL: number;
  VALOR_LIQUIDO: number;
  EXPORTA: 'S' | 'N';
  ATIVO: 'S' | 'N';
}

@Injectable()
export class ColaboradorRepository implements IColaboradorRepository {
  private readonly logger = new Logger(ColaboradorRepository.name);

  constructor(private readonly databaseService: DatabaseService) {}

  async buscarColaboradores(
    params: BuscarColaboradoresParams,
  ): Promise<Colaborador[]> {
    let query = `
      SELECT 
        a.cod_empresa,
        a.codcoligada,
        a.codfilial,
        a.cod_band,
        a.codigo_cpf,
        a.colaborador,
        a.apelido,
        a.mes_ref,
        a.ano_ref,
        a.m_titular,
        a.m_dependente,
        a.valor_consumo,
        a.perc_empresa,
        a.valor_total,
        a.valor_liquido,
        a.exporta,
        a.ativo
      FROM gc.vw_uni_resumo_colaborador a
      WHERE 1=1
        AND a.cod_empresa = :codEmpresa
        AND a.codcoligada = :codColigada
    `;

    const binds: any = {
      codEmpresa: params.codEmpresa,
      codColigada: params.codColigada,
    };

    if (params.mes) {
      query += ` AND a.mes_ref = :mes`;
      binds.mes = params.mes;
    }

    if (params.ano) {
      query += ` AND a.ano_ref = :ano`;
      binds.ano = params.ano;
    }

    if (params.cpf) {
      query += ` AND ltrim(a.codigo_cpf, '0000') = ltrim(:cpf, '0000')`;
      binds.cpf = params.cpf;
    }

    query += ` ORDER BY a.cod_band, a.apelido, a.colaborador`;

    this.logger.debug(
      `Executando busca de colaboradores: ${JSON.stringify(params)}`,
    );

    const rows = await this.databaseService.execute<ColaboradorRow>(
      query,
      binds,
    );

    return rows.map(
      (row) =>
        new Colaborador(
          row.COD_EMPRESA,
          row.CODCOLIGADA,
          row.CODFILIAL,
          row.COD_BAND,
          new CPF(row.CODIGO_CPF),
          row.COLABORADOR,
          row.APELIDO,
          row.MES_REF,
          row.ANO_REF,
          row.M_TITULAR,
          row.M_DEPENDENTE,
          row.VALOR_CONSUMO,
          row.PERC_EMPRESA,
          row.VALOR_TOTAL,
          row.VALOR_LIQUIDO,
          row.EXPORTA,
          row.ATIVO,
        ),
    );
  }

  async atualizarExporta(params: AtualizarColaboradorParams): Promise<void> {
    const query = `
      UPDATE gc.uni_resumo_colaborador
      SET exporta = :exporta
      WHERE codigo_cpf = :cpf
        AND mes_ref = :mesRef
        AND ano_ref = :anoRef
    `;

    const binds = {
      exporta: params.exporta,
      cpf: params.cpf,
      mesRef: params.mesRef,
      anoRef: params.anoRef,
    };

    this.logger.debug(
      `Atualizando exporta colaborador: ${JSON.stringify(params)}`,
    );

    await this.databaseService.execute(query, binds);
  }

  async atualizarTodosExporta(params: AtualizarTodosParams): Promise<number> {
    const query = `
      UPDATE gc.uni_resumo_colaborador
      SET exporta = :exporta
      WHERE mes_ref = :mesRef
        AND ano_ref = :anoRef
        AND cod_empresa = :codEmpresa
        AND codcoligada = :codColigada
        AND codfilial = :codFilial
    `;

    const binds = {
      exporta: params.exporta,
      mesRef: params.mesRef,
      anoRef: params.anoRef,
      codEmpresa: params.codEmpresa,
      codColigada: params.codColigada,
      codFilial: params.codFilial,
    };

    this.logger.debug(
      `Atualizando todos colaboradores: ${JSON.stringify(params)}`,
    );

    const result = await this.databaseService.execute(query, binds);

    // Oracle retorna rowsAffected em result.rowsAffected
    return (result as any).rowsAffected || 0;
  }

  async atualizarValorEmpresa(
    params: AtualizarValorEmpresaParams,
  ): Promise<void> {
    // IMPORTANTE: Usa vírgula como separador decimal (formato brasileiro)
    const valorFormatado = params.valor.toFixed(2).replace('.', ',');

    const query = `
      UPDATE nbs.mcw_colaborador
      SET unimed = :valor
      WHERE ativo = 'S'
        AND cod_empresa = :codEmpresa
        AND codcoligada = :codColigada
        AND codfilial = :codFilial
    `;

    const binds = {
      valor: valorFormatado,
      codEmpresa: params.codEmpresa,
      codColigada: params.codColigada,
      codFilial: params.codFilial,
    };

    this.logger.debug(`Atualizando valor empresa: ${JSON.stringify(params)}`);

    await this.databaseService.execute(query, binds);

    // TODO: Implementar log de auditoria
    // await this.salvarLogAlteracao(params);
  }
}
```

---

### 4. 🎨 Presentation Layer

#### **4.1. Controller**

**Arquivo:** `src/presentation/controllers/colaborador.controller.ts`

```typescript
import {
  Controller,
  Get,
  Patch,
  Query,
  Body,
  HttpStatus,
  HttpException,
  Logger,
} from '@nestjs/common';
import { BuscarColaboradoresDto } from '../../application/dtos/buscar-colaboradores.dto';
import { AtualizarColaboradorDto } from '../../application/dtos/atualizar-colaborador.dto';
import { AtualizarTodosColaboradoresDto } from '../../application/dtos/atualizar-todos-colaboradores.dto';
import { AtualizarValorEmpresaDto } from '../../application/dtos/atualizar-valor-empresa.dto';
import { BuscarColaboradoresUseCase } from '../../application/use-cases/buscar-colaboradores.use-case';
import { AtualizarColaboradorUseCase } from '../../application/use-cases/atualizar-colaborador.use-case';
import { AtualizarTodosColaboradoresUseCase } from '../../application/use-cases/atualizar-todos-colaboradores.use-case';
import { AtualizarValorEmpresaUseCase } from '../../application/use-cases/atualizar-valor-empresa.use-case';

@Controller('colaboradores')
export class ColaboradorController {
  private readonly logger = new Logger(ColaboradorController.name);

  constructor(
    private readonly buscarColaboradoresUseCase: BuscarColaboradoresUseCase,
    private readonly atualizarColaboradorUseCase: AtualizarColaboradorUseCase,
    private readonly atualizarTodosUseCase: AtualizarTodosColaboradoresUseCase,
    private readonly atualizarValorEmpresaUseCase: AtualizarValorEmpresaUseCase,
  ) {}

  @Get()
  async buscarColaboradores(@Query() dto: BuscarColaboradoresDto) {
    try {
      const resultado = await this.buscarColaboradoresUseCase.execute(dto);

      return {
        sucesso: true,
        dados: resultado.colaboradores,
        total: resultado.total,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error(
        `Erro ao buscar colaboradores: ${error.message}`,
        error.stack,
      );
      throw new HttpException(
        `Erro ao buscar colaboradores: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Patch('atualizar')
  async atualizarColaborador(@Body() dto: AtualizarColaboradorDto) {
    try {
      const resultado = await this.atualizarColaboradorUseCase.execute(dto);

      return {
        sucesso: resultado.sucesso,
        mensagem: resultado.mensagem,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error(
        `Erro ao atualizar colaborador: ${error.message}`,
        error.stack,
      );
      throw new HttpException(
        `Erro ao atualizar colaborador: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Patch('atualizar-todos')
  async atualizarTodosColaboradores(
    @Body() dto: AtualizarTodosColaboradoresDto,
  ) {
    try {
      const resultado = await this.atualizarTodosUseCase.execute(dto);

      return {
        sucesso: resultado.sucesso,
        mensagem: resultado.mensagem,
        quantidadeAtualizada: resultado.quantidadeAtualizada,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error(
        `Erro ao atualizar todos colaboradores: ${error.message}`,
        error.stack,
      );
      throw new HttpException(
        `Erro ao atualizar todos colaboradores: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Patch('atualizar-valor-empresa')
  async atualizarValorEmpresa(@Body() dto: AtualizarValorEmpresaDto) {
    try {
      const resultado = await this.atualizarValorEmpresaUseCase.execute(dto);

      return {
        sucesso: resultado.sucesso,
        mensagem: resultado.mensagem,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error(
        `Erro ao atualizar valor empresa: ${error.message}`,
        error.stack,
      );
      throw new HttpException(
        `Erro ao atualizar valor empresa: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
```

---

### 5. 🔧 Module Configuration

#### **5.1. Atualizar Application Module**

**Arquivo:** `src/application/application.module.ts`

```typescript
import { Module } from '@nestjs/common';
import { InfrastructureModule } from '../infrastructure/infrastructure.module';

// Use Cases existentes
import { ImportarDadosUnimedUseCase } from './use-cases/importar-dados-unimed.use-case';
import { ExecutarResumoUnimedUseCase } from './use-cases/executar-resumo-unimed.use-case';
import { BuscarEmpresasUnimedUseCase } from './use-cases/buscar-empresas-unimed.use-case';
import { ImportarUnimedPorContratoUseCase } from './use-cases/importar-unimed-por-contrato.use-case';

// Use Cases novos - COLABORADORES
import { BuscarColaboradoresUseCase } from './use-cases/buscar-colaboradores.use-case';
import { AtualizarColaboradorUseCase } from './use-cases/atualizar-colaborador.use-case';
import { AtualizarTodosColaboradoresUseCase } from './use-cases/atualizar-todos-colaboradores.use-case';
import { AtualizarValorEmpresaUseCase } from './use-cases/atualizar-valor-empresa.use-case';

// Factories
import { BeneficiarioFactory } from './factories/beneficiario.factory';

@Module({
  imports: [InfrastructureModule],
  providers: [
    // Existentes
    ImportarDadosUnimedUseCase,
    ExecutarResumoUnimedUseCase,
    BuscarEmpresasUnimedUseCase,
    ImportarUnimedPorContratoUseCase,
    BeneficiarioFactory,

    // Novos - COLABORADORES
    BuscarColaboradoresUseCase,
    AtualizarColaboradorUseCase,
    AtualizarTodosColaboradoresUseCase,
    AtualizarValorEmpresaUseCase,
  ],
  exports: [
    // Existentes
    ImportarDadosUnimedUseCase,
    ExecutarResumoUnimedUseCase,
    BuscarEmpresasUnimedUseCase,
    ImportarUnimedPorContratoUseCase,

    // Novos - COLABORADORES
    BuscarColaboradoresUseCase,
    AtualizarColaboradorUseCase,
    AtualizarTodosColaboradoresUseCase,
    AtualizarValorEmpresaUseCase,
  ],
})
export class ApplicationModule {}
```

---

#### **5.2. Atualizar Infrastructure Module**

**Arquivo:** `src/infrastructure/infrastructure.module.ts`

```typescript
import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';

// Repositories existentes
import { EmpresaRepository } from './repositories/empresa.repository';
import { UnimedCobrancaRepository } from './repositories/unimed-cobranca.repository';

// Repository novo - COLABORADOR
import { ColaboradorRepository } from './repositories/colaborador.repository';

// External APIs
import { UnimedApiService } from './external-apis/unimed-api.service';

@Module({
  imports: [DatabaseModule],
  providers: [
    // Existentes
    {
      provide: 'IEmpresaRepository',
      useClass: EmpresaRepository,
    },
    EmpresaRepository,
    UnimedCobrancaRepository,
    UnimedApiService,

    // Novo - COLABORADOR
    {
      provide: 'IColaboradorRepository',
      useClass: ColaboradorRepository,
    },
    ColaboradorRepository,
  ],
  exports: [
    // Existentes
    'IEmpresaRepository',
    EmpresaRepository,
    UnimedCobrancaRepository,
    UnimedApiService,

    // Novo - COLABORADOR
    'IColaboradorRepository',
    ColaboradorRepository,
  ],
})
export class InfrastructureModule {}
```

---

#### **5.3. Atualizar Presentation Module**

**Arquivo:** `src/presentation/presentation.module.ts`

```typescript
import { Module } from '@nestjs/common';
import { ApplicationModule } from '../application/application.module';

// Controllers existentes
import { ImportacaoController } from './controllers/importacao.controller';

// Controller novo - COLABORADOR
import { ColaboradorController } from './controllers/colaborador.controller';

@Module({
  imports: [ApplicationModule],
  controllers: [
    ImportacaoController,
    ColaboradorController, // NOVO
  ],
})
export class PresentationModule {}
```

---

## 📐 PLANO DE IMPLEMENTAÇÃO

### 🗓️ Cronograma Detalhado

#### **DIA 1 - Domain & Application (3-4 horas)**

**Manhã:**

1. Criar Entity `Colaborador` (30 min)
2. Criar Repository Interface `IColaboradorRepository` (30 min)
3. Criar DTOs (1 hora):
   - `BuscarColaboradoresDto`
   - `AtualizarColaboradorDto`
   - `AtualizarTodosColaboradoresDto`
   - `AtualizarValorEmpresaDto`

**Tarde:** 4. Criar Use Cases (2 horas):

- `BuscarColaboradoresUseCase`
- `AtualizarColaboradorUseCase`
- `AtualizarTodosColaboradoresUseCase`
- `AtualizarValorEmpresaUseCase`

---

#### **DIA 2 - Infrastructure (4-5 horas)**

**Manhã:**

1. Implementar `ColaboradorRepository` (2-3 horas):
   - Método `buscarColaboradores()`
   - Método `atualizarExporta()`
   - Método `atualizarTodosExporta()`
   - Método `atualizarValorEmpresa()`

**Tarde:** 2. Testar queries no Oracle SQL Developer (1 hora) 3. Ajustar binds e tratamento de erros (1 hora)

---

#### **DIA 3 - Presentation & Integration (3-4 horas)**

**Manhã:**

1. Criar `ColaboradorController` (1 hora)
2. Atualizar módulos:
   - `ApplicationModule`
   - `InfrastructureModule`
   - `PresentationModule`

**Tarde:** 3. Testes manuais com Postman/Insomnia (2-3 horas):

- Testar cada endpoint
- Validar DTOs
- Verificar logs
- Testar edge cases

---

#### **DIA 4 - Refinamentos (2-3 horas - opcional)**

1. Adicionar Swagger decorators (1 hora)
2. Melhorar mensagens de erro (30 min)
3. Adicionar logs estruturados (30 min)
4. Implementar log de auditoria para `atualizarValorEmpresa` (1 hora)

---

### ✅ Checklist de Implementação

**Domain Layer:**

- [ ] `src/domain/entities/colaborador.entity.ts`
- [ ] `src/domain/repositories/colaborador.repository.interface.ts`

**Application Layer:**

- [ ] `src/application/dtos/buscar-colaboradores.dto.ts`
- [ ] `src/application/dtos/atualizar-colaborador.dto.ts`
- [ ] `src/application/dtos/atualizar-todos-colaboradores.dto.ts`
- [ ] `src/application/dtos/atualizar-valor-empresa.dto.ts`
- [ ] `src/application/use-cases/buscar-colaboradores.use-case.ts`
- [ ] `src/application/use-cases/atualizar-colaborador.use-case.ts`
- [ ] `src/application/use-cases/atualizar-todos-colaboradores.use-case.ts`
- [ ] `src/application/use-cases/atualizar-valor-empresa.use-case.ts`

**Infrastructure Layer:**

- [ ] `src/infrastructure/repositories/colaborador.repository.ts`

**Presentation Layer:**

- [ ] `src/presentation/controllers/colaborador.controller.ts`

**Configuration:**

- [ ] Atualizar `src/application/application.module.ts`
- [ ] Atualizar `src/infrastructure/infrastructure.module.ts`
- [ ] Atualizar `src/presentation/presentation.module.ts`

---

## 🧪 ESPECIFICAÇÃO DE TESTES (MANUAIS)

### Cenários de Teste

#### **Teste 1: Buscar Colaboradores**

**Request:**

```bash
GET http://localhost:3000/colaboradores?codEmpresa=1&codColigada=1&mes=01&ano=2026
```

**Expected Response:**

```json
{
  "sucesso": true,
  "dados": [
    {
      "codEmpresa": 1,
      "codColigada": 1,
      "codFilial": 1,
      "codBand": 10,
      "cpf": "12345678901",
      "nome": "JOAO DA SILVA",
      "apelido": "EMPRESA_X",
      "mesRef": "01",
      "anoRef": "2026",
      "valorTitular": 120.5,
      "valorDependente": 80.3,
      "valorConsumo": 200.8,
      "valorEmpresa": 150.6,
      "valorTotal": 350.0,
      "valorLiquido": 199.4,
      "exporta": "S",
      "ativo": "S"
    }
  ],
  "total": 1,
  "timestamp": "2026-01-21T10:00:00.000Z"
}
```

---

#### **Teste 2: Atualizar Colaborador Individual**

**Request:**

```bash
PATCH http://localhost:3000/colaboradores/atualizar
Content-Type: application/json

{
  "cpf": "12345678901",
  "mesRef": "01",
  "anoRef": "2026",
  "exporta": "N"
}
```

**Expected Response:**

```json
{
  "sucesso": true,
  "mensagem": "O valor da Unimed referente ao mês 01 não será enviado",
  "timestamp": "2026-01-21T10:05:00.000Z"
}
```

**Verificação:**

```sql
SELECT exporta FROM gc.uni_resumo_colaborador
WHERE codigo_cpf = '12345678901'
  AND mes_ref = '01'
  AND ano_ref = '2026';
-- Deve retornar 'N'
```

---

#### **Teste 3: Atualizar Todos Colaboradores**

**Request:**

```bash
PATCH http://localhost:3000/colaboradores/atualizar-todos
Content-Type: application/json

{
  "codEmpresa": 1,
  "codColigada": 1,
  "codFilial": 1,
  "mesRef": "01",
  "anoRef": "2026",
  "exporta": "S"
}
```

**Expected Response:**

```json
{
  "sucesso": true,
  "mensagem": "150 colaboradores foram marcados para exportação",
  "quantidadeAtualizada": 150,
  "timestamp": "2026-01-21T10:10:00.000Z"
}
```

---

#### **Teste 4: Atualizar Valor Empresa**

**Request:**

```bash
PATCH http://localhost:3000/colaboradores/atualizar-valor-empresa
Content-Type: application/json

{
  "codEmpresa": 1,
  "codColigada": 1,
  "codFilial": 1,
  "valor": 85.50
}
```

**Expected Response:**

```json
{
  "sucesso": true,
  "mensagem": "Valor atualizado com sucesso para R$ 85,50",
  "timestamp": "2026-01-21T10:15:00.000Z"
}
```

**Verificação:**

```sql
SELECT unimed FROM nbs.mcw_colaborador
WHERE ativo = 'S'
  AND cod_empresa = 1
  AND codcoligada = 1
  AND codfilial = 1;
-- Deve retornar '85,50' (com vírgula)
```

---

## 📊 ESTIMATIVAS E PRIORIDADES

### ⏱️ Estimativas de Tempo

| Atividade                         | Tempo Estimado  | Complexidade |
| --------------------------------- | --------------- | ------------ |
| Domain Layer (Entity + Interface) | 1 hora          | ⭐ Baixa     |
| DTOs (4 arquivos)                 | 1 hora          | ⭐ Baixa     |
| Use Cases (4 arquivos)            | 2 horas         | ⭐⭐ Média   |
| Repository Implementation         | 3 horas         | ⭐⭐⭐ Alta  |
| Controller                        | 1 hora          | ⭐⭐ Média   |
| Module Configuration              | 30 min          | ⭐ Baixa     |
| Testes Manuais                    | 2 horas         | ⭐⭐ Média   |
| Ajustes e Refinamentos            | 2 horas         | ⭐⭐ Média   |
| **TOTAL**                         | **12-13 horas** | **~2 dias**  |

---

### 🎯 Prioridade

**Status:** 🔴 **CRÍTICA**

**Motivo:**

1. Bloqueador para módulo de **Processos** (que usa flag `EXPORTA`)
2. Bloqueador para **Exportação TOTVS** (precisa saber quais colaboradores exportar)
3. Funcionalidade essencial para RH/Financeiro (gestão de descontos)

---

### 🔗 Dependências

**Este módulo depende de:**

- ✅ Módulo de Importação (dados devem existir em `gc.uni_dados_cobranca`)
- ✅ Tabela `nbs.mcw_colaborador` populada
- ✅ View `gc.vw_uni_resumo_colaborador` funcionando

**Módulos que dependem deste:**

- ⚠️ Sistema de Processos (verifica flag `EXPORTA` antes de processar)
- ⚠️ Exportação TOTVS (exporta apenas colaboradores com `EXPORTA = 'S'`)
- ⚠️ Relatórios PDF (lista colaboradores ativos/inativos)

---

## 📚 DOCUMENTAÇÃO ADICIONAL

### 📖 Endpoints da API

#### **GET /colaboradores**

**Descrição:** Busca colaboradores com filtros opcionais.

**Query Params:**

- `codEmpresa` (number, obrigatório): Código da empresa
- `codColigada` (number, obrigatório): Código da coligada
- `mes` (string, opcional): Mês de referência (01-12)
- `ano` (string, opcional): Ano de referência (2020-2039)
- `cpf` (string, opcional): CPF do colaborador (11 dígitos)

**Response:** Array de colaboradores com valores financeiros

---

#### **PATCH /colaboradores/atualizar**

**Descrição:** Atualiza flag EXPORTA de um colaborador individual.

**Body:**

```json
{
  "cpf": "12345678901",
  "mesRef": "01",
  "anoRef": "2026",
  "exporta": "S" | "N"
}
```

**Response:** Mensagem de sucesso

---

#### **PATCH /colaboradores/atualizar-todos**

**Descrição:** Atualiza flag EXPORTA de todos colaboradores de uma empresa/período.

**Body:**

```json
{
  "codEmpresa": 1,
  "codColigada": 1,
  "codFilial": 1,
  "mesRef": "01",
  "anoRef": "2026",
  "exporta": "S" | "N"
}
```

**Response:** Mensagem com quantidade de registros atualizados

---

#### **PATCH /colaboradores/atualizar-valor-empresa**

**Descrição:** Atualiza valor/percentual que empresa paga pela Unimed.

**Body:**

```json
{
  "codEmpresa": 1,
  "codColigada": 1,
  "codFilial": 1,
  "valor": 85.5
}
```

**Response:** Mensagem de sucesso

---

### 🐛 Tratamento de Erros

**Erros Esperados:**

- `400 Bad Request`: Validação de DTO falhou (CPF inválido, mês fora do range, etc.)
- `404 Not Found`: Colaborador não encontrado (implementar se necessário)
- `500 Internal Server Error`: Erro no banco de dados ou lógica de negócio

**Exemplo de resposta de erro:**

```json
{
  "statusCode": 400,
  "message": ["cpf must match /^\\d{11}$/ regular expression"],
  "error": "Bad Request"
}
```

---

## 🎓 NOTAS TÉCNICAS

### ⚠️ Pontos de Atenção

1. **Formato de Valores Decimais:**
   - Oracle armazena com vírgula: `'85,50'`
   - JavaScript usa ponto: `85.50`
   - Conversão no repository: `.toFixed(2).replace('.', ',')`

2. **CPF com Zeros à Esquerda:**
   - Usar `ltrim(cpf, '0000')` nas comparações
   - Value Object `CPF` já trata validação

3. **View `vw_uni_resumo_colaborador`:**
   - Pode não existir no banco, verificar com DBA
   - Se não existir, criar baseado na query inferida
   - Certifique-se que view retorna todos campos necessários

4. **Tabela `nbs.mcw_colaborador`:**
   - Campo `unimed` armazena valor em formato brasileiro
   - Atualização afeta TODOS colaboradores ativos (sem filtro de período)
   - Implementar log de auditoria neste endpoint

5. **Permissões:**
   - Legacy verifica `isAcesso(78003, $User)` para atualizar
   - NestJS ainda não tem sistema de autenticação/autorização
   - **TODO:** Implementar guards e permissões antes de produção

---

## 🚀 PRÓXIMOS PASSOS

Após implementar o módulo de colaboradores:

1. **Módulo de Processos** (3-4 dias)
   - Integração com stored procedure `P_MCW_FECHA_COMISSAO_GLOBAL`
   - Listar processos disponíveis
   - Executar processo de fechamento
   - Histórico de processos executados

2. **Exportação TOTVS** (2-3 dias)
   - Gerar arquivo de exportação para ERP
   - Filtrar apenas colaboradores com `EXPORTA = 'S'`
   - Formato específico do TOTVS

3. **Relatórios PDF** (2-3 dias - menor prioridade)
   - Relatório por colaborador
   - Relatório por centro de custo
   - Integração com JasperReports ou alternativa Node.js

---

**Última atualização:** 21/01/2026  
**Autor:** Análise técnica automatizada  
**Versão:** 1.0
