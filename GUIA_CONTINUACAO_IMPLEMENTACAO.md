# 🚀 GUIA DE CONTINUAÇÃO DA IMPLEMENTAÇÃO - API UNIMED

## 📌 Status Atual do Projeto (Janeiro 2026)

### ✅ O que já está implementado

#### **1. Estrutura Base**

- ✅ DatabaseService completo (executeQuery, executeMany, executeProcedure)
- ✅ DatabaseModule configurado como global
- ✅ Conexão com Oracle Database funcionando
- ✅ ConfigModule com variáveis de ambiente

#### **2. Integração com API Unimed**

- ✅ UnimedApiService implementado
  - ✅ `getToken()` - Autenticação via headers (usuario/senha)
  - ✅ `buscarPorPeriodoCnpj()` - Busca por CNPJ
  - ✅ `buscaPorPeriodoContrato()` - Busca por Contrato
  - ✅ Renovação automática de token em caso de 401

#### **3. DTOs e Entities**

- ✅ DemonstrativoDto completo (alinhado com resposta real da API)
  - ✅ MensalidadeDto
  - ✅ ComposicaoDto
- ✅ EmpresaFilialListDto
- ✅ ImportUnimedDto

#### **4. Service de Importação**

- ✅ UnimedImportService completo
  - ✅ `importarPorCnpj()` - Importação completa por CNPJ
  - ✅ `buscaEmpresasUnimed()` - Lista empresas que processam Unimed
  - ✅ `limparDadosImportacao()` - Remove dados antigos
  - ✅ `inserirDadosCobranca()` - Insert em massa com executeMany
  - ✅ `executarResumo()` - Chama procedure de resumo
  - ✅ Funções auxiliares (calcularMesRef, calcularAnoRef, removerAcentos)

#### **5. Módulos**

- ✅ UnimedModule criado e registrado
- ✅ AppModule configurado

---

## 🔧 Correções Necessárias Antes de Continuar

### ⚠️ **Prioridade ALTA - Deve ser corrigido agora**

#### **1. Deletar Interface Incorreta**

```typescript
// Arquivo: src/modules/unimed/entities/unimed-api-response.interface.ts
// ❌ DELETAR este arquivo - estrutura incorreta
```

**Motivo**: A interface tem estrutura `fatura.fatura` que não corresponde à API real. Use `DemonstrativoDto` diretamente.

#### **2. Corrigir Tipos do DatabaseService**

**Arquivo**: `src/database/database.services.ts`

```typescript
// ❌ ANTES
async executeQuery<T = any>(
  sql: string,
  binds: any[] = [],  // tipo incorreto
  ...
)

// ✅ DEPOIS
async executeQuery<T = any>(
  sql: string,
  binds: any[] | Record<string, any> = [],  // aceita array OU objeto
  ...
)
```

**Motivo**: Você está passando objetos nos binds, mas o tipo diz array. O OracleDB aceita ambos.

#### **3. Adicionar Validação de Valor em MensalidadeDto**

```typescript
// Arquivo: src/modules/unimed/entities/demonstrativo.dto.ts
export class MensalidadeDto {
  // ... outros campos

  @IsNumber() // ← ADICIONAR
  valor_fatura: number;

  // ... resto
}
```

#### **4. Adicionar Throw nos Métodos do UnimedApiService**

**Arquivo**: `src/modules/unimed/services/unimed-api.service.ts`

```typescript
async buscarPorPeriodoCnpj(
  periodo: string,
  cnpj: string,
): Promise<DemonstrativoDto> {
  try {
    // ... código existente
  } catch (e) {
    if (e?.response?.status === 401) {
      this.token = null;
      return this.buscarPorPeriodoCnpj(periodo, cnpj);
    }
    this.logger.error('Erro ao obter dados:', e.response?.data || e.message);
    throw e;  // ← ADICIONAR ESTA LINHA
  }
}

// Fazer o mesmo em buscaPorPeriodoContrato()
```

---

## 🎯 PRÓXIMAS ETAPAS DE IMPLEMENTAÇÃO

### **FASE 3: Controllers e Endpoints de Importação** ⏱️ 2-3 dias

