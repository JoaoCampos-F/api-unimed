# 🔐 AUTENTICAÇÃO KEYCLOAK - API UNIMED (Estratégia Simples)

**Data:** 27 de Janeiro de 2026  
**Objetivo:** Implementar autenticação usando Keycloak SSO (estratégia simplificada)

---

## 📊 COMPARATIVO DE ESTRATÉGIAS

### **API-TELEFONIA (Complexa - CASL)**

- 4 tabelas (Users, Permissions, PermissionRole, PermissionUser)
- CASL para permissões granulares com conditions
- Gerenciamento de roles DENTRO do sistema
- **Caso de uso:** Usuários internos gerenciam permissões via painel

### **API-PPLR (Simples - Keycloak puro)**

- 1 tabela (pplr_usuarios)
- Roles gerenciados 100% pelo Keycloak
- Autorização via código (Guards + Rules)
- **Caso de uso:** Roles centralizados no Keycloak SSO

### **✅ API-UNIMED (Escolhida: Simples como PPLR)**

- 1 tabela (pplr_usuarios)
- Roles gerenciados pelo Keycloak
- Guards baseados em roles do token JWT
- **Justificativa:** Não haverá gerenciamento de roles dentro do sistema

---

## 🎯 ARQUITETURA ESCOLHIDA

### **Biblioteca:** `nest-keycloak-connect`

**Guards (2 camadas):**

1. **AuthGuard** (valida JWT Keycloak)
2. **LocalUserGuard** (busca usuário no banco local)

**Autorização:**

- Decorators `@Roles()` (valida roles do token Keycloak)
- Guards customizados para filtros por empresa/colaborador
- Lógica de negócio no código (sem banco de permissões)

---

## 📋 ESTRUTURA DE TABELA (ORACLE)

### **Tabela Única: gc1.planos_saude_usuarios**

```sql
CREATE TABLE gc1.planos_saude_usuarios (
    id              NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    public_id       VARCHAR2(255) NOT NULL UNIQUE,  -- Keycloak sub (UUID)
    nome            VARCHAR2(255) NOT NULL,
    email           VARCHAR2(255) NOT NULL UNIQUE,
    cpf             VARCHAR2(11) UNIQUE,
    preferred_username VARCHAR2(100),               -- Username Keycloak
    ativo           CHAR(1) DEFAULT 'S' NOT NULL,   -- 'S' ou 'N'
    cod_empresa     NUMBER,                         -- Empresa vinculada (NULL = todas)
    codcoligada     NUMBER,
    codfilial       NUMBER,
    data_criacao    DATE DEFAULT SYSDATE,
    data_atualizacao DATE DEFAULT SYSDATE,

    CONSTRAINT ck_usuario_ativo CHECK (ativo IN ('S', 'N'))
);

-- Índices adicionais (id, public_id, email e cpf já têm índices únicos automáticos)
CREATE INDEX idx_psu_empresa ON gc1.planos_saude_usuarios(cod_empresa);
CREATE INDEX idx_psu_coligada ON gc1.planos_saude_usuarios(codcoligada);
CREATE INDEX idx_psu_filial ON gc1.planos_saude_usuarios(codfilial);
CREATE INDEX idx_psu_ativo ON gc1.planos_saude_usuarios(ativo);

-- Comentários
COMMENT ON TABLE gc1.planos_saude_usuarios IS 'Usuários do sistema integrados com Keycloak SSO';
COMMENT ON COLUMN gc1.planos_saude_usuarios.public_id IS 'ID único do usuário no Keycloak (sub - UUID)';
COMMENT ON COLUMN gc1.planos_saude_usuarios.cod_empresa IS 'Empresa vinculada ao usuário (NULL = acesso a todas empresas)';
```

**📝 Observações:**

- ✅ **SEM campo `role`** - Roles vêm do token Keycloak (`realm_access.roles`)
- ✅ **SEM tabelas de permissões** - Autorização via Guards no código
- ✅ **Sincronização automática** - Dados atualizados no primeiro login

