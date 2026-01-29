# 📚 GUIA DE ESTUDO DIDÁTICO - ARQUITETURA E CONCEITOS DE PROJETO

## 🎯 OBJETIVO DESTE GUIA

Este guia tem como objetivo explicar de forma didática e prática os conceitos fundamentais de arquitetura de software aplicados no projeto **API-UNIMED**, ajudando você a entender:

- ✅ **O que é** cada conceito e **por que** existe
- ✅ **Como** está sendo aplicado no projeto atual
- ✅ **Como aplicar** estes conceitos em outros projetos
- ✅ **Exemplos práticos** e comparações antes/depois

---

## 📋 ÍNDICE

1. [Fundamentos de Arquitetura](#1-fundamentos-de-arquitetura)
2. [Princípios SOLID](#2-princípios-solid)
3. [Clean Architecture](#3-clean-architecture)
4. [Conceitos Práticos](#4-conceitos-práticos)
5. [Análise do Projeto Atual](#5-análise-do-projeto-atual)
6. [Melhorias Propostas](#6-melhorias-propostas)
7. [Como Aplicar em Outros Projetos](#7-como-aplicar-em-outros-projetos)

---

## 1. FUNDAMENTOS DE ARQUITETURA

### 🤔 O que é Arquitetura de Software?

**Definição Simples**: É a forma como organizamos e estruturamos nosso código para que ele seja:
- **Fácil de entender**
- **Fácil de manter**
- **Fácil de testar**
- **Fácil de modificar**

### 🏗 Analogia com Construção Civil

Imagine construir uma casa:

```
🏠 CASA MAL PLANEJADA          |  🏡 CASA BEM PLANEJADA
------------------------------ | ------------------------------
• Tudo em um cômodo só         | • Cada cômodo tem sua função
• Canos e fios expostos        | • Infraestrutura bem organizada
• Difícil de reformar          | • Fácil de fazer mudanças
• Problemas em cascata         | • Problemas isolados
```

### 💻 Traduzindo para Software

```typescript
// ❌ CÓDIGO MAL ARQUITETADO (tudo em um lugar)
@Controller()
export class ImportacaoController {
  @Get('busca-dados')
  async buscarDados(@Query() params: any) {
    // Validação misturada com lógica
    if (!params.mes) throw new Error('Mês obrigatório');
    
    // Acesso direto ao banco
    const sql = "SELECT * FROM empresas WHERE ativo='S'";
    const empresas = await this.db.query(sql);
    
    // Chamada de API misturada
    for (const empresa of empresas) {
      const dados = await axios.get(`${this.apiUrl}/dados/${empresa.cnpj}`);
      await this.db.query("INSERT INTO dados...", dados);
    }
    
    return { success: true };
  }
}
```

```typescript
// ✅ CÓDIGO BEM ARQUITETADO (responsabilidades separadas)
@Controller()
export class ImportacaoController {
  constructor(
    private readonly importarDadosUseCase: ImportarDadosUseCase
  ) {}

  @Get('busca-dados')
  async buscarDados(@Query() params: ImportarDadosDto) {
    // Apenas coordena a operação
    const resultado = await this.importarDadosUseCase.execute(params);
    return resultado;
  }
}

// Lógica de negócio separada
@Injectable()
export class ImportarDadosUseCase {
  constructor(
    private readonly empresaRepository: IEmpresaRepository,
    private readonly unimedService: IUnimedApiService
  ) {}

  async execute(params: ImportarDadosDto): Promise<ResultadoImportacao> {
    // Cada responsabilidade em seu lugar
    const empresas = await this.empresaRepository.buscarAtivas();
    const dados = await this.unimedService.buscarDados(params);
    // ... lógica clara e testável
  }
}
```

---

## 2. PRINCÍPIOS SOLID

### 🎯 O que é SOLID?

**SOLID** são 5 princípios que nos ajudam a escrever código mais limpo e organizado:

### **S** - Single Responsibility Principle (Responsabilidade Única)

**📖 Definição**: Cada classe deve ter apenas **uma razão para mudar**.

**🤔 Na prática**: Uma classe deve fazer apenas **uma coisa bem feita**.

#### Exemplo do Projeto Atual:

```typescript
// ❌ PROBLEMA ATUAL: Classe faz muitas coisas
export class UnimedImportService {
  // 1. Coordena importação
  async importarPorCnpj(dto: ImportUnimedDto) { }
  
  // 2. Chama API externa
  async buscarDadosUnimed() { }
  
  // 3. Limpa dados do banco
  async limparDadosImportacao() { }
  
  // 4. Salva no banco
  async salvarDados() { }
  
  // 5. Calcula valores
  async calcularMesRef() { }
}
```

```typescript
// ✅ SOLUÇÃO: Separar responsabilidades
// 1. Coordenação
export class ImportarDadosUseCase {
  async execute(params: ImportarDadosDto) {
    // Apenas orquestra o fluxo
  }
}

// 2. Comunicação externa
export class UnimedApiService {
  async buscarDados(periodo: string, cnpj: string) {
    // Apenas chama a API
  }
}

// 3. Acesso a dados
export class DadosCobrancaRepository {
  async salvar(dados: DadosCobranca[]) {
    // Apenas salva no banco
  }
}

// 4. Cálculos de negócio
export class CalculadoraPeriodo {
  calcularMesReferencia(periodo: Periodo): Periodo {
    // Apenas calcula períodos
  }
}
```

### **O** - Open/Closed Principle (Aberto/Fechado)

**📖 Definição**: Classes devem estar **abertas para extensão** e **fechadas para modificação**.

**🤔 Na prática**: Você deve conseguir adicionar novos comportamentos sem modificar código existente.

#### Exemplo Prático:

```typescript
// ❌ PROBLEMA: Para adicionar nova API, precisa modificar a classe
export class UnimedApiService {
  async buscarDados(tipo: string, params: any) {
    if (tipo === 'SOAP') {
      // Lógica SOAP
      return await this.chamadaSOAP(params);
    } else if (tipo === 'REST') {
      // Lógica REST
      return await this.chamadaREST(params);
    }
    // Para adicionar GraphQL, preciso modificar aqui! ❌
  }
}
```

```typescript
// ✅ SOLUÇÃO: Interface permite extensão sem modificação
interface IApiService {
  buscarDados(params: BuscarDadosParams): Promise<DadosUnimed>;
}

export class SOAPApiService implements IApiService {
  async buscarDados(params: BuscarDadosParams): Promise<DadosUnimed> {
    // Implementação SOAP
  }
}

export class RESTApiService implements IApiService {
  async buscarDados(params: BuscarDadosParams): Promise<DadosUnimed> {
    // Implementação REST
  }
}

// Adicionar GraphQL sem modificar nada! ✅
export class GraphQLApiService implements IApiService {
  async buscarDados(params: BuscarDadosParams): Promise<DadosUnimed> {
    // Implementação GraphQL
  }
}
```

### **L** - Liskov Substitution Principle (Substituição de Liskov)

**📖 Definição**: Objetos de uma superclasse devem poder ser substituídos por objetos de suas subclasses.

**🤔 Na prática**: Se você usa uma interface, qualquer implementação dela deve funcionar da mesma forma.

#### Exemplo do Projeto:

```typescript
// ✅ Interface bem definida
interface IEmpresaRepository {
  buscarAtivas(): Promise<Empresa[]>;
  buscarPorCodigo(codigo: number): Promise<Empresa | null>;
}

// ✅ Implementação Oracle
export class OracleEmpresaRepository implements IEmpresaRepository {
  async buscarAtivas(): Promise<Empresa[]> {
    const sql = "SELECT * FROM empresas WHERE ativo='S'";
    return await this.db.query(sql);
  }
}

// ✅ Implementação MySQL (substitui perfeitamente)
export class MySQLEmpresaRepository implements IEmpresaRepository {
  async buscarAtivas(): Promise<Empresa[]> {
    const sql = "SELECT * FROM empresas WHERE ativo=1";
    return await this.db.query(sql);
  }
}

// ✅ O Use Case não precisa saber qual implementação está usando
export class ImportarDadosUseCase {
  constructor(private empresaRepo: IEmpresaRepository) {}
  
  async execute() {
    // Funciona com qualquer implementação!
    const empresas = await this.empresaRepo.buscarAtivas();
  }
}
```

### **I** - Interface Segregation Principle (Segregação de Interfaces)

**📖 Definição**: Clientes não devem depender de interfaces que não usam.

**🤔 Na prática**: Faça interfaces pequenas e específicas em vez de uma grande interface.

#### Exemplo:

```typescript
// ❌ PROBLEMA: Interface muito grande
interface IUnimedService {
  // Métodos de importação
  importarDados(params: any): Promise<void>;
  validarDados(dados: any): boolean;
  
  // Métodos de relatório
  gerarRelatorio(): Promise<string>;
  exportarExcel(): Promise<Buffer>;
  
  // Métodos de configuração
  configurarApi(): void;
  testarConexao(): Promise<boolean>;
  
  // Métodos de limpeza
  limparDadosAntigos(): Promise<void>;
  compactarBanco(): Promise<void>;
}
```

```typescript
// ✅ SOLUÇÃO: Interfaces específicas
interface IImportadorUnimed {
  importarDados(params: ImportarParams): Promise<void>;
  validarDados(dados: DadosUnimed[]): boolean;
}

interface IRelatorioUnimed {
  gerarRelatorio(): Promise<string>;
  exportarExcel(): Promise<Buffer>;
}

interface IConfiguracaoUnimed {
  configurarApi(): void;
  testarConexao(): Promise<boolean>;
}

// Cada classe implementa apenas o que precisa
export class ImportadorService implements IImportadorUnimed {
  // Só implementa métodos de importação
}

export class RelatorioService implements IRelatorioUnimed {
  // Só implementa métodos de relatório
}
```

### **D** - Dependency Inversion Principle (Inversão de Dependências)

**📖 Definição**: Módulos de alto nível não devem depender de módulos de baixo nível. Ambos devem depender de abstrações.

**🤔 Na prática**: Dependa de interfaces, não de implementações concretas.

#### Exemplo do Projeto:

```typescript
// ❌ PROBLEMA ATUAL: Dependência direta de implementação
export class UnimedImportService {
  private databaseService: DatabaseService; // ❌ Dependência concreta
  private unimedApiService: UnimedApiService; // ❌ Dependência concreta
  
  async importar() {
    // Está amarrado a implementações específicas
    const dados = await this.unimedApiService.buscarDados();
    await this.databaseService.salvar(dados);
  }
}
```

```typescript
// ✅ SOLUÇÃO: Dependência de abstrações
export class ImportarDadosUseCase {
  constructor(
    private readonly apiService: IApiService, // ✅ Interface
    private readonly repository: IRepository, // ✅ Interface
  ) {}
  
  async execute() {
    // Pode usar qualquer implementação!
    const dados = await this.apiService.buscarDados();
    await this.repository.salvar(dados);
  }
}
```

---

## 3. CLEAN ARCHITECTURE

### 🎯 O que é Clean Architecture?

**Definição**: É uma forma de organizar o código em **camadas** onde:
- Camadas internas não conhecem camadas externas
- Regras de negócio ficam protegidas
- É fácil trocar tecnologias (banco, API, framework)

### 🏗 As 4 Camadas

```
┌─────────────────────────────────────┐
│     🖥️ PRESENTATION LAYER           │  ← Controllers, APIs
│  (Controllers, DTOs, Middlewares)   │
├─────────────────────────────────────┤
│     🎯 APPLICATION LAYER           │  ← Use Cases, Services
│    (Use Cases, Application DTOs)    │
├─────────────────────────────────────┤
│     🏢 DOMAIN LAYER                │  ← Entities, Value Objects
│  (Entities, Value Objects, Rules)   │
├─────────────────────────────────────┤
│     🔧 INFRASTRUCTURE LAYER        │  ← Database, APIs, Files
│  (Database, External APIs, Files)   │
└─────────────────────────────────────┘
```

### 📊 Como Está Hoje vs Como Deveria Ser

#### 🔴 SITUAÇÃO ATUAL (Arquitetura Anêmica)

```
src/
├── controllers/          ← Mistura apresentação com lógica
│   └── importacao.controller.ts
├── services/            ← Mistura regras com infraestrutura
│   ├── unimed-import.service.ts
│   ├── unimed-api.service.ts
│   └── database.service.ts
├── entities/            ← Apenas interfaces (sem comportamento)
│   └── uni-dados-cobranca.entity.ts
└── dtos/               ← DTOs espalhados
    └── import-unimed.dto.ts
```

#### 🟢 ARQUITETURA IDEAL

```
src/
├── 🖥️ presentation/        ← Camada de Apresentação
│   ├── controllers/
│   │   └── importacao.controller.ts
│   └── dtos/
│       └── importar-dados.dto.ts
├── 🎯 application/         ← Camada de Aplicação
│   ├── use-cases/
│   │   └── importar-dados.use-case.ts
│   └── services/
│       └── application.service.ts
├── 🏢 domain/              ← Camada de Domínio
│   ├── entities/
│   │   ├── empresa.entity.ts
│   │   └── beneficiario.entity.ts
│   ├── value-objects/
│   │   ├── cnpj.value-object.ts
│   │   └── periodo.value-object.ts
│   ├── repositories/       ← Interfaces (contratos)
│   │   └── empresa.repository.interface.ts
│   └── services/          ← Serviços de domínio
│       └── calculadora-periodo.service.ts
└── 🔧 infrastructure/      ← Camada de Infraestrutura
    ├── database/
    │   └── repositories/
    │       └── oracle-empresa.repository.ts
    ├── external-apis/
    │   └── unimed-api.service.ts
    └── config/
        └── database.config.ts
```

---

## 4. CONCEITOS PRÁTICOS

### 🏢 ENTITY (Entidade)

**📖 O que é**: Uma entidade representa um **objeto do mundo real** que tem **identidade própria** e **comportamentos**.

**🤔 Características**:
- Tem um **ID único**
- Possui **estado** (dados)
- Possui **comportamentos** (métodos)
- Encapsula **regras de negócio**

#### Exemplo do Projeto:

```typescript
// ❌ COMO ESTÁ: Apenas interface (anêmica)
export interface UniDadosCobranca {
  cod_empresa: number;
  cnpj: string;
  beneficiario: string;
  cpf: string;
  valor: number;
  // ... sem comportamentos
}
```

```typescript
// ✅ COMO DEVERIA SER: Entidade rica
export class Beneficiario {
  constructor(
    private readonly _id: string,
    private readonly _nome: string,
    private readonly _cpf: CPF,
    private readonly _valorCobrado: number,
    private readonly _dependencia?: string,
  ) {}

  // 🎯 Comportamentos específicos do negócio
  ehTitular(): boolean {
    return !this._dependencia || this._dependencia.trim() === '';
  }

  calcularValorComDesconto(percentualDesconto: number): number {
    return this._valorCobrado * (1 - percentualDesconto / 100);
  }

  podeSerExportado(): boolean {
    return this._valorCobrado > 0 && this._cpf.isValid();
  }

  get nomeFormatado(): string {
    return this._nome.toUpperCase().trim();
  }

  // 🔒 Encapsulamento dos dados
  get id(): string { return this._id; }
  get nome(): string { return this._nome; }
  get cpf(): CPF { return this._cpf; }
  get valorCobrado(): number { return this._valorCobrado; }
}
```

### 💎 VALUE OBJECT (Objeto de Valor)

**📖 O que é**: Representa um **valor** que não tem identidade própria, mas tem **regras de validação**.

**🤔 Características**:
- **Imutável** (não muda depois de criado)
- **Sem identidade** própria
- **Validação** na criação
- **Comparação por valor**

#### Exemplo Prático:

```typescript
// ❌ PROBLEMA ATUAL: String sem validação
export class ImportUnimedDto {
  mes: string; // ❌ Pode ser "99", "abc", etc.
  ano: string; // ❌ Pode ser "1800", "abc", etc.
}
```

```typescript
// ✅ SOLUÇÃO: Value Objects com validação
export class CNPJ {
  private readonly _value: string;

  constructor(value: string) {
    if (!this.isValid(value)) {
      throw new Error('CNPJ inválido');
    }
    this._value = this.format(value);
  }

  private isValid(cnpj: string): boolean {
    const clean = cnpj.replace(/\D/g, '');
    if (clean.length !== 14) return false;
    
    // Validação dos dígitos verificadores
    let soma = 0;
    let pos = 5;
    
    for (let i = 0; i < 12; i++) {
      soma += parseInt(clean.charAt(i)) * pos--;
      if (pos < 2) pos = 9;
    }
    
    let resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11);
    if (resultado !== parseInt(clean.charAt(12))) return false;
    
    // ... resto da validação
    return true;
  }

  private format(cnpj: string): string {
    const clean = cnpj.replace(/\D/g, '');
    return clean.replace(
      /^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/,
      '$1.$2.$3/$4-$5'
    );
  }

  get value(): string { return this._value; }
  
  equals(other: CNPJ): boolean {
    return this._value === other._value;
  }
}

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

  // 🎯 Comportamentos específicos
  calcularMesAnterior(): Periodo {
    if (this.mes === 1) {
      return new Periodo(12, this.ano - 1);
    }
    return new Periodo(this.mes - 1, this.ano);
  }

  get periodoFormatado(): string {
    return `${this.mes.toString().padStart(2, '0')}${this.ano}`;
  }
}
```

### 🗃️ REPOSITORY (Repositório)

**📖 O que é**: Abstração que **esconde** como os dados são armazenados e **fornece** uma interface para acessá-los.

**🤔 Características**:
- **Interface** na camada de domínio
- **Implementação** na camada de infraestrutura
- **Simula uma coleção** de objetos na memória
- **Isola** a lógica de negócio do banco de dados

#### Exemplo do Projeto:

```typescript
// ❌ COMO ESTÁ: Acesso direto ao banco
export class UnimedImportService {
  async importarPorCnpj(dto: ImportUnimedDto) {
    // ❌ SQL misturado com lógica de negócio
    const sql = `SELECT cod_empresa, cnpj FROM empresas WHERE ativo='S'`;
    const empresas = await this.databaseService.executeQuery(sql);
    
    for (const empresa of empresas) {
      // ❌ Mais SQL misturado
      const deleteSql = `DELETE FROM dados WHERE cod_empresa = ?`;
      await this.databaseService.executeQuery(deleteSql, [empresa.cod_empresa]);
    }
  }
}
```

```typescript
// ✅ COMO DEVERIA SER: Repository Pattern

// 1️⃣ Interface na camada de DOMÍNIO
export interface IEmpresaRepository {
  buscarEmpresasAtivas(): Promise<Empresa[]>;
  buscarPorCodigo(codigo: number): Promise<Empresa | null>;
  buscarPorCnpj(cnpj: CNPJ): Promise<Empresa | null>;
}

export interface IDadosCobrancaRepository {
  salvar(dados: DadosCobranca[]): Promise<void>;
  limparPorEmpresaEPeriodo(empresa: Empresa, periodo: Periodo): Promise<number>;
  buscarPorColaborador(cpf: CPF): Promise<DadosCobranca[]>;
}

// 2️⃣ Implementação na camada de INFRAESTRUTURA
@Injectable()
export class OracleEmpresaRepository implements IEmpresaRepository {
  constructor(private readonly db: DatabaseService) {}

  async buscarEmpresasAtivas(): Promise<Empresa[]> {
    const sql = `
      SELECT cod_empresa, codcoligada, codfilial, cod_band, cnpj
      FROM empresas 
      WHERE ativo = 'S' 
        AND processa_unimed = 'S'
      ORDER BY cod_empresa
    `;
    
    const rows = await this.db.executeQuery(sql);
    
    // 🎯 Converte dados do banco em entidades de domínio
    return rows.map(row => new Empresa(
      row.cod_empresa,
      row.codcoligada,
      row.codfilial,
      row.cod_band,
      new CNPJ(row.cnpj),
      true
    ));
  }

  async buscarPorCnpj(cnpj: CNPJ): Promise<Empresa | null> {
    const sql = `
      SELECT * FROM empresas 
      WHERE cnpj = :cnpj AND ativo = 'S'
    `;
    
    const rows = await this.db.executeQuery(sql, { cnpj: cnpj.value });
    
    if (rows.length === 0) return null;
    
    const row = rows[0];
    return new Empresa(/* ... */);
  }
}

// 3️⃣ Uso na camada de APLICAÇÃO
@Injectable()
export class ImportarDadosUseCase {
  constructor(
    private readonly empresaRepository: IEmpresaRepository, // ✅ Interface
    private readonly dadosRepository: IDadosCobrancaRepository,
  ) {}

  async execute(params: ImportarDadosParams): Promise<ResultadoImportacao> {
    // ✅ Código limpo, focado na lógica de negócio
    const empresas = await this.empresaRepository.buscarEmpresasAtivas();
    
    for (const empresa of empresas) {
      const periodo = new Periodo(params.mes, params.ano);
      
      // ✅ Operações expressivas
      await this.dadosRepository.limparPorEmpresaEPeriodo(empresa, periodo);
      
      const novosDados = await this.buscarDadosNaApi(empresa, periodo);
      await this.dadosRepository.salvar(novosDados);
    }
  }
}
```

### 🎯 USE CASE (Caso de Uso)

**📖 O que é**: Representa uma **ação específica** que o usuário pode fazer no sistema.

**🤔 Características**:
- **Uma ação** específica
- **Coordena** o fluxo de trabalho
- **Usa** repositórios e serviços
- **Independe** de framework ou tecnologia

#### Exemplo do Projeto:

```typescript
// ❌ COMO ESTÁ: Lógica no controller
@Controller()
export class ImportacaoController {
  @Get('busca-dados-periodo-cnpj')
  async buscaDadosCnpj(@Query() params: ImportUnimedDto) {
    // ❌ Validação no controller
    if (!params.mes || !params.ano) {
      throw new Error('Parâmetros obrigatórios');
    }

    // ❌ Lógica de negócio no controller
    const empresas = await this.buscaEmpresasService.execute();
    
    for (const empresa of empresas) {
      const dados = await this.unimedApiService.buscarPorPeriodoCnpj(
        `${params.mes}${params.ano}`,
        empresa.CNPJ,
      );
      
      await this.persisteService.execute(dados, empresa, params.mes, params.ano);
    }

    return { success: true };
  }
}
```

```typescript
// ✅ COMO DEVERIA SER: Use Case específico

// 1️⃣ DTO de entrada
export class ImportarDadosUnimedCommand {
  constructor(
    public readonly periodo: Periodo,
  ) {}
}

// 2️⃣ DTO de saída
export class ResultadoImportacaoUnimed {
  constructor(
    public readonly empresasProcessadas: number,
    public readonly registrosImportados: number,
    public readonly erros: string[],
    public readonly duracaoMs: number,
  ) {}
}

// 3️⃣ Use Case com responsabilidade única
@Injectable()
export class ImportarDadosUnimedUseCase {
  constructor(
    private readonly empresaRepository: IEmpresaRepository,
    private readonly dadosRepository: IDadosCobrancaRepository,
    private readonly unimedApiService: IUnimedApiService,
    private readonly logger: ILogger,
  ) {}

  async execute(command: ImportarDadosUnimedCommand): Promise<ResultadoImportacaoUnimed> {
    const inicio = Date.now();
    const erros: string[] = [];
    let registrosTotal = 0;

    try {
      // 1. Buscar empresas
      const empresas = await this.empresaRepository.buscarEmpresasAtivas();
      this.logger.info(`Encontradas ${empresas.length} empresas para processar`);

      // 2. Processar cada empresa
      for (const empresa of empresas) {
        try {
          const registros = await this.processarEmpresa(empresa, command.periodo);
          registrosTotal += registros;
          
        } catch (error) {
          const mensagemErro = `Erro ao processar empresa ${empresa.codigo}: ${error.message}`;
          erros.push(mensagemErro);
          this.logger.error(mensagemErro);
        }
      }

      const duracao = Date.now() - inicio;
      
      return new ResultadoImportacaoUnimed(
        empresas.length,
        registrosTotal,
        erros,
        duracao,
      );

    } catch (error) {
      this.logger.error('Erro geral na importação', error);
      throw new ErroImportacaoUnimed('Falha na importação de dados', error);
    }
  }

  private async processarEmpresa(empresa: Empresa, periodo: Periodo): Promise<number> {
    // 1. Limpar dados anteriores
    await this.dadosRepository.limparPorEmpresaEPeriodo(empresa, periodo);

    // 2. Buscar novos dados
    const dadosUnimed = await this.unimedApiService.buscarDadosPorCnpj(
      empresa.cnpj,
      periodo,
    );

    // 3. Converter para entidades de domínio
    const beneficiarios = this.converterParaBeneficiarios(dadosUnimed);

    // 4. Salvar  
    await this.dadosRepository.salvarBeneficiarios(beneficiarios, empresa, periodo);

    return beneficiarios.length;
  }

  private converterParaBeneficiarios(dados: DadosApiUnimed[]): Beneficiario[] {
    return dados.map(item => new Beneficiario(
      item.codbeneficiario,
      item.beneficiario,
      new CPF(item.cpf),
      item.valor,
      item.dependencia,
    ));
  }
}

// 4️⃣ Controller simplificado
@Controller('importacao')
export class ImportacaoController {
  constructor(
    private readonly importarDadosUseCase: ImportarDadosUnimedUseCase,
  ) {}

  @Post('importar-unimed')
  async importarDados(@Body() dto: ImportarDadosDto): Promise<ResultadoImportacaoDto> {
    // ✅ Apenas converte DTO e chama use case
    const periodo = new Periodo(parseInt(dto.mes), parseInt(dto.ano));
    const command = new ImportarDadosUnimedCommand(periodo);
    
    const resultado = await this.importarDadosUseCase.execute(command);
    
    // ✅ Converte para DTO de resposta
    return {
      sucesso: resultado.erros.length === 0,
      empresasProcessadas: resultado.empresasProcessadas,
      registrosImportados: resultado.registrosImportados,
      erros: resultado.erros,
      duracaoSegundos: Math.round(resultado.duracaoMs / 1000),
    };
  }
}
```

### 🎛️ SERVICE (Serviço)

**📖 O que é**: Executa **operações** que não pertencem a uma entidade específica.

**🤔 Tipos**:
- **Domain Service**: Regras de negócio complexas
- **Application Service**: Coordenação de Use Cases
- **Infrastructure Service**: Comunicação externa

#### Exemplo do Projeto:

```typescript
// 🏢 DOMAIN SERVICE - Lógica de negócio pura
@Injectable()
export class CalculadoraPeriodoService {
  calcularMesReferencia(periodo: Periodo): Periodo {
    // 📖 Regra de negócio: Mês de referência é sempre o anterior
    if (periodo.mes === 1) {
      return new Periodo(12, periodo.ano - 1);
    }
    return new Periodo(periodo.mes - 1, periodo.ano);
  }

  calcularPeriodosVencidos(dataBase: Date): Periodo[] {
    const hoje = new Date();
    const periodos: Periodo[] = [];
    
    // 📖 Regra: Períodos vencidos são os últimos 6 meses
    for (let i = 1; i <= 6; i++) {
      const data = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1);
      periodos.push(new Periodo(data.getMonth() + 1, data.getFullYear()));
    }
    
    return periodos;
  }
}

// 🔧 INFRASTRUCTURE SERVICE - Comunicação externa
@Injectable()
export class UnimedApiService implements IUnimedApiService {
  constructor(
    private readonly httpClient: HttpService,
    private readonly config: ConfigService,
  ) {}

  async buscarDadosPorCnpj(cnpj: CNPJ, periodo: Periodo): Promise<DadosApiUnimed[]> {
    try {
      const token = await this.obterToken();
      
      const response = await this.httpClient.post('/dados', {
        cnpj: cnpj.value,
        periodo: periodo.periodoFormatado,
      }, {
        headers: { Authorization: `Bearer ${token}` },
      }).toPromise();

      return response.data.mensalidades || [];
      
    } catch (error) {
      throw new ErroApiUnimed('Falha ao buscar dados da API Unimed', error);
    }
  }
}

// 🎯 APPLICATION SERVICE - Coordenação
@Injectable()
export class ImportacaoApplicationService {
  constructor(
    private readonly importarDadosUseCase: ImportarDadosUnimedUseCase,
    private readonly enviarEmailUseCase: EnviarEmailResultadoUseCase,
    private readonly logger: ILogger,
  ) {}

  async importarComNotificacao(params: ImportarDadosParams): Promise<void> {
    try {
      // 1. Executar importação
      const resultado = await this.importarDadosUseCase.execute(
        new ImportarDadosUnimedCommand(params.periodo)
      );

      // 2. Enviar email de sucesso
      await this.enviarEmailUseCase.execute(
        new EnviarEmailResultadoCommand(resultado, params.email)
      );

    } catch (error) {
      // 3. Enviar email de erro
      await this.enviarEmailUseCase.execute(
        new EnviarEmailErroCommand(error.message, params.email)
      );
      
      throw error;
    }
  }
}
```

---

## 5. ANÁLISE DO PROJETO ATUAL

### 🔍 Problemas Identificados

#### 1. **Mistura de Responsabilidades**

```typescript
// ❌ UnimedImportService faz TUDO
export class UnimedImportService {
  // Coordena + Chama API + Salva Banco + Calcula + Valida
  async importarPorCnpj(dto: ImportUnimedDto) {
    // Validação
    if (!dto.mes || !dto.ano) throw new Error('...');
    
    // Busca empresas
    const empresas = await this.buscaEmpresasService.execute();
    
    // Chama API
    const dados = await this.unimedApiService.buscarPorPeriodoCnpj();
    
    // Limpa dados
    await this.limparDadosImportacao();
    
    // Calcula períodos
    const mesRef = this.calcularMesRef();
    
    // Salva dados
    await this.persisteDadosService.execute();
  }
}
```

#### 2. **Entidades Anêmicas**

```typescript
// ❌ Apenas interface, sem comportamentos
export interface UniDadosCobranca {
  cod_empresa: number;
  cnpj: string;
  beneficiario: string;
  // ... só dados, nenhuma lógica
}
```

#### 3. **Acesso Direto ao Banco**

```typescript
// ❌ SQL espalhado pelo código
const sql = `DELETE FROM gc.uni_dados_cobranca WHERE cod_empresa = ?`;
await this.databaseService.executeQuery(sql, [empresa.cod_empresa]);
```

#### 4. **Falta de Validações**

```typescript
// ❌ Dados não validados
export class ImportUnimedDto {
  mes: string; // Pode ser "abc", "99", etc.
  ano: string; // Pode ser "1800", "xyz", etc.
}
```

### 🎯 Pontos Positivos

#### 1. **Uso do NestJS (Dependency Injection)**

```typescript
// ✅ Injeção de dependência funcionando
@Injectable()
export class UnimedImportService {
  constructor(
    private databaseService: DatabaseService,
    private unimedApiService: UnimedApiService,
  ) {}
}
```

#### 2. **Separação em Módulos**

```typescript
// ✅ Módulos bem organizados
@Module({
  imports: [DatabaseModule, UnimedApiModule],
  controllers: [ImportacaoController],
  providers: [UnimedImportService],
})
export class ImportacaoModule {}
```

#### 3. **Configuração Centralizada**

```typescript
// ✅ Configurações via environment
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),
  ],
})
export class AppModule {}
```

---

## 6. MELHORIAS PROPOSTAS

### 🎯 Roadmap de Refatoração

#### **FASE 1: Criar Camada de Domínio**

```typescript
// 1. Value Objects
export class CNPJ { /* validação e formatação */ }
export class CPF { /* validação e formatação */ }
export class Periodo { /* cálculos de data */ }

// 2. Entities
export class Empresa { /* comportamentos de empresa */ }
export class Beneficiario { /* comportamentos de beneficiário */ }
export class DadosCobranca { /* comportamentos de cobrança */ }

// 3. Repository Interfaces
export interface IEmpresaRepository { /* contratos */ }
export interface IDadosCobrancaRepository { /* contratos */ }
```

#### **FASE 2: Implementar Repository Pattern**

```typescript
// Implementações concretas na infraestrutura
@Injectable()
export class OracleEmpresaRepository implements IEmpresaRepository {
  // Implementação Oracle específica
}
```

#### **FASE 3: Criar Use Cases**

```typescript
// Use Cases específicos
export class ImportarDadosUnimedUseCase { /* uma responsabilidade */ }
export class ExportarDadosUseCase { /* uma responsabilidade */ }
export class GerarRelatorioUseCase { /* uma responsabilidade */ }
```

#### **FASE 4: Refatorar Controllers**

```typescript
// Controllers magros
@Controller('importacao')
export class ImportacaoController {
  // Apenas coordena e converte DTOs
}
```

### 🏗 Nova Estrutura Proposta

```
src/
├── 🖥️ presentation/
│   ├── controllers/
│   │   ├── importacao.controller.ts
│   │   └── relatorio.controller.ts
│   └── dtos/
│       ├── importar-dados.dto.ts
│       └── resultado-importacao.dto.ts
│
├── 🎯 application/
│   ├── use-cases/
│   │   ├── importar-dados-unimed.use-case.ts
│   │   ├── exportar-dados-totvs.use-case.ts
│   │   └── gerar-relatorio.use-case.ts
│   └── services/
│       └── importacao-application.service.ts
│
├── 🏢 domain/
│   ├── entities/
│   │   ├── empresa.entity.ts
│   │   ├── beneficiario.entity.ts
│   │   └── dados-cobranca.entity.ts
│   ├── value-objects/
│   │   ├── cnpj.value-object.ts
│   │   ├── cpf.value-object.ts
│   │   └── periodo.value-object.ts
│   ├── repositories/
│   │   ├── empresa.repository.interface.ts
│   │   └── dados-cobranca.repository.interface.ts
│   ├── services/
│   │   ├── calculadora-periodo.service.ts
│   │   └── validador-cpf.service.ts
│   └── errors/
│       ├── domain.error.ts
│       └── validation.error.ts
│
└── 🔧 infrastructure/
    ├── database/
    │   ├── repositories/
    │   │   ├── oracle-empresa.repository.ts
    │   │   └── oracle-dados-cobranca.repository.ts
    │   └── database.service.ts
    ├── external-apis/
    │   ├── unimed-api.service.ts
    │   └── totvs-api.service.ts
    └── config/
        ├── database.config.ts
        └── api.config.ts
```

---

## 7. COMO APLICAR EM OUTROS PROJETOS

### 🚀 Passo a Passo Prático

#### **1. IDENTIFIQUE O DOMÍNIO**

**❓ Perguntas para fazer**:
- Quais são os **principais conceitos** do negócio?
- Quais **regras** existem?
- Que **validações** são necessárias?
- Quais **cálculos** são feitos?

**💼 Exemplo: Sistema de E-commerce**

```typescript
// 🏢 Entidades identificadas
export class Produto {
  constructor(
    private readonly _codigo: string,
    private readonly _nome: string,
    private readonly _preco: Preco,
    private readonly _categoria: Categoria,
  ) {}

  // 📖 Regras de negócio
  podeSerVendido(): boolean {
    return this._preco.value > 0 && this.temEstoque();
  }

  calcularPrecoComDesconto(desconto: Percentual): Preco {
    return this._preco.aplicarDesconto(desconto);
  }
}

// 💎 Value Objects identificados
export class Preco {
  constructor(private readonly _value: number) {
    if (_value < 0) throw new Error('Preço não pode ser negativo');
  }

  aplicarDesconto(percentual: Percentual): Preco {
    const valorDesconto = this._value * (percentual.value / 100);
    return new Preco(this._value - valorDesconto);
  }
}

export class Percentual {
  constructor(private readonly _value: number) {
    if (_value < 0 || _value > 100) {
      throw new Error('Percentual deve estar entre 0 e 100');
    }
  }

  get value(): number { return this._value; }
}
```

#### **2. CRIE AS INTERFACES (Contratos)**

```typescript
// 📋 Defina o que cada camada precisa
export interface IProdutoRepository {
  buscarPorCategoria(categoria: Categoria): Promise<Produto[]>;
  buscarPorCodigo(codigo: string): Promise<Produto | null>;
  salvar(produto: Produto): Promise<void>;
}

export interface IEstoqueService {
  verificarDisponibilidade(produto: Produto): Promise<boolean>;
  reservar(produto: Produto, quantidade: number): Promise<void>;
}

export interface ICalculadoraFreteService {
  calcular(cep: CEP, produtos: Produto[]): Promise<Preco>;
}
```

#### **3. IMPLEMENTE OS USE CASES**

```typescript
export class AdicionarProdutoCarrinhoUseCase {
  constructor(
    private readonly produtoRepository: IProdutoRepository,
    private readonly carrinhoRepository: ICarrinhoRepository,
    private readonly estoqueService: IEstoqueService,
  ) {}

  async execute(command: AdicionarProdutoCommand): Promise<void> {
    // 1. Validar produto existe
    const produto = await this.produtoRepository.buscarPorCodigo(command.codigoProduto);
    if (!produto) {
      throw new ProdutoNaoEncontradoError(command.codigoProduto);
    }

    // 2. Verificar se pode ser vendido
    if (!produto.podeSerVendido()) {
      throw new ProdutoIndisponivelError(command.codigoProduto);
    }

    // 3. Verificar estoque
    const temEstoque = await this.estoqueService.verificarDisponibilidade(produto);
    if (!temEstoque) {
      throw new EstoqueInsuficienteError(command.codigoProduto);
    }

    // 4. Adicionar ao carrinho
    const carrinho = await this.carrinhoRepository.buscarPorUsuario(command.usuarioId);
    carrinho.adicionarProduto(produto, command.quantidade);
    
    await this.carrinhoRepository.salvar(carrinho);
  }
}
```

#### **4. MANTENHA CAMADAS SEPARADAS**

```typescript
// ✅ CONTROLLER (Presentation Layer)
@Controller('produtos')
export class ProdutoController {
  constructor(
    private readonly adicionarProdutoUseCase: AdicionarProdutoCarrinhoUseCase
  ) {}

  @Post('carrinho')
  async adicionarAoCarrinho(@Body() dto: AdicionarProdutoDto) {
    const command = new AdicionarProdutoCommand(
      dto.usuarioId,
      dto.codigoProduto,
      dto.quantidade,
    );

    await this.adicionarProdutoUseCase.execute(command);
    
    return { sucesso: true, mensagem: 'Produto adicionado ao carrinho' };
  }
}

// ✅ REPOSITORY (Infrastructure Layer)
@Injectable()
export class MySQLProdutoRepository implements IProdutoRepository {
  constructor(private readonly db: DatabaseService) {}

  async buscarPorCodigo(codigo: string): Promise<Produto | null> {
    const sql = 'SELECT * FROM produtos WHERE codigo = ?';
    const rows = await this.db.query(sql, [codigo]);
    
    if (rows.length === 0) return null;
    
    return this.mapearParaEntidade(rows[0]);
  }

  private mapearParaEntidade(row: any): Produto {
    return new Produto(
      row.codigo,
      row.nome,
      new Preco(row.preco),
      new Categoria(row.categoria),
    );
  }
}
```

### 🎯 Checklist para Novos Projetos

#### **✅ DOMÍNIO PRIMEIRO**
- [ ] Identifiquei as entidades principais?
- [ ] Criei value objects para validações?
- [ ] Defini as regras de negócio?
- [ ] Separei comportamentos das entidades?

#### **✅ INTERFACES ANTES DE IMPLEMENTAÇÕES**
- [ ] Criei interfaces para repositórios?
- [ ] Defini contratos para serviços externos?
- [ ] Separei abstrações de implementações?

#### **✅ USE CASES ESPECÍFICOS**
- [ ] Cada use case tem uma responsabilidade?
- [ ] Use cases não dependem de framework?
- [ ] Use cases orchestram o fluxo?

#### **✅ LAYERS BEM DEFINIDAS**
- [ ] Controllers só coordenam?
- [ ] Regras de negócio estão no domínio?
- [ ] Infraestrutura está isolada?

#### **✅ TESTES**
- [ ] Entidades podem ser testadas isoladamente?
- [ ] Use cases podem ser testados sem banco?
- [ ] Mocks são fáceis de criar?

### 🔄 Migration de Projetos Legacy

#### **Estratégia "Strangler Fig"**

```typescript
// 1️⃣ IDENTIFIQUE UM MÓDULO PEQUENO
// Em vez de refatorar tudo, comece com uma funcionalidade

// 2️⃣ CRIE A NOVA ESTRUTURA AO LADO DA ANTIGA
// Não quebre o que funciona

// ❌ Código Legacy (mantenha funcionando)
@Controller()
export class OldImportacaoController {
  @Get('old-import')
  async oldImport() {
    // Código antigo continua funcionando
  }
}

// ✅ Novo código (implementação limpa)
@Controller()
export class NewImportacaoController {
  constructor(
    private readonly importarDadosUseCase: ImportarDadosUseCase
  ) {}

  @Post('new-import')
  async newImport(@Body() dto: ImportarDadosDto) {
    // Nova implementação
    return await this.importarDadosUseCase.execute(dto);
  }
}

// 3️⃣ MIGRE GRADUALMENTE
// Redirecione uma funcionalidade por vez para a nova implementação

// 4️⃣ REMOVA O CÓDIGO ANTIGO
// Só depois de garantir que a nova implementação funciona
```

### 🚀 Exemplo Completo: Sistema de Biblioteca

```typescript
// 🏢 DOMAIN LAYER
export class Livro {
  constructor(
    private readonly _isbn: ISBN,
    private readonly _titulo: string,
    private readonly _autor: string,
  ) {}

  podeSerEmprestado(): boolean {
    return !this._emprestado;
  }

  emprestar(usuario: Usuario, dataVencimento: Date): Emprestimo {
    if (!this.podeSerEmprestado()) {
      throw new LivroJaEmprestadoError(this._isbn);
    }
    
    return new Emprestimo(this, usuario, new Date(), dataVencimento);
  }
}

export class ISBN {
  constructor(private readonly _value: string) {
    if (!this.isValid(_value)) {
      throw new ISBNInvalidoError(_value);
    }
  }

  private isValid(isbn: string): boolean {
    // Validação do ISBN
    return isbn.length === 13 && /^\d+$/.test(isbn);
  }

  get value(): string { return this._value; }
}

// 📋 REPOSITORY INTERFACES
export interface ILivroRepository {
  buscarPorISBN(isbn: ISBN): Promise<Livro | null>;
  buscarDisponiveis(): Promise<Livro[]>;
  salvar(livro: Livro): Promise<void>;
}

// 🎯 USE CASE
export class EmprestarLivroUseCase {
  constructor(
    private readonly livroRepository: ILivroRepository,
    private readonly usuarioRepository: IUsuarioRepository,
    private readonly emprestimoRepository: IEmprestimoRepository,
  ) {}

  async execute(command: EmprestarLivroCommand): Promise<void> {
    const livro = await this.livroRepository.buscarPorISBN(command.isbn);
    if (!livro) {
      throw new LivroNaoEncontradoError(command.isbn);
    }

    const usuario = await this.usuarioRepository.buscarPorId(command.usuarioId);
    if (!usuario) {
      throw new UsuarioNaoEncontradoError(command.usuarioId);
    }

    const emprestimo = livro.emprestar(usuario, command.dataVencimento);
    
    await this.emprestimoRepository.salvar(emprestimo);
    await this.livroRepository.salvar(livro);
  }
}

// 🔧 INFRASTRUCTURE
@Injectable()
export class PostgreSQLLivroRepository implements ILivroRepository {
  async buscarPorISBN(isbn: ISBN): Promise<Livro | null> {
    const query = 'SELECT * FROM livros WHERE isbn = $1';
    const result = await this.db.query(query, [isbn.value]);
    
    return result.rows.length > 0 
      ? this.mapearParaEntidade(result.rows[0])
      : null;
  }
}

// 🖥️ PRESENTATION
@Controller('emprestimos')
export class EmprestimoController {
  constructor(
    private readonly emprestarLivroUseCase: EmprestarLivroUseCase
  ) {}

  @Post()
  async emprestar(@Body() dto: EmprestarLivroDto) {
    const command = new EmprestarLivroCommand(
      new ISBN(dto.isbn),
      dto.usuarioId,
      new Date(dto.dataVencimento),
    );

    await this.emprestarLivroUseCase.execute(command);
    
    return { sucesso: true, mensagem: 'Livro emprestado com sucesso' };
  }
}
```

---

## 📚 RESUMO E PRÓXIMOS PASSOS

### 🎯 Principais Conceitos Aprendidos

1. **SOLID** - Princípios para código limpo e manutenível
2. **Clean Architecture** - Organização em camadas independentes
3. **Entity** - Objetos de negócio com identidade e comportamentos
4. **Value Object** - Valores imutáveis com validações
5. **Repository** - Abstração para acesso a dados
6. **Use Case** - Casos de uso específicos do sistema

### 🚀 Aplicação Prática no Projeto API-UNIMED

**Situação Atual**: Arquitetura anêmica com responsabilidades misturadas
**Objetivo**: Refatorar para Clean Architecture com SOLID

### 📋 Próximas Ações Recomendadas

1. **Começar pequeno**: Refatore o módulo de importação
2. **Criar Value Objects**: CNPJ, CPF, Periodo
3. **Implementar Repository**: Interface + Implementação Oracle
4. **Criar Use Cases**: ImportarDadosUnimedUseCase
5. **Simplificar Controllers**: Apenas coordenação

### 🎓 Para Continuar Aprendendo

- **Livros**: "Clean Architecture" (Robert Martin), "Domain-Driven Design" (Eric Evans)
- **Prática**: Implemente um pequeno projeto usando estes conceitos
- **Refatoração**: Aplique gradualmente no projeto atual

### 💡 Lembre-se

> "A arquitetura não é sobre o framework ou tecnologia que você usa, é sobre como você organiza seu código para que ele seja **fácil de entender, modificar e testar**."

**🎯 Foco Principal**: Escrever código que outros desenvolvedores (incluindo você no futuro) possam facilmente entender e modificar.

---

## 📞 DÚVIDAS?

Este guia é um documento vivo. Se você tiver dúvidas ou quiser discutir algum conceito, não hesite em perguntar. A arquitetura é uma jornada de aprendizado contínuo! 🚀