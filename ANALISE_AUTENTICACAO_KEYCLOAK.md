# 🔐 ANÁLISE: AUTENTICAÇÃO KEYCLOAK (API-TELEFONIA)

**Data:** 27 de Janeiro de 2026  
**Projeto Referência:** api-telefonia  
**Objetivo:** Replicar autenticação Keycloak no api-unimed

---

## 📋 ARQUITETURA DE AUTENTICAÇÃO

### 🔑 **Stack Utilizado**

```json
{
  "nest-keycloak-connect": "^1.10.1",  // Integração Keycloak
  "@casl/ability": "^6.7.3",           // Gerenciamento de permissões
  "@casl/prisma": "^1.5.1"             // Integração CASL + Prisma
}
```

---

## 🏗️ **ESTRUTURA DE MÓDULOS**

### **1. AuthModule** (`auth.module.ts`)

**Responsabilidades:**
- Configurar conexão com Keycloak
- Registrar Guards globais
- Gerenciar autenticação JWT

**Código:**
```typescript
@Module({
  imports: [
    KeycloakConnectModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        authServerUrl: config.getOrThrow<string>('SSO_URL'),
        realm: config.getOrThrow<string>('SSO_REALM'),
        clientId: config.getOrThrow<string>('SSO_CLIENT_ID'),
        secret: config.getOrThrow<string>('SSO_SECRET'),
        useNestLogger: false,
      }),
    }),
  ],
  providers: [
    { provide: APP_GUARD, useClass: AuthGuard },        // 1º Guard
    { provide: APP_GUARD, useClass: LocalUserGuard },   // 2º Guard
    { provide: APP_GUARD, useClass: PoliciesGuard },    // 3º Guard
  ],
})
export class AuthModule {}
```

**Variáveis de Ambiente:**
```env
SSO_URL=https://sso.sandboxcometa.com.br/
SSO_REALM=GC
SSO_CLIENT_ID=data-hub
SSO_SECRET=e3xlSq9VN0hphkcyJYXRvd2qfdE0hLwa
```

---

### **2. Guards em Cascata**

#### **Guard 1: AuthGuard** (nest-keycloak-connect)

**O que faz:**
- ✅ Valida token JWT do Keycloak
- ✅ Extrai informações do usuário (`sub`, `preferred_username`, `roles`)
- ✅ Adiciona `request.user` com dados do Keycloak

**Token JWT contém:**
```json
{
  "sub": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
  "preferred_username": "joao.silva",
  "email": "joao@empresa.com",
  "realm_access": {
    "roles": ["ADMIN", "USER"]
  }
}
```

---

#### **Guard 2: LocalUserGuard** (`local-user.guard.ts`)

**O que faz:**
- ✅ Busca usuário na base **local** (Prisma/TypeORM)
- ✅ Relaciona `keycloak_id` (sub) com usuário local
- ✅ Adiciona `request.userAuth` com dados completos do banco

**Código:**
```typescript
@Injectable()
export class LocalUserGuard {
  constructor(
    private prismaService: PrismaService,
    private reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Permite pular este guard se decorado com @NotRequiredLocalUser
    const isNotRequiredLocalUser = this.reflector.get(
      IS_NOT_REQUIRED_LOCAL_USER_KEY,
      context.getHandler(),
    ) || false;

    if (isNotRequiredLocalUser) return true;

    const request = context.switchToHttp().getRequest<Request>();
    const keycloakUser = request.user;  // Vem do AuthGuard

    const keycloakId = keycloakUser?.sub;
    if (!keycloakId) {
      throw new UnauthorizedException('Usuário não identificado no token');
    }

    // Busca usuário local pelo sub do Keycloak
    const userAuth = await this.prismaService.user.findFirst({
      where: { sub: keycloakId }
    });

    if (!userAuth) {
      throw new UnauthorizedException('Usuário local não encontrado');
    }

    request.userAuth = userAuth;  // Adiciona usuário local ao request
    return true;
  }
}
```