---

## 🔄 MAPEAMENTO KEYCLOAK → BANCO LOCAL

### **Token JWT do Keycloak:**

```json
{
  "sub": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
  "preferred_username": "joao.silva",
  "name": "João Silva",
  "email": "joao@empresa.com",
  "email_verified": true,
  "realm_access": {
    "roles": ["COLABORADOR", "USER"]
  },
  "cpf": "12345678901",
  "cod_empresa": 71
}
```

### **Mapeamento para gc1.planos_saude_usuarios:**

```typescript
{
  public_id: token.sub,                           // f47ac10b-58cc-...
  preferred_username: token.preferred_username,   // joao.silva
  nome: token.name,                               // João Silva
  email: token.email,                             // joao@empresa.com
  cpf: token.cpf,                                 // 12345678901
  cod_empresa: token.cod_empresa,                 // 71 (do token)
  ativo: 'S'
}
```

**🔑 Roles (gerenciados no Keycloak):**

- `ADMIN` - Acesso total ao sistema
- `DP` - Departamento Pessoal (gerencia empresa específica)
- `COLABORADOR` - Acesso apenas aos próprios dados

---

## 🎯 ESTRATÉGIA DE SINCRONIZAÇÃO

### **LocalUserGuard - Primeira Autenticação:**

```typescript
@Injectable()
export class LocalUserGuard implements CanActivate {
  constructor(private readonly usuarioRepository: UsuarioRepository) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const keycloakUser = request.user; // Dados validados pelo AuthGuard

    // 1. Busca usuário no banco local
    let userAuth = await this.usuarioRepository.findByPublicId(
      keycloakUser.sub,
    );

    // 2. Se não existir, cria automaticamente
    if (!userAuth) {
      userAuth = await this.usuarioRepository.create({
        public_id: keycloakUser.sub,
        preferred_username: keycloakUser.preferred_username,
        nome: keycloakUser.name,
        email: keycloakUser.email,
        cpf: keycloakUser.cpf,
        cod_empresa: keycloakUser.cod_empresa,
        ativo: 'S',
      });
    }

    // 3. Atualiza dados se mudaram no Keycloak
    if (
      userAuth.email !== keycloakUser.email ||
      userAuth.nome !== keycloakUser.name
    ) {
      await this.usuarioRepository.update(userAuth.id, {
        email: keycloakUser.email,
        nome: keycloakUser.name,
        cod_empresa: keycloakUser.cod_empresa,
      });
    }

    // 4. Injeta no request (com roles do Keycloak)
    request.userAuth = {
      ...userAuth,
      roles: keycloakUser.realm_access?.roles || [],
    };

    return true;
  }
}
```

---

## 📊 AUTORIZAÇÃO POR CENÁRIO

### **Cenário 1: Colaborador**

**Token Keycloak:**

```json
{
  "sub": "uuid-123",
  "name": "João Silva",
  "cpf": "12345678901",
  "realm_access": {
    "roles": ["COLABORADOR"]
  }
}
```

**Guards aplicados:**

```typescript
@Controller('colaboradores')
export class ColaboradorController {
  @Get(':cpf')
  @Roles('COLABORADOR', 'DP', 'ADMIN') // Permite esses roles
  async buscar(@Param('cpf') cpf: string, @AuthUser() user: UserAuth) {
    // Guard customizado: COLABORADOR só acessa seu CPF
    if (user.roles.includes('COLABORADOR') && cpf !== user.cpf) {
      throw new ForbiddenException('Acesso negado');
    }

    return this.service.buscar(cpf);
  }
}
```

**✅ Pode fazer:**

- Ver apenas seus próprios gastos
- Acessar `/colaboradores/12345678901` (seu CPF)

**❌ NÃO pode fazer:**

- Acessar outros CPFs
- Executar processos
- Fazer importações

---

### **Cenário 2: Departamento Pessoal (DP)**

