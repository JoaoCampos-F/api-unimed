# 🚀 GUIA COMPLETO DE REFATORAÇÃO - API UNIMED

## 📋 ÍNDICE

1. [Preparação do Ambiente](#preparação-do-ambiente)
2. [Fase 1: Criação da Camada de Domínio](#fase-1-criação-da-camada-de-domínio)
3. [Fase 2: Implementação do Repository Pattern](#fase-2-implementação-do-repository-pattern)
4. [Fase 3: Criação da Camada de Use Cases](#fase-3-criação-da-camada-de-use-cases)
5. [Fase 4: Refatoração dos Services](#fase-4-refatoração-dos-services)
6. [Fase 5: Melhoria dos Controllers](#fase-5-melhoria-dos-controllers)
7. [Fase 6: Implementação de Configurações Seguras](#fase-6-implementação-de-configurações-seguras)
8. [Fase 7: Tratamento de Erros e Validações](#fase-7-tratamento-de-erros-e-validações)
9. [Fase 8: Implementação de Testes](#fase-8-implementação-de-testes)
10. [Fase 9: Performance e Observabilidade](#fase-9-performance-e-observabilidade)

---

## 🛠 PREPARAÇÃO DO AMBIENTE

### Instalar Dependências Adicionais

```bash
npm install --save class-validator class-transformer @nestjs/swagger
npm install --save-dev @types/jest jest supertest
```

### Nova Estrutura de Pastas

```
src/
├── common/                    # Utilitários compartilhados
│   ├── decorators/
│   ├── exceptions/
│   ├── filters/
│   ├── guards/
│   ├── interceptors/
│   └── utils/
├── config/                    # Configurações
├── domain/                    # Camada de domínio
│   ├── entities/
│   ├── value-objects/
│   ├── repositories/
│   └── services/
├── infrastructure/            # Camada de infraestrutura
│   ├── database/
│   ├── external-apis/
│   └── repositories/
├── application/              # Camada de aplicação
│   ├── use-cases/
│   ├── dtos/
│   └── services/
└── presentation/             # Camada de apresentação
    ├── controllers/
    └── middlewares/
```

---

## 🏗 FASE 1: CRIAÇÃO DA CAMADA DE DOMÍNIO

### **Passo 1.1: Criar Value Objects**

**Por que**: Value Objects garantem consistência e encapsulam validações específicas.

```typescript
// src/domain/value-objects/cnpj.value-object.ts
export class CNPJ {
  private readonly _value: string;

  constructor(value: string) {
    if (!this.isValid(value)) {
      throw new Error('CNPJ inválido');
    }
    this._value = this.format(value);
  }

  get value(): string {
    return this._value;
  }

  private isValid(cnpj: string): boolean {
    const cleanCnpj = cnpj.replace(/\D/g, '');
    if (cleanCnpj.length !== 14) return false;

    // Implementar validação de dígitos verificadores
    return true;
  }

  private format(cnpj: string): string {
    const clean = cnpj.replace(/\D/g, '');
    return clean.replace(
      /^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/,
      '$1.$2.$3/$4-$5',
    );
  }

  equals(other: CNPJ): boolean {
    return this._value === other._value;
  }

  toString(): string {
    return this._value;
  }
}
```

```typescript
// src/domain/value-objects/cpf.value-object.ts
export class CPF {
  private readonly _value: string;

  constructor(value: string) {
    if (!this.isValid(value)) {
      throw new Error('CPF inválido');
    }
    this._value = this.format(value);
  }

  get value(): string {
    return this._value;
  }

  private isValid(cpf: string): boolean {
    const cleanCpf = cpf.replace(/\D/g, '');
    if (cleanCpf.length !== 11) return false;

    // Implementar validação de dígitos verificadores
    return true;
  }

  private format(cpf: string): string {
    const clean = cpf.replace(/\D/g, '');
    return clean.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, '$1.$2.$3-$4');
  }

  equals(other: CPF): boolean {
    return this._value === other._value;
  }

  toString(): string {
    return this._value;
  }
}
```

```typescript
// src/domain/value-objects/periodo.value-object.ts
export class Periodo {
  constructor(
    private readonly mes: number,
    private readonly ano: number,
  ) {
    this.validate();
  }

  private validate(): void {
    if (this.mes < 1 || this.mes > 12) {
      throw new Error('Mês deve estar entre 1 e 12');
    }
    if (this.ano < 2000 || this.ano > 2100) {
      throw new Error('Ano inválido');
    }
  }

  get mesFormatado(): string {
    return this.mes.toString().padStart(2, '0');
  }

  get anoString(): string {
    return this.ano.toString();
  }

  get periodoFormatado(): string {
    return `${this.mesFormatado}${this.ano}`;
  }

  calcularMesReferencia(): Periodo {
    const mesAnterior = this.mes - 1;
    if (mesAnterior === 0) {
      return new Periodo(12, this.ano - 1);
    }
    return new Periodo(mesAnterior, this.ano);
  }

  equals(other: Periodo): boolean {
    return this.mes === other.mes && this.ano === other.ano;
  }
}
```

### **Passo 1.2: Criar Entities de Domínio**

**Por que**: Entities encapsulam comportamentos e regras de negócio.

```typescript
// src/domain/entities/empresa.entity.ts
import { CNPJ } from '../value-objects/cnpj.value-object';

export class Empresa {
  constructor(
    private readonly _codEmpresa: number,
    private readonly _codColigada: number,
    private readonly _codFilial: number,
    private readonly _codBand: number,
    private readonly _cnpj: CNPJ,
    private readonly _processaUnimed: boolean = true,
  ) {}

  get codEmpresa(): number {
    return this._codEmpresa;
  }

  get codColigada(): number {
    return this._codColigada;
  }

  get codFilial(): number {
    return this._codFilial;
  }

  get codBand(): number {
    return this._codBand;
  }

  get cnpj(): CNPJ {
    return this._cnpj;
  }

  get processaUnimed(): boolean {
    return this._processaUnimed;
  }

  podeProcessarUnimed(): boolean {
    return this._processaUnimed;
  }
}
```

```typescript
// src/domain/entities/beneficiario.entity.ts
import { CPF } from '../value-objects/cpf.value-object';

export class Beneficiario {
  constructor(
    private readonly _codBeneficiario: string,
    private readonly _nome: string,
    private readonly _cpf: CPF,
    private readonly _idade: number,
    private readonly _nascimento: Date,
    private readonly _inclusao: Date,
    private readonly _dependencia: string,
    private readonly _valorCobrado: number,
    private readonly _descricao: string,
  ) {}

  get codBeneficiario(): string {
    return this._codBeneficiario;
  }

  get nome(): string {
    return this._nome;
  }

  get cpf(): CPF {
    return this._cpf;
  }

  get idade(): number {
    return this._idade;
  }

  get valorCobrado(): number {
    return this._valorCobrado;
  }

  get descricaoSemAcentos(): string {
    return this.removerAcentos(this._descricao);
  }

  private removerAcentos(texto: string): string {
    return texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  }

  ehTitular(): boolean {
    return !this._dependencia || this._dependencia.trim() === '';
  }
}
```

### **Passo 1.3: Criar Interfaces de Repositório**

**Por que**: Implementa o Dependency Inversion Principle - depender de abstrações.

```typescript
// src/domain/repositories/empresa.repository.interface.ts
import { Empresa } from '../entities/empresa.entity';

export interface IEmpresaRepository {
  buscarEmpresasAtivasUnimed(): Promise<Empresa[]>;
  buscarPorCodigo(codEmpresa: number): Promise<Empresa | null>;
}
```

```typescript
// src/domain/repositories/dados-cobranca.repository.interface.ts
import { Beneficiario } from '../entities/beneficiario.entity';
import { Empresa } from '../entities/empresa.entity';
import { Periodo } from '../value-objects/periodo.value-object';

export interface IDadosCobrancaRepository {
  persistirBeneficiarios(
    beneficiarios: Beneficiario[],
    empresa: Empresa,
    periodo: Periodo,
  ): Promise<number>;

  limparDadosImportacao(empresa: Empresa, periodo: Periodo): Promise<number>;
}
```

---

## 🔄 FASE 2: IMPLEMENTAÇÃO DO REPOSITORY PATTERN

### **Passo 2.1: Implementar Repositórios Concretos**

**Por que**: Isola a lógica de acesso a dados da lógica de negócio.

```typescript
// src/infrastructure/repositories/empresa.repository.ts
import { Injectable } from '@nestjs/common';
import { IEmpresaRepository } from '../../domain/repositories/empresa.repository.interface';
import { Empresa } from '../../domain/entities/empresa.entity';
import { CNPJ } from '../../domain/value-objects/cnpj.value-object';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class EmpresaRepository implements IEmpresaRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  async buscarEmpresasAtivasUnimed(): Promise<Empresa[]> {
    const sql = `
      SELECT 
        ef.cod_empresa,
        ef.codcoligada,
        ef.codfilial,
        ef.cod_band,
        ef.cnpj
      FROM gc.empresa_filial ef
      WHERE ef.processa_unimed = 'S'
      ORDER BY ef.cod_band, ef.cod_empresa
    `;

    const resultado = await this.databaseService.executeQuery<any>(sql);

    return resultado.map(
      (row) =>
        new Empresa(
          row.COD_EMPRESA,
          row.CODCOLIGADA,
          row.CODFILIAL,
          row.COD_BAND,
          new CNPJ(row.CNPJ),
          true,
        ),
    );
  }

  async buscarPorCodigo(codEmpresa: number): Promise<Empresa | null> {
    const sql = `
      SELECT 
        ef.cod_empresa,
        ef.codcoligada,
        ef.codfilial,
        ef.cod_band,
        ef.cnpj,
        ef.processa_unimed
      FROM gc.empresa_filial ef
      WHERE ef.cod_empresa = :codEmpresa
    `;

    const resultado = await this.databaseService.executeQuery<any>(sql, {
      codEmpresa,
    });

    if (resultado.length === 0) return null;

    const row = resultado[0];
    return new Empresa(
      row.COD_EMPRESA,
      row.CODCOLIGADA,
      row.CODFILIAL,
      row.COD_BAND,
      new CNPJ(row.CNPJ),
      row.PROCESSA_UNIMED === 'S',
    );
  }
}
```

```typescript
// src/infrastructure/repositories/dados-cobranca.repository.ts
import { Injectable } from '@nestjs/common';
import { IDadosCobrancaRepository } from '../../domain/repositories/dados-cobranca.repository.interface';
import { Beneficiario } from '../../domain/entities/beneficiario.entity';
import { Empresa } from '../../domain/entities/empresa.entity';
import { Periodo } from '../../domain/value-objects/periodo.value-object';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class DadosCobrancaRepository implements IDadosCobrancaRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  async persistirBeneficiarios(
    beneficiarios: Beneficiario[],
    empresa: Empresa,
    periodo: Periodo,
  ): Promise<number> {
    if (beneficiarios.length === 0) return 0;

    const sql = `
      INSERT INTO gc.UNI_DADOS_COBRANCA (
        cod_empresa, codcoligada, codfilial, cod_band,
        codbeneficiario, beneficiario, idade, nascimento, inclusao,
        dependencia, cpf, valor, descricao,
        mes_import, ano_import, mes_ref, ano_ref, data_import
      ) VALUES (
        :cod_empresa, :codcoligada, :codfilial, :cod_band,
        :codbeneficiario, :beneficiario, :idade, :nascimento, :inclusao,
        :dependencia, :cpf, :valor, :descricao,
        :mes_import, :ano_import, :mes_ref, :ano_ref, SYSDATE
      )
    `;

    const periodoRef = periodo.calcularMesReferencia();
    const binds = beneficiarios.map((beneficiario) => ({
      cod_empresa: empresa.codEmpresa,
      codcoligada: empresa.codColigada,
      codfilial: empresa.codFilial,
      cod_band: empresa.codBand,
      codbeneficiario: beneficiario.codBeneficiario,
      beneficiario: beneficiario.nome,
      idade: beneficiario.idade,
      nascimento: beneficiario.nascimento,
      inclusao: beneficiario.inclusao,
      dependencia: beneficiario.dependencia?.trim() || null,
      cpf: beneficiario.cpf.value,
      valor: beneficiario.valorCobrado,
      descricao: beneficiario.descricaoSemAcentos,
      mes_import: periodo.mesFormatado,
      ano_import: periodo.anoString,
      mes_ref: periodoRef.mesFormatado,
      ano_ref: periodoRef.anoString,
    }));

    await this.databaseService.executeMany(sql, binds);
    return beneficiarios.length;
  }

  async limparDadosImportacao(
    empresa: Empresa,
    periodo: Periodo,
  ): Promise<number> {
    const sql = `
      DELETE FROM gc.uni_dados_cobranca
      WHERE cod_empresa = :codEmpresa
        AND codcoligada = :codColigada
        AND codfilial = :codFilial
        AND mes_import = :mes
        AND ano_import = :ano
    `;

    const binds = {
      codEmpresa: empresa.codEmpresa,
      codColigada: empresa.codColigada,
      codFilial: empresa.codFilial,
      mes: periodo.mesFormatado,
      ano: periodo.anoString,
    };

    return await this.databaseService.executeDelete(sql, binds);
  }
}
```

---

## 🎯 FASE 3: CRIAÇÃO DA CAMADA DE USE CASES

### **Passo 3.1: Criar DTOs de Aplicação**

**Por que**: Separa a representação externa dos dados da estrutura interna.

```typescript
// src/application/dtos/importar-dados-unimed.dto.ts
import { IsNumberString, IsNotEmpty, Min, Max } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class ImportarDadosUnimedDto {
  @ApiProperty({
    description: 'Mês de referência (1-12)',
    example: '01',
    pattern: '^(0[1-9]|1[0-2])$',
  })
  @IsNumberString({}, { message: 'Mês deve ser um número válido' })
  @IsNotEmpty({ message: 'Mês é obrigatório' })
  @Transform(({ value }) => value.padStart(2, '0'))
  mes: string;

  @ApiProperty({
    description: 'Ano de referência',
    example: '2024',
    minimum: 2020,
    maximum: 2030,
  })
  @IsNumberString({}, { message: 'Ano deve ser um número válido' })
  @IsNotEmpty({ message: 'Ano é obrigatório' })
  ano: string;
}
```

### **Passo 3.2: Criar Use Cases**

**Por que**: Implementa o Single Responsibility Principle - cada use case tem uma única responsabilidade.

```typescript
// src/application/use-cases/importar-dados-unimed.use-case.ts
import { Injectable, Logger } from '@nestjs/common';
import { IEmpresaRepository } from '../../domain/repositories/empresa.repository.interface';
import { IDadosCobrancaRepository } from '../../domain/repositories/dados-cobranca.repository.interface';
import { Periodo } from '../../domain/value-objects/periodo.value-object';
import { UnimedApiService } from '../../infrastructure/external-apis/unimed-api.service';
import { BeneficiarioFactory } from '../factories/beneficiario.factory';

export interface ImportarDadosUnimedRequest {
  mes: number;
  ano: number;
}

export interface ImportarDadosUnimedResponse {
  totalEmpresas: number;
  totalRegistros: number;
  empresasProcessadas: number;
  erros: string[];
}

@Injectable()
export class ImportarDadosUnimedUseCase {
  private readonly logger = new Logger(ImportarDadosUnimedUseCase.name);

  constructor(
    private readonly empresaRepository: IEmpresaRepository,
    private readonly dadosCobrancaRepository: IDadosCobrancaRepository,
    private readonly unimedApiService: UnimedApiService,
    private readonly beneficiarioFactory: BeneficiarioFactory,
  ) {}

  async execute(
    request: ImportarDadosUnimedRequest,
  ): Promise<ImportarDadosUnimedResponse> {
    const periodo = new Periodo(request.mes, request.ano);

    this.logger.log(
      `Iniciando importação para período: ${periodo.periodoFormatado}`,
    );

    const empresas = await this.empresaRepository.buscarEmpresasAtivasUnimed();

    if (empresas.length === 0) {
      this.logger.warn('Nenhuma empresa encontrada para importação');
      return {
        totalEmpresas: 0,
        totalRegistros: 0,
        empresasProcessadas: 0,
        erros: ['Nenhuma empresa encontrada para importação'],
      };
    }

    let totalRegistros = 0;
    let empresasProcessadas = 0;
    const erros: string[] = [];

    for (const empresa of empresas) {
      try {
        const registrosProcessados = await this.processarEmpresa(
          empresa,
          periodo,
        );
        totalRegistros += registrosProcessados;
        empresasProcessadas++;

        this.logger.log(
          `Empresa ${empresa.codEmpresa} processada: ${registrosProcessados} registros`,
        );
      } catch (error) {
        const mensagemErro = `Erro ao processar empresa ${empresa.codEmpresa}: ${error.message}`;
        this.logger.error(mensagemErro);
        erros.push(mensagemErro);
      }
    }

    this.logger.log(
      `Importação concluída: ${empresasProcessadas}/${empresas.length} empresas, ${totalRegistros} registros`,
    );

    return {
      totalEmpresas: empresas.length,
      totalRegistros,
      empresasProcessadas,
      erros,
    };
  }

  private async processarEmpresa(
    empresa: Empresa,
    periodo: Periodo,
  ): Promise<number> {
    // 1. Limpar dados anteriores
    const registrosLimpos =
      await this.dadosCobrancaRepository.limparDadosImportacao(
        empresa,
        periodo,
      );

    this.logger.debug(
      `Empresa ${empresa.codEmpresa}: ${registrosLimpos} registros limpos`,
    );

    // 2. Buscar novos dados
    const dadosUnimed = await this.unimedApiService.buscarPorPeriodoCnpj(
      periodo.periodoFormatado,
      empresa.cnpj.value,
    );

    // 3. Converter e validar dados
    const beneficiarios =
      this.beneficiarioFactory.criarDeDemonstrativo(dadosUnimed);

    // 4. Persistir dados
    const registrosInseridos =
      await this.dadosCobrancaRepository.persistirBeneficiarios(
        beneficiarios,
        empresa,
        periodo,
      );

    return registrosInseridos;
  }
}
```

```typescript
// src/application/use-cases/executar-resumo-unimed.use-case.ts
import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from '../../infrastructure/database/database.service';
import { Periodo } from '../../domain/value-objects/periodo.value-object';

export interface ExecutarResumoUnimedRequest {
  mes: number;
  ano: number;
}

export interface ExecutarResumoUnimedResponse {
  sucesso: boolean;
  mensagem: string;
}

@Injectable()
export class ExecutarResumoUnimedUseCase {
  private readonly logger = new Logger(ExecutarResumoUnimedUseCase.name);

  constructor(private readonly databaseService: DatabaseService) {}

  async execute(
    request: ExecutarResumoUnimedRequest,
  ): Promise<ExecutarResumoUnimedResponse> {
    try {
      const periodo = new Periodo(request.mes, request.ano);
      const periodoRef = periodo.calcularMesReferencia();

      this.logger.log(
        `Executando resumo para período de referência: ${periodoRef.mesFormatado}/${periodoRef.anoString}`,
      );

      const plsql = `
        BEGIN
          gc.PKG_UNI_SAUDE.p_uni_resumo(:mes_ref, :ano_ref);
        END;
      `;

      const binds = {
        mes_ref: parseInt(periodoRef.mesFormatado, 10),
        ano_ref: parseInt(periodoRef.anoString, 10),
      };

      await this.databaseService.executeProcedure(plsql, binds);

      const mensagem = `Resumo de dados executado com sucesso para ${periodoRef.mesFormatado}/${periodoRef.anoString}`;
      this.logger.log(mensagem);

      return {
        sucesso: true,
        mensagem,
      };
    } catch (error) {
      const mensagemErro = `Erro ao executar resumo: ${error.message}`;
      this.logger.error(mensagemErro);

      return {
        sucesso: false,
        mensagem: mensagemErro,
      };
    }
  }
}
```

### **Passo 3.3: Criar Factory para Beneficiários**

**Por que**: Centraliza a lógica de criação de objetos complexos.

```typescript
// src/application/factories/beneficiario.factory.ts
import { Injectable } from '@nestjs/common';
import { Beneficiario } from '../../domain/entities/beneficiario.entity';
import { CPF } from '../../domain/value-objects/cpf.value-object';
import { DemonstrativoDto } from '../dtos/demonstrativo.dto';

@Injectable()
export class BeneficiarioFactory {
  criarDeDemonstrativo(demonstrativo: DemonstrativoDto): Beneficiario[] {
    if (
      !demonstrativo.mensalidades ||
      demonstrativo.mensalidades.length === 0
    ) {
      return [];
    }

    const beneficiarios: Beneficiario[] = [];

    for (const mensalidade of demonstrativo.mensalidades) {
      if (mensalidade.composicoes) {
        for (const composicao of mensalidade.composicoes) {
          try {
            const beneficiario = new Beneficiario(
              composicao.codbeneficiario,
              composicao.beneficiario,
              new CPF(composicao.cpf),
              parseInt(composicao.idade, 10),
              new Date(composicao.nascimento),
              new Date(composicao.inclusao),
              composicao.dependencia,
              composicao.valorcobrado,
              composicao.descricao,
            );

            beneficiarios.push(beneficiario);
          } catch (error) {
            // Log do erro mas continua processamento
            console.warn(
              `Erro ao criar beneficiário ${composicao.codbeneficiario}: ${error.message}`,
            );
          }
        }
      }
    }

    return beneficiarios;
  }
}
```

---

## 🔧 FASE 4: REFATORAÇÃO DOS SERVICES

### **Passo 4.1: Refatorar UnimedApiService**

**Por que**: Aplicar Single Responsibility Principle e melhorar segurança.

```typescript
// src/infrastructure/external-apis/unimed-api.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';
import { DemonstrativoDto } from '../../application/dtos/demonstrativo.dto';

@Injectable()
export class UnimedApiService {
  private readonly logger = new Logger(UnimedApiService.name);
  private readonly apiClient: AxiosInstance;
  private token: string | null = null;

  constructor(private readonly configService: ConfigService) {
    const baseURL = this.configService.get<string>('UNIMED_API_URL');
    if (!baseURL) {
      throw new Error('UNIMED_API_URL não configurada');
    }

    this.apiClient = axios.create({
      baseURL,
      timeout: 30000, // 30 segundos
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  async buscarPorPeriodoCnpj(
    periodo: string,
    cnpj: string,
  ): Promise<DemonstrativoDto> {
    try {
      await this.ensureValidToken();

      const response = await this.apiClient.get<DemonstrativoDto>(
        '/Demonstrativo/buscaporperiodocnpj',
        {
          params: { periodo, cnpj },
          headers: { Authorization: `Bearer ${this.token}` },
        },
      );

      this.logger.debug(`Dados obtidos para CNPJ ${cnpj}, período ${periodo}`);
      return response.data;
    } catch (error) {
      if (error?.response?.status === 401) {
        this.token = null;
        return this.buscarPorPeriodoCnpj(periodo, cnpj); // Retry uma vez
      }

      this.logger.error(
        `Erro ao buscar dados para CNPJ ${cnpj}, período ${periodo}`,
        error.response?.data || error.message,
      );

      throw new Error(
        `Dados não encontrados: ${error.response?.data || error.message}`,
      );
    }
  }

  async buscarPorPeriodoContrato(
    periodo: string,
    contrato: string,
  ): Promise<DemonstrativoDto> {
    try {
      await this.ensureValidToken();

      const response = await this.apiClient.get<DemonstrativoDto>(
        '/Demonstrativo/BuscarPorPeriodoContrato',
        {
          params: { periodo, contrato },
          headers: { Authorization: `Bearer ${this.token}` },
        },
      );

      this.logger.debug(
        `Dados obtidos para contrato ${contrato}, período ${periodo}`,
      );
      return response.data;
    } catch (error) {
      if (error?.response?.status === 401) {
        this.token = null;
        return this.buscarPorPeriodoContrato(periodo, contrato); // Retry uma vez
      }

      this.logger.error(
        `Erro ao buscar dados para contrato ${contrato}, período ${periodo}`,
        error.response?.data || error.message,
      );

      throw new Error(
        `Dados não encontrados: ${error.response?.data || error.message}`,
      );
    }
  }

  private async ensureValidToken(): Promise<void> {
    if (!this.token) {
      await this.obterToken();
    }
  }

  private async obterToken(): Promise<void> {
    try {
      const usuario = this.configService.get<string>('UNIMED_API_USER');
      const senha = this.configService.get<string>('UNIMED_API_PASSWORD');

      if (!usuario || !senha) {
        throw new Error('Credenciais da API Unimed não configuradas');
      }

      const response = await this.apiClient.post<string>(
        '/Token/geratoken',
        {},
        {
          headers: { usuario, senha },
        },
      );

      this.token = response.data;
      this.logger.log('Token obtido com sucesso');
    } catch (error) {
      this.logger.error(
        'Erro ao obter token',
        error.response?.data || error.message,
      );
      throw new Error('Falha na autenticação com a API Unimed');
    }
  }
}
```

---

## 🎮 FASE 5: MELHORIA DOS CONTROLLERS

### **Passo 5.1: Refatorar ImportacaoController**

**Por que**: Aplicar Single Responsibility e melhorar tratamento de erros.

```typescript
// src/presentation/controllers/importacao.controller.ts
import {
  Controller,
  Get,
  Query,
  HttpStatus,
  HttpException,
  UseFilters,
  UseInterceptors,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ImportarDadosUnimedDto } from '../../application/dtos/importar-dados-unimed.dto';
import { ImportarDadosUnimedUseCase } from '../../application/use-cases/importar-dados-unimed.use-case';
import { ExecutarResumoUnimedUseCase } from '../../application/use-cases/executar-resumo-unimed.use-case';
import { BuscarEmpresasUnimedUseCase } from '../../application/use-cases/buscar-empresas-unimed.use-case';
import { GlobalExceptionFilter } from '../../common/filters/global-exception.filter';
import { LoggingInterceptor } from '../../common/interceptors/logging.interceptor';

@ApiTags('Importação Unimed')
@Controller('importacao')
@UseFilters(GlobalExceptionFilter)
@UseInterceptors(LoggingInterceptor)
export class ImportacaoController {
  constructor(
    private readonly importarDadosUnimedUseCase: ImportarDadosUnimedUseCase,
    private readonly executarResumoUnimedUseCase: ExecutarResumoUnimedUseCase,
    private readonly buscarEmpresasUnimedUseCase: BuscarEmpresasUnimedUseCase,
  ) {}

  @Get('dados-periodo-cnpj')
  @ApiOperation({
    summary: 'Importar dados Unimed por período',
    description:
      'Importa dados de cobrança da Unimed para todas as empresas ativas no período especificado',
  })
  @ApiResponse({
    status: 200,
    description: 'Importação realizada com sucesso',
    schema: {
      type: 'object',
      properties: {
        totalEmpresas: { type: 'number', example: 5 },
        totalRegistros: { type: 'number', example: 150 },
        empresasProcessadas: { type: 'number', example: 5 },
        erros: { type: 'array', items: { type: 'string' } },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Parâmetros inválidos' })
  @ApiResponse({ status: 500, description: 'Erro interno do servidor' })
  async importarDadosPeriodo(@Query() params: ImportarDadosUnimedDto) {
    try {
      const request = {
        mes: parseInt(params.mes, 10),
        ano: parseInt(params.ano, 10),
      };

      const resultado = await this.importarDadosUnimedUseCase.execute(request);

      return {
        sucesso: true,
        dados: resultado,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      throw new HttpException(
        `Erro na importação: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('empresas-unimed')
  @ApiOperation({
    summary: 'Buscar empresas Unimed',
    description: 'Retorna lista de empresas ativas para processamento Unimed',
  })
  async buscarEmpresasUnimed() {
    try {
      const empresas = await this.buscarEmpresasUnimedUseCase.execute();

      return {
        sucesso: true,
        dados: empresas,
        total: empresas.length,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      throw new HttpException(
        `Erro ao buscar empresas: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('executar-resumo')
  @ApiOperation({
    summary: 'Executar resumo Unimed',
    description: 'Executa o procedimento de resumo dos dados importados',
  })
  async executarResumo(@Query() params: ImportarDadosUnimedDto) {
    try {
      const request = {
        mes: parseInt(params.mes, 10),
        ano: parseInt(params.ano, 10),
      };

      const resultado = await this.executarResumoUnimedUseCase.execute(request);

      return {
        sucesso: resultado.sucesso,
        mensagem: resultado.mensagem,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      throw new HttpException(
        `Erro ao executar resumo: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
```

---

## 🔐 FASE 6: IMPLEMENTAÇÃO DE CONFIGURAÇÕES SEGURAS

### **Passo 6.1: Criar Configuração Tipada**

**Por que**: Centraliza e valida configurações, remove hardcoding.

```typescript
// src/config/app.config.ts
import { registerAs } from '@nestjs/config';
import { IsString, IsNumber, IsNotEmpty, validateSync } from 'class-validator';
import { plainToClass } from 'class-transformer';

class AppConfig {
  @IsString()
  @IsNotEmpty()
  DATABASE_USER: string;

  @IsString()
  @IsNotEmpty()
  DATABASE_PASSWORD: string;

  @IsString()
  @IsNotEmpty()
  DATABASE_CONNECT_STRING: string;

  @IsString()
  @IsNotEmpty()
  UNIMED_API_URL: string;

  @IsString()
  @IsNotEmpty()
  UNIMED_API_USER: string;

  @IsString()
  @IsNotEmpty()
  UNIMED_API_PASSWORD: string;

  @IsNumber()
  DATABASE_POOL_MIN: number = 2;

  @IsNumber()
  DATABASE_POOL_MAX: number = 10;

  @IsNumber()
  API_TIMEOUT: number = 30000;
}

export default registerAs('app', (): AppConfig => {
  const config = plainToClass(AppConfig, {
    DATABASE_USER: process.env.DB_USER,
    DATABASE_PASSWORD: process.env.DB_PASSWORD,
    DATABASE_CONNECT_STRING: process.env.DB_CONNECT_STRING,
    UNIMED_API_URL: process.env.UNIMED_API_URL,
    UNIMED_API_USER: process.env.UNIMED_API_USER,
    UNIMED_API_PASSWORD: process.env.UNIMED_API_PASSWORD,
    DATABASE_POOL_MIN: parseInt(process.env.DB_POOL_MIN || '2', 10),
    DATABASE_POOL_MAX: parseInt(process.env.DB_POOL_MAX || '10', 10),
    API_TIMEOUT: parseInt(process.env.API_TIMEOUT || '30000', 10),
  });

  const errors = validateSync(config);
  if (errors.length > 0) {
    throw new Error(
      `Configuração inválida: ${errors.map((e) => Object.values(e.constraints)).join(', ')}`,
    );
  }

  return config;
});
```

### **Passo 6.2: Criar arquivo .env.example**

```env
# .env.example
# Configurações do Banco de Dados Oracle
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_CONNECT_STRING=your_connection_string
DB_POOL_MIN=2
DB_POOL_MAX=10

# Configurações da API Unimed
UNIMED_API_URL=https://api.unimed.com.br
UNIMED_API_USER=your_api_user
UNIMED_API_PASSWORD=your_api_password
API_TIMEOUT=30000

# Configurações da Aplicação
NODE_ENV=development
PORT=3000
LOG_LEVEL=info
```

---

## ⚠️ FASE 7: TRATAMENTO DE ERROS E VALIDAÇÕES

### **Passo 7.1: Criar Exception Customizadas**

```typescript
// src/common/exceptions/domain.exceptions.ts
export class DomainException extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DomainException';
  }
}

export class InvalidCnpjException extends DomainException {
  constructor(cnpj: string) {
    super(`CNPJ inválido: ${cnpj}`);
    this.name = 'InvalidCnpjException';
  }
}

export class InvalidCpfException extends DomainException {
  constructor(cpf: string) {
    super(`CPF inválido: ${cpf}`);
    this.name = 'InvalidCpfException';
  }
}

export class EmpresaNotFoundException extends DomainException {
  constructor(codEmpresa: number) {
    super(`Empresa não encontrada: ${codEmpresa}`);
    this.name = 'EmpresaNotFoundException';
  }
}
```

### **Passo 7.2: Criar Global Exception Filter**

```typescript
// src/common/filters/global-exception.filter.ts
import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { DomainException } from '../exceptions/domain.exceptions';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Erro interno do servidor';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      message = exception.message;
    } else if (exception instanceof DomainException) {
      status = HttpStatus.BAD_REQUEST;
      message = exception.message;
    } else if (exception instanceof Error) {
      message = exception.message;
    }

    const errorResponse = {
      sucesso: false,
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message,
    };

    this.logger.error(
      `${request.method} ${request.url} - ${status} - ${message}`,
      exception instanceof Error ? exception.stack : exception,
    );

    response.status(status).json(errorResponse);
  }
}
```

### **Passo 7.3: Criar Logging Interceptor**

```typescript
// src/common/interceptors/logging.interceptor.ts
import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request } from 'express';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();
    const method = request.method;
    const url = request.url;
    const now = Date.now();

    this.logger.log(`${method} ${url} - Iniciado`);

    return next.handle().pipe(
      tap(() => {
        const duration = Date.now() - now;
        this.logger.log(`${method} ${url} - Concluído em ${duration}ms`);
      }),
    );
  }
}
```

---

## 🧪 FASE 8: IMPLEMENTAÇÃO DE TESTES

### **Passo 8.1: Configurar Jest**

```typescript
// jest.config.js
module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: 'src',
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  collectCoverageFrom: [
    '**/*.(t|j)s',
    '!**/*.spec.ts',
    '!**/*.interface.ts',
    '!**/node_modules/**',
  ],
  coverageDirectory: '../coverage',
  testEnvironment: 'node',
  moduleNameMapping: {
    '^src/(.*)$': '<rootDir>/$1',
  },
};
```

### **Passo 8.2: Criar Testes Unitários**

```typescript
// src/domain/value-objects/__tests__/cnpj.value-object.spec.ts
import { CNPJ } from '../cnpj.value-object';

describe('CNPJ Value Object', () => {
  describe('criação válida', () => {
    it('deve criar CNPJ válido com formatação', () => {
      const cnpj = new CNPJ('11222333000181');
      expect(cnpj.value).toBe('11.222.333/0001-81');
    });

    it('deve criar CNPJ já formatado', () => {
      const cnpj = new CNPJ('11.222.333/0001-81');
      expect(cnpj.value).toBe('11.222.333/0001-81');
    });
  });

  describe('validação', () => {
    it('deve rejeitar CNPJ com menos de 14 dígitos', () => {
      expect(() => new CNPJ('1122233300018')).toThrow('CNPJ inválido');
    });

    it('deve rejeitar CNPJ com mais de 14 dígitos', () => {
      expect(() => new CNPJ('112223330001811')).toThrow('CNPJ inválido');
    });

    it('deve rejeitar CNPJ vazio', () => {
      expect(() => new CNPJ('')).toThrow('CNPJ inválido');
    });
  });

  describe('comparação', () => {
    it('deve identificar CNPJs iguais', () => {
      const cnpj1 = new CNPJ('11222333000181');
      const cnpj2 = new CNPJ('11.222.333/0001-81');
      expect(cnpj1.equals(cnpj2)).toBe(true);
    });

    it('deve identificar CNPJs diferentes', () => {
      const cnpj1 = new CNPJ('11222333000181');
      const cnpj2 = new CNPJ('11222333000182');
      expect(cnpj1.equals(cnpj2)).toBe(false);
    });
  });
});
```

```typescript
// src/application/use-cases/__tests__/importar-dados-unimed.use-case.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { ImportarDadosUnimedUseCase } from '../importar-dados-unimed.use-case';
import { IEmpresaRepository } from '../../../domain/repositories/empresa.repository.interface';
import { IDadosCobrancaRepository } from '../../../domain/repositories/dados-cobranca.repository.interface';
import { UnimedApiService } from '../../../infrastructure/external-apis/unimed-api.service';
import { BeneficiarioFactory } from '../../factories/beneficiario.factory';

describe('ImportarDadosUnimedUseCase', () => {
  let useCase: ImportarDadosUnimedUseCase;
  let empresaRepository: jest.Mocked<IEmpresaRepository>;
  let dadosCobrancaRepository: jest.Mocked<IDadosCobrancaRepository>;
  let unimedApiService: jest.Mocked<UnimedApiService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ImportarDadosUnimedUseCase,
        {
          provide: 'IEmpresaRepository',
          useValue: {
            buscarEmpresasAtivasUnimed: jest.fn(),
          },
        },
        {
          provide: 'IDadosCobrancaRepository',
          useValue: {
            limparDadosImportacao: jest.fn(),
            persistirBeneficiarios: jest.fn(),
          },
        },
        {
          provide: UnimedApiService,
          useValue: {
            buscarPorPeriodoCnpj: jest.fn(),
          },
        },
        {
          provide: BeneficiarioFactory,
          useValue: {
            criarDeDemonstrativo: jest.fn(),
          },
        },
      ],
    }).compile();

    useCase = module.get<ImportarDadosUnimedUseCase>(
      ImportarDadosUnimedUseCase,
    );
    empresaRepository = module.get('IEmpresaRepository');
    dadosCobrancaRepository = module.get('IDadosCobrancaRepository');
    unimedApiService = module.get(UnimedApiService);
  });

  describe('execute', () => {
    it('deve retornar erro quando não há empresas', async () => {
      empresaRepository.buscarEmpresasAtivasUnimed.mockResolvedValue([]);

      const resultado = await useCase.execute({ mes: 1, ano: 2024 });

      expect(resultado.totalEmpresas).toBe(0);
      expect(resultado.erros).toContain(
        'Nenhuma empresa encontrada para importação',
      );
    });

    it('deve processar empresas com sucesso', async () => {
      const empresaMock = {
        codEmpresa: 1,
        cnpj: { value: '11.222.333/0001-81' },
      };

      empresaRepository.buscarEmpresasAtivasUnimed.mockResolvedValue([
        empresaMock,
      ]);
      dadosCobrancaRepository.limparDadosImportacao.mockResolvedValue(5);
      unimedApiService.buscarPorPeriodoCnpj.mockResolvedValue({} as any);
      dadosCobrancaRepository.persistirBeneficiarios.mockResolvedValue(10);

      const resultado = await useCase.execute({ mes: 1, ano: 2024 });

      expect(resultado.totalEmpresas).toBe(1);
      expect(resultado.empresasProcessadas).toBe(1);
      expect(resultado.totalRegistros).toBe(10);
    });
  });
});
```

---

## ⚡ FASE 9: PERFORMANCE E OBSERVABILIDADE

### **Passo 9.1: Implementar Processamento Assíncrono**

```typescript
// src/application/use-cases/importar-dados-unimed-async.use-case.ts
import { Injectable, Logger } from '@nestjs/common';
import { ImportarDadosUnimedUseCase } from './importar-dados-unimed.use-case';