#### **3.1 Criar Import Controller**

**Arquivo**: `src/modules/unimed/controllers/unimed-import.controller.ts`

```typescript
import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { UnimedImportService } from '../services/unimed-import.service';
import { ImportUnimedDto } from '../dtos/import-unimed.dto';

@Controller('unimed/import')
export class UnimedImportController {
  constructor(private readonly importService: UnimedImportService) {}

  @Post('cnpj')
  @HttpCode(HttpStatus.OK)
  async importarPorCnpj(@Body() dto: ImportUnimedDto) {
    await this.importService.importarPorCnpj(dto);
    return {
      success: true,
      message: 'Importação iniciada com sucesso',
    };
  }

  @Post('contrato')
  @HttpCode(HttpStatus.OK)
  async importarPorContrato(@Body() dto: ImportUnimedDto) {
    // TODO: Implementar importarPorContrato no service
    return {
      success: true,
      message: 'Importação por contrato iniciada',
    };
  }

  @Post('resumo')
  @HttpCode(HttpStatus.OK)
  async executarResumo(@Body() dto: ImportUnimedDto) {
    const result = await this.importService.executarResumo(dto);
    return result;
  }
}
```

#### **3.2 Implementar importarPorContrato**

**Arquivo**: `src/modules/unimed/services/unimed-import.service.ts`

Adicionar método:

```typescript
async importarPorContrato(dto: ImportUnimedDto) {
  const periodo = `${dto.mes.padStart(2, '0')}${dto.ano}`;

  // Buscar contratos ativos
  const contratos = await this.buscarContratosUnimed();

  if (contratos.length === 0) {
    this.logger.warn('Nenhum contrato encontrado para importação.');
    return;
  }

  let totalImportado = 0;

  for (const contrato of contratos) {
    try {
      const dadosUnimed = await this.unimedApiService.buscaPorPeriodoContrato(
        periodo,
        contrato.CONTRATO,
      );

      await this.limparDadosImportacao(
        contrato.COD_EMPRESA,
        contrato.CODCOLIGADA,
        contrato.CODFILIAL,
        dto.mes,
        dto.ano,
      );

      const qtdInserida = await this.inserirDadosCobranca(
        dadosUnimed,
        contrato,
        dto.mes,
        dto.ano,
      );

      totalImportado += qtdInserida;
      this.logger.log(
        `✅ Contrato ${contrato.CONTRATO} - ${qtdInserida} registros importados`,
      );
    } catch (error) {
      this.logger.error(
        `Erro ao processar contrato ${contrato.CONTRATO}: ${error.message}`,
      );
    }
  }

  return { totalImportado };
}

private async buscarContratosUnimed() {
  const sql = `
    SELECT
      a.cod_empresa,
      a.codcoligada,
      a.codfilial,
      a.cod_band,
      a.cnpj,
      a.contrato
    FROM gc.uni_dados_contrato a
    WHERE a.ativo = 'S'
    ORDER BY a.cod_band, a.cod_empresa
  `;

  return this.databaseService.executeQuery(sql);
}
```

#### **3.3 Registrar Controller no Module**

**Arquivo**: `src/modules/unimed/unimed.module.ts`

```typescript
import { Module } from '@nestjs/common';
import { UnimedApiService } from './services/unimed-api.service';
import { UnimedImportService } from './services/unimed-import.service';
import { UnimedImportController } from './controllers/unimed-import.controller';

@Module({
  imports: [],
  controllers: [UnimedImportController], // ← ADICIONAR
  providers: [UnimedApiService, UnimedImportService],
  exports: [UnimedApiService, UnimedImportService],
})
export class UnimedApiModule {}
```

#### **3.4 Testar Endpoints**

```bash
# Testar importação por CNPJ
POST http://localhost:3000/api/v1/unimed/import/cnpj
Content-Type: application/json

{
  "mes": "01",
  "ano": "2026"
}

# Testar importação por contrato
POST http://localhost:3000/api/v1/unimed/import/contrato
Content-Type: application/json

{
  "mes": "01",
  "ano": "2026"
}

# Testar execução de resumo
POST http://localhost:3000/api/v1/unimed/import/resumo
Content-Type: application/json

{
  "mes": "01",
  "ano": "2026"
}
```