**Fluxo:**
```
1. AuthGuard valida JWT → request.user = dados do Keycloak
2. LocalUserGuard busca no banco → request.userAuth = dados locais
```

---

#### **Guard 3: PoliciesGuard** (`policy.guard.ts`)

**O que faz:**
- ✅ Cria abilities CASL baseadas nas permissões do usuário
- ✅ Valida se usuário tem permissão para executar a ação
- ✅ Adiciona `request.userAuth.ability` com as permissões

**Código:**
```typescript
@Injectable()
export class PoliciesGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private caslAbilityFactory: AbilityFactoryService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isNotRequiredLocalUser = this.reflector.get(
      IS_NOT_REQUIRED_LOCAL_USER_KEY,
      context.getHandler(),
    ) || false;

    if (isNotRequiredLocalUser) return true;

    // Busca handlers de policy definidos no controller
    const policyHandlers = this.reflector.get<PolicyHandler[]>(
      CHECK_POLICIES_KEY,
      context.getHandler(),
    ) || [];

    const request = context.switchToHttp().getRequest<Request>();
    
    // Cria abilities baseadas no usuário
    const ability = await this.caslAbilityFactory.createAbilityPerUser(
      request.userAuth
    );

    request.userAuth.ability = ability;

    // Valida todas as policies
    return policyHandlers.every((handler) =>
      this.execPolicyHandler(handler, ability)
    );
  }

  private execPolicyHandler(handler: PolicyHandler, ability: AppAbility) {
    if (typeof handler === 'function') {
      return handler(ability);
    }
    return handler.handle(ability);
  }
}
```

---

### **3. Sistema CASL de Permissões**

#### **AbilityFactoryService** (`ability-factory.service.ts`)

**Responsabilidades:**
- Criar abilities baseadas no **Role** do usuário
- Combinar permissões de Role + Permissões individuais
- Cache de abilities por role

**Estrutura de Dados:**
```typescript
// Tabela: PermissionRole
{
  role: "DP",
  permission: {
    action: "update",
    subjectName: "Colaborador"
  },
  conditions: { cod_empresa: { equals: 71 } }
}

// Tabela: PermissionUser (permissões individuais)
{
  userId: 123,
  permission: {
    action: "delete",
    subjectName: "Processo"
  },
  condition: { codigo: { in: ["UNIED", "UNIEF"] } }
}
```

**Lógica:**
```typescript
async createAbilityPerUser(user: User): Promise<AppAbility> {
  const builder = new AbilityBuilder<AppAbility>(createPrismaAbility);

  // 1. Adiciona permissões do ROLE
  const roleBuilder = this.builderPerRole.get(user.role);
  if (roleBuilder) {
    builder.rules.push(...roleBuilder.rules);
  }

  // 2. Se ADMIN, pode tudo
  if (user.role == Role.ADMIN) {
    builder.can('manage', 'all');
  }

  // 3. Adiciona permissões individuais do usuário
  const permissionsUsers = await this.prismaService.permissionUser.findMany({
    where: { userId: user.id },
    include: { permission: true }
  });

  permissionsUsers.forEach((permissionUser) => {
    builder.can(
      permissionUser.permission.action,
      permissionUser.permission.subjectName,
      permissionUser.contition
    );
  });

  return builder.build();
}
```

---

## 🎯 **USO NOS CONTROLLERS**

### **Decorator @AuthUser()**

**Código:**
```typescript
export const AuthUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<Request>();
    if (request.userAuth) return request.userAuth;
    throw new Error('Usuario não localizado');
  },
);
```

**Uso:**
```typescript
@Controller('colaboradores')
export class ColaboradorController {
  
  @Get()
  async listar(@AuthUser() user: UserAuth) {
    // user contém:
    // - id, nome, email, cpf (dados locais)
    // - role (ADMIN, DP, COLABORADOR)
    // - ability (permissões CASL)
    
    // Filtra por permissões
    if (user.role === 'COLABORADOR') {
      return this.service.findByCpf(user.cpf);
    }
    return this.service.findAll();
  }
}
```