@Injectable()
export class ImportarDadosUnimedAsyncUseCase {
  private readonly logger = new Logger(ImportarDadosUnimedAsyncUseCase.name);

  constructor(
    private readonly importarDadosUnimedUseCase: ImportarDadosUnimedUseCase,
  ) {}

  async execute(request: {
    mes: number;
    ano: number;
  }): Promise<{ jobId: string }> {
    const jobId = `import-${Date.now()}`;

    this.logger.log(`Iniciando importação assíncrona - Job ID: ${jobId}`);

    // Processar em background sem bloquear a resposta
    setImmediate(async () => {
      try {
        const resultado =
          await this.importarDadosUnimedUseCase.execute(request);
        this.logger.log(`Job ${jobId} concluído com sucesso`, resultado);
      } catch (error) {
        this.logger.error(`Job ${jobId} falhou`, error);
      }
    });

    return { jobId };
  }
}
```

### **Passo 9.2: Implementar Health Check**

```typescript
// src/common/health/health.controller.ts
import { Controller, Get } from '@nestjs/common';
import {
  HealthCheckService,
  HealthCheck,
  TypeOrmHealthIndicator,
  HttpHealthIndicator,
} from '@nestjs/terminus';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private http: HttpHealthIndicator,
  ) {}

  @Get()
  @HealthCheck()
  check() {
    return this.health.check([
      () => this.http.pingCheck('unimed-api', process.env.UNIMED_API_URL),
    ]);
  }
}
```

---

## 📚 MÓDULOS E INJEÇÃO DE DEPENDÊNCIA

### **Passo 10.1: Reorganizar Módulos**

```typescript
// src/app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { InfrastructureModule } from './infrastructure/infrastructure.module';
import { ApplicationModule } from './application/application.module';
import { PresentationModule } from './presentation/presentation.module';
import appConfig from './config/app.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig],
      validationSchema: null, // Configurar Joi se necessário
    }),
    InfrastructureModule,
    ApplicationModule,
    PresentationModule,
  ],
})
export class AppModule {}
```

```typescript
// src/infrastructure/infrastructure.module.ts
import { Module } from '@nestjs/common';
import { DatabaseModule } from './database/database.module';
import { EmpresaRepository } from './repositories/empresa.repository';
import { DadosCobrancaRepository } from './repositories/dados-cobranca.repository';
import { UnimedApiService } from './external-apis/unimed-api.service';