---

### **FASE 4: Módulo de Colaboradores** ⏱️ 4-5 dias

#### **4.1 Criar DTOs**

**Arquivo**: `src/modules/unimed/dtos/busca-colaborador.dto.ts`

```typescript
import { IsOptional, IsString, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

export class BuscaColaboradorDto {
  @IsNumber()
  @Type(() => Number)
  codEmpresa: number;

  @IsNumber()
  @Type(() => Number)
  codColigada: number;

  @IsString()
  mesRef: string;

  @IsString()
  anoRef: string;

  @IsOptional()
  @IsString()
  cpf?: string;

  @IsOptional()
  @IsString()
  departamento?: string;

  @IsOptional()
  @IsString()
  funcao?: string;

  // Para paginação
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  page?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  pageSize?: number;

  // Para ordenação
  @IsOptional()
  @IsString()
  sortBy?: string;

  @IsOptional()
  @IsString()
  sortOrder?: 'ASC' | 'DESC';
}
```

**Arquivo**: `src/modules/unimed/dtos/update-colaborador.dto.ts`

```typescript
import { IsString, IsIn } from 'class-validator';

export class UpdateColaboradorDto {
  @IsString()
  cpf: string;

  @IsString()
  mesRef: string;

  @IsString()
  anoRef: string;

  @IsString()
  @IsIn(['S', 'N'])
  exporta: 'S' | 'N';
}

export class UpdateTodosColaboradoresDto {
  @IsString()
  mesRef: string;

  @IsString()
  anoRef: string;

  @IsString()
  @IsIn(['S', 'N'])
  exporta: 'S' | 'N';

  @IsNumber()
  codEmpresa: number;

  @IsNumber()
  codColigada: number;

  @IsNumber()
  codFilial: number;
}

export class UpdateValorEmpresaDto {
  @IsNumber()
  valor: number;

  @IsNumber()
  codEmpresa: number;

  @IsNumber()
  codColigada: number;

  @IsNumber()
  codFilial: number;
}
```

#### **4.2 Criar Entity**

**Arquivo**: `src/modules/unimed/entities/uni-resumo-colaborador.entity.ts`

```typescript
export class UniResumoColaborador {
  cod_empresa: number;
  codcoligada: number;
  codfilial: number;
  cod_band: number;
  codigo_cpf: string;
  colaborador: string;
  apelido: string;
  mes_ref: string;
  ano_ref: string;
  m_titular: number;
  m_dependente: number;
  valor_consumo: number;
  perc_empresa: number;
  valor_total: number;
  valor_liquido: number;
  exporta: 'S' | 'N';
  ativo: 'S' | 'N';
}
```

#### **4.3 Criar Service**

**Arquivo**: `src/modules/unimed/services/unimed-colaborador.service.ts`