---

### **Decorator @CheckPolicies()**

**Uso:**
```typescript
@Post('executar')
@CheckPolicies((ability: AppAbility) => ability.can('execute', 'Processo'))
async executar(@AuthUser() user: UserAuth) {
  // Só executa se usuário tiver permissão 'execute' em 'Processo'
}
```

---

### **Decorator @NotRequiredLocalUser()**

**Uso:**
```typescript
@Get('health')
@NotRequiredLocalUser()
async health() {
  // Endpoint público, pula LocalUserGuard e PoliciesGuard
  return { status: 'ok' };
}
```

---

## 🔄 **FLUXO COMPLETO DE AUTENTICAÇÃO**

```
┌─────────────────────────────────────────────────────────────┐
│ 1. CLIENTE FAZ REQUEST                                      │
│    Authorization: Bearer <JWT_KEYCLOAK>                     │
└────────────────────┬────────────────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. AuthGuard (nest-keycloak-connect)                        │
│    ✅ Valida JWT com Keycloak                               │
│    ✅ Extrai dados: sub, preferred_username, roles          │
│    ✅ Adiciona request.user = { sub, username, roles }      │
└────────────────────┬────────────────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. LocalUserGuard                                           │
│    ✅ Busca user no banco: WHERE sub = request.user.sub     │
│    ✅ Valida se existe usuário local                        │
│    ✅ Adiciona request.userAuth = { id, nome, cpf, role }   │
└────────────────────┬────────────────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────────────────────┐
│ 4. PoliciesGuard                                            │
│    ✅ Cria abilities CASL do usuário                        │
│    ✅ Valida @CheckPolicies do endpoint                     │
│    ✅ Adiciona request.userAuth.ability = AppAbility        │
└────────────────────┬────────────────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────────────────────┐
│ 5. CONTROLLER                                               │
│    ✅ @AuthUser() injeta request.userAuth                   │
│    ✅ Lógica de negócio com permissões                      │
│    ✅ Filtra dados conforme role/permissions                │
└─────────────────────────────────────────────────────────────┘
```

---

## 📊 **MODELO DE DADOS**

### **Tabela: User**
```sql
CREATE TABLE "User" (
  id SERIAL PRIMARY KEY,
  sub VARCHAR(255) UNIQUE NOT NULL,  -- Keycloak ID
  nome VARCHAR(255),
  cpf VARCHAR(11) UNIQUE,
  email VARCHAR(255),
  role VARCHAR(50) NOT NULL,         -- ADMIN, DP, COLABORADOR
  ativo BOOLEAN DEFAULT true
);
```

### **Tabela: Permission**
```sql
CREATE TABLE "Permission" (
  id SERIAL PRIMARY KEY,
  action VARCHAR(50) NOT NULL,       -- create, read, update, delete, execute
  subjectName VARCHAR(100) NOT NULL  -- Processo, Colaborador, Importacao
);
```

### **Tabela: PermissionRole**
```sql
CREATE TABLE "PermissionRole" (
  id SERIAL PRIMARY KEY,
  role VARCHAR(50) NOT NULL,
  permissionId INTEGER REFERENCES "Permission"(id),
  conditions JSONB                   -- { cod_empresa: { equals: 71 } }
);
```

### **Tabela: PermissionUser**
```sql
CREATE TABLE "PermissionUser" (
  id SERIAL PRIMARY KEY,
  userId INTEGER REFERENCES "User"(id),
  permissionId INTEGER REFERENCES "Permission"(id),
  contition JSONB                    -- Condições específicas
);
```

---

## 🎯 **APLICAÇÃO NO API-UNIMED**

### **Cenários de Uso:**