**Token Keycloak:**

```json
{
  "sub": "uuid-456",
  "name": "Maria Santos",
  "realm_access": {
    "roles": ["DP"]
  },
  "cod_empresa": 71
}
```

**Guards aplicados:**

```typescript
@Controller('processos')
export class ProcessoController {
  @Post('executar')
  @Roles('DP', 'ADMIN')
  async executar(@Body() dto: ExecutarProcessoDto, @AuthUser() user: UserAuth) {
    // DP só processa sua empresa
    if (user.roles.includes('DP')) {
      dto.cod_empresa = user.cod_empresa; // Força empresa 71
    }

    return this.service.executar(dto);
  }
}
```

**✅ Pode fazer:**

- Ver todos colaboradores da empresa 71
- Alterar flag `exporta='S'/'N'`
- Importar dados da Unimed
- Executar processos (apenas empresa 71)
- Exportar para TOTVS

**❌ NÃO pode fazer:**

- Ver/alterar dados de outras empresas
- Acessar empresas diferentes da sua

---

### **Cenário 3: Administrador**

**Token Keycloak:**

```json
{
  "sub": "uuid-789",
  "name": "Admin Sistema",
  "realm_access": {
    "roles": ["ADMIN"]
  }
}
```

**✅ Pode fazer TUDO:**

- Acesso irrestrito a todas as empresas
- Executar qualquer operação
- Sem filtros por empresa/colaborador

---

## 🚀 IMPLEMENTAÇÃO NO NESTJS

### **1. Estrutura de Módulos**

```

src/
├── modules/
│ └── auth/
│ ├── auth.module.ts
│ ├── guards/
│ │ ├── local-user.guard.ts
│ │ └── roles.guard.ts
│ ├── decorators/
│ │ ├── auth-user.decorator.ts
│ │ └── roles.decorator.ts
│ ├── repositories/
│ │ └── usuario.repository.ts
│ └── types/
│ └── user-auth.type.ts

```

---

### **2. AuthModule - Configuração**

```typescript
// src/modules/auth/auth.module.ts
import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import {
  KeycloakConnectModule,
  ResourceGuard,
  AuthGuard,
} from 'nest-keycloak-connect';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { LocalUserGuard } from './guards/local-user.guard';
import { RolesGuard } from './guards/roles.guard';
import { UsuarioRepository } from './repositories/usuario.repository';

@Module({
  imports: [
    KeycloakConnectModule.registerAsync({
      useFactory: (config: ConfigService) => ({
        authServerUrl: config.get('SSO_URL'),
        realm: config.get('SSO_REALM'),
        clientId: config.get('SSO_CLIENT_ID'),
        secret: config.get('SSO_SECRET'),
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [
    UsuarioRepository,
    {
      provide: APP_GUARD,
      useClass: AuthGuard, // 1º: Valida JWT Keycloak
    },
    {
      provide: APP_GUARD,
      useClass: LocalUserGuard, // 2º: Busca usuário no banco
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard, // 3º: Valida roles
    },
  ],
  exports: [UsuarioRepository],
})
export class AuthModule {}
```

---

### **3. RolesGuard - Validação de Roles**

```typescript
// src/modules/auth/guards/roles.guard.ts
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles) {
      return true; // Sem @Roles() = acesso público
    }

    const request = context.switchToHttp().getRequest();
    const userRoles = request.userAuth?.roles || [];

    return requiredRoles.some((role) => userRoles.includes(role));
  }
}
```

---

### **4. Decorators**

```typescript
// src/modules/auth/decorators/roles.decorator.ts
import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
```

```typescript
// src/modules/auth/decorators/auth-user.decorator.ts
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const AuthUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.userAuth;
  },
);
```

---

### **5. Uso nos Controllers**