```typescript
import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from 'src/database/database.services';
import {
  BuscaColaboradorDto,
  UpdateColaboradorDto,
  UpdateTodosColaboradoresDto,
  UpdateValorEmpresaDto,
} from '../dtos';
import { UniResumoColaborador } from '../entities/uni-resumo-colaborador.entity';

@Injectable()
export class UnimedColaboradorService {
  private readonly logger = new Logger(UnimedColaboradorService.name);

  constructor(private databaseService: DatabaseService) {}

  async buscarColaboradores(
    dto: BuscaColaboradorDto,
  ): Promise<{ data: UniResumoColaborador[]; total: number }> {
    let sql = `
      SELECT * FROM gc.vw_uni_resumo_colaborador a
      WHERE 1=1
        AND a.cod_empresa = :codEmpresa
        AND a.codcoligada = :codColigada
        AND a.mes_ref = :mesRef
        AND a.ano_ref = :anoRef
    `;

    const binds: Record<string, any> = {
      codEmpresa: dto.codEmpresa,
      codColigada: dto.codColigada,
      mesRef: dto.mesRef,
      anoRef: dto.anoRef,
    };

    if (dto.cpf) {
      sql += ` AND ltrim(a.codigo_cpf,'0000') = ltrim(:cpf,'0000')`;
      binds.cpf = dto.cpf;
    }

    if (dto.departamento) {
      sql += ` AND a.departamento = :departamento`;
      binds.departamento = dto.departamento;
    }

    if (dto.funcao) {
      sql += ` AND a.funcao = :funcao`;
      binds.funcao = dto.funcao;
    }

    sql += ` ORDER BY a.cod_band, a.apelido, a.colaborador`;

    const result =
      await this.databaseService.executeQuery<UniResumoColaborador>(sql, binds);

    return {
      data: result,
      total: result.length,
    };
  }

  async buscarPorCpf(
    cpf: string,
    mesRef: string,
    anoRef: string,
  ): Promise<UniResumoColaborador | null> {
    const sql = `
      SELECT * FROM gc.vw_uni_resumo_colaborador a
      WHERE ltrim(a.codigo_cpf,'0000') = ltrim(:cpf,'0000')
        AND a.mes_ref = :mesRef
        AND a.ano_ref = :anoRef
    `;

    const result =
      await this.databaseService.executeQuery<UniResumoColaborador>(sql, {
        cpf,
        mesRef,
        anoRef,
      });

    return result[0] || null;
  }

  async atualizarColaborador(dto: UpdateColaboradorDto): Promise<void> {
    const sql = `
      UPDATE gc.uni_resumo_colaborador
      SET exporta = :exporta
      WHERE codigo_cpf = :cpf
        AND mes_ref = :mesRef
        AND ano_ref = :anoRef
    `;

    await this.databaseService.executeQuery(sql, {
      exporta: dto.exporta,
      cpf: dto.cpf,
      mesRef: dto.mesRef,
      anoRef: dto.anoRef,
    });

    this.logger.log(`Colaborador ${dto.cpf} atualizado com sucesso`);
  }

  async atualizarTodosColaboradores(
    dto: UpdateTodosColaboradoresDto,
  ): Promise<number> {
    const sql = `
      UPDATE gc.uni_resumo_colaborador
      SET exporta = :exporta
      WHERE mes_ref = :mesRef
        AND ano_ref = :anoRef
        AND cod_empresa = :codEmpresa
        AND codcoligada = :codColigada
        AND codfilial = :codFilial
    `;

    const result = await this.databaseService.executeQuery(sql, dto);

    this.logger.log(`Atualizados colaboradores da empresa ${dto.codEmpresa}`);

    return result.length;
  }

  async atualizarValorEmpresa(dto: UpdateValorEmpresaDto): Promise<void> {
    const sql = `
      UPDATE nbs.mcw_colaborador b
      SET b.unimed = :valor
      WHERE b.ativo = 'S'
        AND b.cod_empresa = :codEmpresa
        AND b.codcoligada = :codColigada
        AND b.codfilial = :codFilial
    `;

    await this.databaseService.executeQuery(sql, dto);

    this.logger.log(`Valor Unimed atualizado para empresa ${dto.codEmpresa}`);
  }
}
```

#### **4.4 Criar Controller**

**Arquivo**: `src/modules/unimed/controllers/unimed-colaborador.controller.ts`