@Module({
  imports: [DatabaseModule],
  providers: [
    {
      provide: 'IEmpresaRepository',
      useClass: EmpresaRepository,
    },
    {
      provide: 'IDadosCobrancaRepository',
      useClass: DadosCobrancaRepository,
    },
    UnimedApiService,
  ],
  exports: ['IEmpresaRepository', 'IDadosCobrancaRepository', UnimedApiService],
})
export class InfrastructureModule {}
```

```typescript
// src/application/application.module.ts
import { Module } from '@nestjs/common';
import { InfrastructureModule } from '../infrastructure/infrastructure.module';
import { ImportarDadosUnimedUseCase } from './use-cases/importar-dados-unimed.use-case';
import { ExecutarResumoUnimedUseCase } from './use-cases/executar-resumo-unimed.use-case';
import { BeneficiarioFactory } from './factories/beneficiario.factory';

@Module({
  imports: [InfrastructureModule],
  providers: [
    ImportarDadosUnimedUseCase,
    ExecutarResumoUnimedUseCase,
    BeneficiarioFactory,
  ],
  exports: [ImportarDadosUnimedUseCase, ExecutarResumoUnimedUseCase],
})
export class ApplicationModule {}
```

---

## 🎯 CHECKLIST DE IMPLEMENTAÇÃO

### ✅ **FASE 1 - DOMÍNIO**

- [ ] Criar Value Objects (CNPJ, CPF, Periodo)
- [ ] Criar Entities (Empresa, Beneficiario)
- [ ] Criar Interfaces de Repository
- [ ] Criar Domain Services se necessário

### ✅ **FASE 2 - INFRAESTRUTURA**

- [ ] Implementar Repositórios Concretos
- [ ] Refatorar DatabaseService
- [ ] Configurar Injeção de Dependência

### ✅ **FASE 3 - APLICAÇÃO**

- [ ] Criar DTOs de Application
- [ ] Implementar Use Cases
- [ ] Criar Factories

### ✅ **FASE 4 - APRESENTAÇÃO**

- [ ] Refatorar Controllers
- [ ] Implementar Validações
- [ ] Adicionar Swagger/OpenAPI

### ✅ **FASE 5 - QUALIDADE**

- [ ] Configurar ESLint/Prettier
- [ ] Implementar Testes Unitários
- [ ] Implementar Testes de Integração
- [ ] Configurar Coverage

### ✅ **FASE 6 - SEGURANÇA**

- [ ] Remover Hardcoding
- [ ] Implementar Configuração Tipada
- [ ] Validar Variáveis de Ambiente

### ✅ **FASE 7 - OBSERVABILIDADE**

- [ ] Implementar Logging Estruturado
- [ ] Adicionar Health Checks
- [ ] Configurar Métricas

---

## 🚀 COMO EXECUTAR A REFATORAÇÃO

### **Estratégia Incremental Recomendada:**

1. **Semana 1-2**: Implementar Fases 1 e 2 (Domínio + Repository)
2. **Semana 3**: Implementar Fase 3 (Use Cases)
3. **Semana 4**: Implementar Fase 4 (Controllers)
4. **Semana 5**: Implementar Fase 5-6 (Configurações + Validações)
5. **Semana 6**: Implementar Fase 7-8 (Testes + Performance)

### **Comandos Úteis:**

```bash
# Executar testes
npm run test

# Executar com coverage
npm run test:cov

# Linting
npm run lint

# Build
npm run build

# Start em desenvolvimento
npm run start:dev
```

---

## 📖 **BENEFÍCIOS ALCANÇADOS**

✅ **SOLID Principles aplicados**
✅ **Separação clara de responsabilidades**
✅ **Código testável e maintível**
✅ **Configuração segura**
✅ **Tratamento robusto de erros**
✅ **Performance otimizada**
✅ **Observabilidade completa**
✅ **Documentação automática**

Este guia garante uma refatoração completa seguindo as melhores práticas de desenvolvimento, resultando em um código mais limpo, testável e maintível.