```typescript
// src/presentation/controllers/processo.controller.ts
import { Controller, Post, Body } from '@nestjs/common';
import { Roles } from 'src/modules/auth/decorators/roles.decorator';
import { AuthUser } from 'src/modules/auth/decorators/auth-user.decorator';
import { UserAuth } from 'src/modules/auth/types/user-auth.type';

@Controller('processos')
export class ProcessoController {
  @Post('executar')
  @Roles('DP', 'ADMIN') // 👈 Apenas DP e ADMIN
  async executar(@Body() dto: ExecutarProcessoDto, @AuthUser() user: UserAuth) {
    // DP só processa sua empresa
    if (user.roles.includes('DP') && !user.roles.includes('ADMIN')) {
      dto.cod_empresa = user.cod_empresa;
    }

    return this.service.executar(dto, user);
  }

  @Post('apagar-dados')
  @Roles('ADMIN') // 👈 Apenas ADMIN (permissão 78004)
  async apagarDados(@Body() dto: ApagarDadosDto) {
    return this.service.apagarDados(dto);
  }
}
```

---

### **6. Variáveis de Ambiente (.env)**

```bash
# Keycloak SSO
SSO_URL=https://sso.sandboxcometa.com.br/
SSO_REALM=GC
SSO_CLIENT_ID=api-unimed
SSO_SECRET=sua-secret-aqui
```

---

## 📝 SCRIPT SQL SIMPLIFICADO

```sql
-- =====================================================
-- SCRIPT: TABELA DE USUÁRIOS (Estratégia Simples)
-- API-UNIMED - Keycloak SSO Integration
-- =====================================================

CREATE TABLE gc1.planos_saude_usuarios (
    id                  NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    public_id           VARCHAR2(255) NOT NULL UNIQUE,
    nome                VARCHAR2(255) NOT NULL,
    email               VARCHAR2(255) NOT NULL UNIQUE,
    cpf                 VARCHAR2(11) UNIQUE,
    preferred_username  VARCHAR2(100),
    ativo               CHAR(1) DEFAULT 'S' NOT NULL,
    cod_empresa         NUMBER,
    codcoligada         NUMBER,
    codfilial           NUMBER,
    data_criacao        DATE DEFAULT SYSDATE,
    data_atualizacao    DATE DEFAULT SYSDATE,

    CONSTRAINT ck_usuario_ativo CHECK (ativo IN ('S', 'N'))
);

-- Índices adicionais (id, public_id, email e cpf já têm índices únicos automáticos)
CREATE INDEX idx_psu_empresa ON gc1.planos_saude_usuarios(cod_empresa);
CREATE INDEX idx_psu_coligada ON gc1.planos_saude_usuarios(codcoligada);
CREATE INDEX idx_psu_filial ON gc1.planos_saude_usuarios(codfilial);
CREATE INDEX idx_psu_ativo ON gc1.planos_saude_usuarios(ativo);

-- Comentários
COMMENT ON TABLE gc1.planos_saude_usuarios IS 'Usuários integrados com Keycloak SSO';
COMMENT ON COLUMN gc1.planos_saude_usuarios.public_id IS 'UUID do Keycloak (sub do token JWT)';
COMMENT ON COLUMN gc1.planos_saude_usuarios.cod_empresa IS 'Empresa do usuário (NULL = todas)';
COMMENT ON COLUMN gc1.planos_saude_usuarios.ativo IS 'Status do usuário: S=Ativo, N=Inativo';

COMMIT;
```

---

## ✅ PRÓXIMOS PASSOS

1. **Executar script SQL no Oracle** ✅
2. **Instalar `nest-keycloak-connect`**
3. **Criar AuthModule com guards**
4. **Criar UsuarioRepository**
5. **Aplicar decorators nos controllers**
6. **Testar com token do Keycloak**

---

\*\*🎯 Estrutura simplificada - Roles no Keycloak, lógica no código

```

**✅ Pode fazer TUDO:**
- Acesso irrestrito a todas as empresas
---

**🎯 Estratégia simplificada - Roles no Keycloak, autorização no código!** 🚀
```