```typescript
import {
  Controller,
  Get,
  Patch,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { UnimedColaboradorService } from '../services/unimed-colaborador.service';
import {
  BuscaColaboradorDto,
  UpdateColaboradorDto,
  UpdateTodosColaboradoresDto,
  UpdateValorEmpresaDto,
} from '../dtos';

@Controller('unimed/colaboradores')
export class UnimedColaboradorController {
  constructor(private readonly colaboradorService: UnimedColaboradorService) {}

  @Get()
  async buscarColaboradores(@Query() dto: BuscaColaboradorDto) {
    return this.colaboradorService.buscarColaboradores(dto);
  }

  @Get(':cpf')
  async buscarPorCpf(
    @Param('cpf') cpf: string,
    @Query('mesRef') mesRef: string,
    @Query('anoRef') anoRef: string,
  ) {
    return this.colaboradorService.buscarPorCpf(cpf, mesRef, anoRef);
  }

  @Patch(':cpf')
  @HttpCode(HttpStatus.OK)
  async atualizarColaborador(
    @Param('cpf') cpf: string,
    @Body() dto: Omit<UpdateColaboradorDto, 'cpf'>,
  ) {
    await this.colaboradorService.atualizarColaborador({ ...dto, cpf });
    return {
      success: true,
      message: 'Colaborador atualizado com sucesso',
    };
  }

  @Patch('empresa/:sigla')
  @HttpCode(HttpStatus.OK)
  async atualizarTodosColaboradores(@Body() dto: UpdateTodosColaboradoresDto) {
    const qtd = await this.colaboradorService.atualizarTodosColaboradores(dto);
    return {
      success: true,
      message: `${qtd} colaboradores atualizados`,
    };
  }
}

@Controller('unimed/valores')
export class UnimedValoresController {
  constructor(private readonly colaboradorService: UnimedColaboradorService) {}

  @Patch('empresa/:sigla')
  @HttpCode(HttpStatus.OK)
  async atualizarValorEmpresa(@Body() dto: UpdateValorEmpresaDto) {
    await this.colaboradorService.atualizarValorEmpresa(dto);
    return {
      success: true,
      message: 'Valor da empresa atualizado com sucesso',
    };
  }
}
```

#### **4.5 Registrar no Module**

```typescript
import { Module } from '@nestjs/common';
import { UnimedApiService } from './services/unimed-api.service';
import { UnimedImportService } from './services/unimed-import.service';
import { UnimedColaboradorService } from './services/unimed-colaborador.service';
import { UnimedImportController } from './controllers/unimed-import.controller';
import {
  UnimedColaboradorController,
  UnimedValoresController,
} from './controllers/unimed-colaborador.controller';

@Module({
  imports: [],
  controllers: [
    UnimedImportController,
    UnimedColaboradorController,
    UnimedValoresController,
  ],
  providers: [UnimedApiService, UnimedImportService, UnimedColaboradorService],
  exports: [UnimedApiService, UnimedImportService, UnimedColaboradorService],
})
export class UnimedApiModule {}
```

---

### **FASE 5: Módulo de Processos** ⏱️ 3-4 dias

#### **5.1 Criar DTOs**

**Arquivo**: `src/modules/unimed/dtos/processo.dto.ts`

```typescript
import {
  IsString,
  IsNumber,
  IsOptional,
  IsIn,
  IsBoolean,
} from 'class-validator';
import { Type } from 'class-transformer';

export class ExecutarProcessoDto {
  @IsString()
  codigoProcesso: string;

  @IsString()
  mesRef: string;

  @IsString()
  anoRef: string;

  @IsString()
  @IsIn(['S', 'N'])
  previa: 'S' | 'N';

  @IsString()
  @IsIn(['S', 'N'])
  apagar: 'S' | 'N';

  @IsString()
  usuario: string;

  @IsString()
  @IsIn(['S', 'N'])
  todasEmpresas: 'S' | 'N';

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  codEmpresa?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  codBandeira?: number;

  @IsOptional()
  @IsString()
  cpfColaborador?: string;
}

export class BuscarProcessoDto {
  @IsString()
  categoria: string; // 'UNIMED'

  @IsOptional()
  @IsString()
  tipoDado?: string;
}

export class HistoricoProcessoDto {
  @IsString()
  mesRef: string;

  @IsString()
  anoRef: string;

  @IsString()
  categoria: string;

  @IsOptional()
  @IsString()
  codigoProcesso?: string;
}
```

#### **5.2 Criar Service**

**Arquivo**: `src/modules/unimed/services/unimed-processo.service.ts`