#### **1. Colaborador Comum**
```typescript
// user.role = 'COLABORADOR'
// user.cpf = '12345678901'

@Get('colaboradores')
async listar(@AuthUser() user: UserAuth) {
  if (user.role === 'COLABORADOR') {
    // Vê apenas seus próprios dados
    return this.service.findByCpf(user.cpf);
  }
}
```

#### **2. Departamento Pessoal**
```typescript
// user.role = 'DP'
// Pode ver e editar todos colaboradores da sua empresa

@Get('colaboradores')
async listar(@AuthUser() user: UserAuth, @Query() query: any) {
  if (user.role === 'DP') {
    // Vê todos da empresa
    return this.service.findAll({ codEmpresa: user.cod_empresa });
  }
}

@Patch('colaboradores/atualizar')
@CheckPolicies((ability) => ability.can('update', 'Colaborador'))
async atualizar() {
  // Só DP tem permissão 'update' em 'Colaborador'
}
```

#### **3. Administrador**
```typescript
// user.role = 'ADMIN'
// Pode tudo

@Post('processos/executar')
@CheckPolicies((ability) => ability.can('execute', 'Processo'))
async executar(@AuthUser() user: UserAuth) {
  // ADMIN sempre passa
  // DP pode ter permissão específica (78005)
}
```

---

## 📋 **CHECKLIST DE IMPLEMENTAÇÃO**

### **Fase 1: Setup Básico (2-3 horas)**
- [ ] Instalar dependências: `nest-keycloak-connect`, `@casl/ability`, `@casl/prisma`
- [ ] Criar `auth.module.ts`
- [ ] Configurar variáveis de ambiente (.env)
- [ ] Registrar KeycloakConnectModule
- [ ] Criar tipos TypeScript (UserAuth)

### **Fase 2: Guards (3-4 horas)**
- [ ] Criar `local-user.guard.ts`
- [ ] Criar `policies.guard.ts`
- [ ] Registrar guards globais no AuthModule
- [ ] Criar decorator `@AuthUser()`
- [ ] Criar decorator `@NotRequiredLocalUser()`

### **Fase 3: Sistema CASL (4-6 horas)**
- [ ] Criar `casl.module.ts`
- [ ] Criar `ability-factory.service.ts`
- [ ] Criar decorator `@CheckPolicies()`
- [ ] Definir tipos de permissões (PermissionResource)
- [ ] Criar policies para cada módulo

### **Fase 4: Migrações e Dados (2-3 horas)**
- [ ] Criar tabela `User` (ou adaptar existente)
- [ ] Criar tabela `Permission`
- [ ] Criar tabela `PermissionRole`
- [ ] Criar tabela `PermissionUser`
- [ ] Seed de dados iniciais (roles, permissões padrão)

### **Fase 5: Aplicar nos Controllers (3-4 horas)**
- [ ] Atualizar `processo.controller.ts`
- [ ] Atualizar `colaborador.controller.ts`
- [ ] Atualizar `importacao.controller.ts`
- [ ] Adicionar validações de role/permissions
- [ ] Filtrar dados por usuário

### **Fase 6: Testes (2-3 horas)**
- [ ] Obter token JWT do Keycloak
- [ ] Testar endpoints com Postman
- [ ] Validar permissões por role
- [ ] Testar filtros de dados
- [ ] Documentar como obter/usar tokens

---

## 🚀 **PRÓXIMOS PASSOS**

1. ✅ Análise completa (ESTE DOCUMENTO)
2. ⏳ Instalar dependências
3. ⏳ Criar estrutura de módulos
4. ⏳ Implementar guards
5. ⏳ Configurar CASL
6. ⏳ Aplicar nos controllers

**Tempo estimado total:** 2-3 dias

---

**Documento criado em:** 27/01/2026  
**Projeto referência:** api-telefonia  
**Próximo passo:** Implementar no api-unimed