```typescript
import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { DatabaseService } from 'src/database/database.services';
import {
  ExecutarProcessoDto,
  BuscarProcessoDto,
  HistoricoProcessoDto,
} from '../dtos/processo.dto';

@Injectable()
export class UnimedProcessoService {
  private readonly logger = new Logger(UnimedProcessoService.name);

  constructor(private databaseService: DatabaseService) {}

  async buscarProcessos(dto: BuscarProcessoDto) {
    const sql = `
      SELECT 
        a.codigo, 
        a.descricao, 
        a.categoria, 
        b.usuario, 
        b.data_proc, 
        b.mes_ref, 
        b.ano_ref,
        b.apaga, 
        b.previa, 
        ROUND((b.hora2+00.0001)-b.hora1, 4) hora_inicio,
        ROUND(b.hora2-b.hora1, 4) hora_final
      FROM nbs.mcw_processo a
      LEFT OUTER JOIN mcw_processo_log b ON (a.codigo = b.codigo)
      WHERE a.ativo = 'S'
        AND a.categoria = :categoria
        ${dto.tipoDado ? 'AND a.tipo_dado = :tipoDado' : ''}
        AND a.codigo NOT IN ('70000008','70000009')
      ORDER BY a.ordem_procedure
    `;

    const binds: Record<string, any> = { categoria: dto.categoria };
    if (dto.tipoDado) {
      binds.tipoDado = dto.tipoDado;
    }

    const result = await this.databaseService.executeQuery(sql, binds);

    return {
      result: true,
      dados: result,
    };
  }

  async executarProcesso(dto: ExecutarProcessoDto) {
    try {
      // Validar deadline (isso requer buscar data_final da tabela mcw_processo)
      // Por enquanto, vamos pular essa validação

      const plsql = `
        BEGIN 
          GC.PGK_GLOBAL.P_MCW_FECHA_COMISSAO_GLOBAL(
            :codigoProcesso,
            :mesRef,
            :anoRef,
            :previa,
            :apagar,
            :usuario,
            :todasEmpresas,
            :codEmpresa,
            :codBandeira,
            NULL,  -- tipo_comissao
            'UNIMED',  -- categoria
            :cpfColaborador
          );
        END;
      `;

      const binds = {
        codigoProcesso: dto.codigoProcesso,
        mesRef: parseInt(dto.mesRef, 10),
        anoRef: parseInt(dto.anoRef, 10),
        previa: dto.previa,
        apagar: dto.apagar,
        usuario: dto.usuario,
        todasEmpresas: dto.todasEmpresas,
        codEmpresa: dto.codEmpresa || null,
        codBandeira: dto.codBandeira || null,
        cpfColaborador: dto.cpfColaborador || null,
      };

      await this.databaseService.executeProcedure(plsql, binds);

      this.logger.log(`Processo ${dto.codigoProcesso} executado com sucesso`);

      return {
        result: true,
        msg: 'Processo executado com sucesso',
      };
    } catch (error) {
      this.logger.error(
        `Erro ao executar processo ${dto.codigoProcesso}: ${error.message}`,
      );
      return {
        result: false,
        msg: `Erro: ${error.message}`,
      };
    }
  }

  async buscarHistorico(dto: HistoricoProcessoDto) {
    let sql = `
      SELECT * FROM gc.vw_mcw_processo_log a
      WHERE a.mes_ref = :mesRef
        AND a.ano_ref = :anoRef
        AND a.categoria = :categoria
    `;

    const binds: Record<string, any> = {
      mesRef: dto.mesRef,
      anoRef: dto.anoRef,
      categoria: dto.categoria,
    };

    if (dto.codigoProcesso) {
      sql += ` AND a.codigo = :codigoProcesso`;
      binds.codigoProcesso = dto.codigoProcesso;
    }

    sql += ` ORDER BY a.data_proc DESC`;

    const result = await this.databaseService.executeQuery(sql, binds);

    return {
      result: true,
      dados: result,
    };
  }
}
```

#### **5.3 Criar Controller**

**Arquivo**: `src/modules/unimed/controllers/unimed-processo.controller.ts`

```typescript
import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Param,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { UnimedProcessoService } from '../services/unimed-processo.service';
import {
  ExecutarProcessoDto,
  BuscarProcessoDto,
  HistoricoProcessoDto,
} from '../dtos/processo.dto';

@Controller('unimed/processos')
export class UnimedProcessoController {
  constructor(private readonly processoService: UnimedProcessoService) {}

  @Get()
  async buscarProcessos(@Query() dto: BuscarProcessoDto) {
    return this.processoService.buscarProcessos(dto);
  }

  @Post('executar')
  @HttpCode(HttpStatus.OK)
  async executarProcesso(@Body() dto: ExecutarProcessoDto) {
    return this.processoService.executarProcesso(dto);
  }

  @Get('historico')
  async buscarHistorico(@Query() dto: HistoricoProcessoDto) {
    return this.processoService.buscarHistorico(dto);
  }

  @Get(':codigo/historico')
  async buscarHistoricoEspecifico(
    @Param('codigo') codigo: string,
    @Query() dto: Omit<HistoricoProcessoDto, 'codigoProcesso'>,
  ) {
    return this.processoService.buscarHistorico({
      ...dto,
      codigoProcesso: codigo,
    });
  }
}
```

---

### **FASE 6: Exportação e DIRF** ⏱️ 2-3 dias

Esta fase envolve implementar endpoints para:

- Exportação para Totvs (procedure `ExUnimed`)
- Geração de dados para DIRF

**Implementação similar às anteriores**, seguindo o padrão DTO → Service → Controller.

---

### **FASE 7: Relatórios** ⏱️ 5-7 dias

Para relatórios em PDF, você precisará:

1. **Opção 1: Usar biblioteca Node.js**
   - PDFKit
   - Puppeteer (gera PDF a partir de HTML)
   - jsPDF

2. **Opção 2: Chamar JasperReports do sistema legado**
   - Criar endpoint que chama o PHP legado
   - Retornar o PDF gerado

3. **Opção 3: Criar relatórios simples em HTML**
   - Gerar HTML e converter para PDF com Puppeteer

---

## 📊 Cronograma Estimado

| Fase   | Descrição                       | Dias | Acumulado |
| ------ | ------------------------------- | ---- | --------- |
| ✅ 1-2 | Setup e estrutura base          | 2    | 2         |
| ✅ 2   | Módulo de importação (services) | 5    | 7         |
| 🔄 3   | Controllers de importação       | 3    | 10        |
| ⏳ 4   | Módulo de colaboradores         | 5    | 15        |
| ⏳ 5   | Módulo de processos             | 4    | 19        |
| ⏳ 6   | Exportação e DIRF               | 3    | 22        |
| ⏳ 7   | Relatórios                      | 7    | 29        |
| ⏳ 8   | Testes e ajustes                | 3    | 32        |
| ⏳ 9   | Documentação final              | 2    | 34        |

**Estimativa total**: ~34 dias úteis (7 semanas)

---

## 🎯 Prioridades Recomendadas

1. **ALTA**: Corrigir os 4 problemas identificados na seção "Correções Necessárias"
2. **ALTA**: Implementar Fase 3 (Controllers de importação) para ter funcionalidade end-to-end
3. **MÉDIA**: Implementar Fase 4 (Colaboradores) - funcionalidade crítica
4. **MÉDIA**: Implementar Fase 5 (Processos) - fechamento mensal
5. **BAIXA**: Fase 6 e 7 - podem ser implementadas gradualmente

---

## 🔍 Pontos de Atenção

### **Performance**

- Importação em massa pode demorar (múltiplas empresas/CNPJs)
- Considerar implementar fila (Bull/BullMQ) para processos longos
- Adicionar indicador de progresso

### **Segurança**

- Implementar autenticação JWT
- Validar permissões de acesso (78003, 78004, 78005)
- Logs de auditoria para operações críticas

### **Observabilidade**

- Adicionar mais logs estruturados
- Implementar health checks
- Monitorar tempo de execução de procedures

### **Testes**

- Testes unitários para services
- Testes de integração para controllers
- Testes end-to-end para fluxos completos

---

## 📚 Recursos Úteis

- [NestJS Documentation](https://docs.nestjs.com/)
- [Oracle Node.js Driver](https://oracle.github.io/node-oracledb/)
- [Class Validator](https://github.com/typestack/class-validator)
- [TypeORM (alternativa ao OracleDB puro)](https://typeorm.io/)

---

**Próximo passo recomendado**: Corrija os 4 problemas identificados e depois implemente a Fase 3 para ter o primeiro fluxo completo funcionando (importação via API → visualização no banco).
