# Opções para Implementação de Permissões no Keycloak

## Contexto

Atualmente, as permissões estão **hardcoded no AuthController** (backend). O Keycloak está configurado apenas com **RBAC básico** (roles: ADMIN, DP, COLABORADOR), mas **não está usando Authorization Services**.

---

## **Opção 1: Manter RBAC Simples + Refatorar para PermissionsService (RECOMENDADO)**

### Descrição

Manter a abordagem atual (mapping roles → permissions), mas **refatorar para Clean Architecture**.

### Implementação

```typescript
// src/application/services/permissions.service.ts
@Injectable()
export class PermissionsService {
  getPermissionsByRoles(roles: string[]): Record<string, string[]> {
    const permissions: Record<string, string[]> = {};

    if (roles.includes('ADMIN')) {
      return {
        importacao: ['create', 'list', 'delete'],
        exportacao: ['create', 'list'],
        colaboradores: ['create', 'list', 'update', 'delete'],
        processos: ['create', 'list', 'execute'],
        relatorios: ['list', 'download', 'all'],
      };
    }

    if (roles.includes('DP')) {
      return {
        importacao: ['create', 'list'],
        exportacao: ['create', 'list'],
        colaboradores: ['list', 'update'],
        processos: ['list', 'execute'],
        relatorios: ['list', 'download'],
      };
    }

    if (roles.includes('COLABORADOR')) {
      return {
        relatorios: ['list'],
      };
    }

    return permissions;
  }
}

// AuthController fica limpo
@Get('usuarios')
async buscarPermissoes(@AuthUser() user: UserAuth) {
  const permissions = this.permissionsService.getPermissionsByRoles(user.roles);
  return {
    permissions,
    roles: user.roles,
    rolesSystem: ['ADMIN', 'DP', 'COLABORADOR'],
  };
}
```

### Prós

- ✅ **Fácil de implementar** (30 minutos)
- ✅ **Segue Clean Architecture** (service layer)
- ✅ **Testável** (unit tests fáceis)
- ✅ **Sem mudanças no Keycloak**
- ✅ **Performance excelente** (sem overhead)

### Contras

- ❌ Permissões ainda hardcoded (mas em lugar correto)
- ❌ Mudanças exigem redeploy
- ❌ Não usa recursos avançados do Keycloak

### Quando usar

- **Projeto em desenvolvimento/MVP**
- **Permissões estáveis** (mudam raramente)
- **Equipe pequena** (sem necessidade de gestão descentralizada)

---

## **Opção 2: Database-Backed Permissions (Intermediária)**

### Descrição

Criar tabelas no banco de dados para armazenar permissões dinamicamente.

### Implementação

```sql
CREATE TABLE role_permissions (
  id SERIAL PRIMARY KEY,
  role VARCHAR(50) NOT NULL,
  resource VARCHAR(100) NOT NULL,
  scope VARCHAR(50) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(role, resource, scope)
);

-- Seed inicial
INSERT INTO role_permissions (role, resource, scope) VALUES
  ('ADMIN', 'importacao', 'create'),
  ('ADMIN', 'importacao', 'list'),
  ('ADMIN', 'importacao', 'delete'),
  ('DP', 'importacao', 'create'),
  ('DP', 'importacao', 'list');
```

```typescript
// PermissionsService consulta o banco
async getPermissionsByRoles(roles: string[]) {
  const permissions = await this.permissionsRepository.findByRoles(roles);
  return this.formatPermissions(permissions);
}
```

### Prós

- ✅ **Permissões dinâmicas** (sem redeploy)
- ✅ **UI de gestão** (pode criar CRUD no frontend)
- ✅ **Auditoria fácil** (histórico de mudanças)
- ✅ **Performance boa** (cache possível)

### Contras

- ❌ **Mais código** (repository, migrations, CRUD)
- ❌ **Mais complexidade** (sincronização entre ambientes)
- ❌ Não integrado com Keycloak

### Quando usar

- **Permissões mudam frequentemente**
- **Múltiplos ambientes** (dev/staging/prod)
- **Auditoria rigorosa**

---

## **Opção 3: Keycloak Authorization Services (Completa UMA)**

### Descrição

Usar **Authorization Services** do Keycloak com **Resources, Scopes, Policies e Permissions**.

### Configuração no Keycloak

#### 1. Habilitar Authorization

1. Admin Console → Clients → `api-planos-saude`
2. Settings → **Authorization Enabled: ON** → Save
3. Nova aba **Authorization** aparece

#### 2. Criar Resources

- Authorization → Resources → Create
  - **Name**: `importacao`
  - **Display name**: `Importação de Dados`
  - **Type**: `resource`
  - **Scopes**: `create, list, delete`

- Repetir para: `exportacao`, `colaboradores`, `processos`, `relatorios`

#### 3. Criar Policies (Role-Based)

- Authorization → Policies → Create Policy → Role
  - **Name**: `Admin Policy`
  - **Roles**: `ADMIN`
  - **Logic**: Positive

- Repetir para `DP Policy`, `Colaborador Policy`

#### 4. Criar Permissions (Resource-Based)

- Authorization → Permissions → Create Permission → Resource-Based
  - **Name**: `Importação Admin Permission`
  - **Resources**: `importacao`
  - **Apply Policy**: `Admin Policy`
  - **Decision Strategy**: Affirmative

#### 5. Backend: Extrair permissões do token

```typescript
// LocalUserGuard extrai permissões do token
const keycloakToken = keycloakUser.authorization; // Se Authorization Services ativo

if (keycloakToken?.permissions) {
  const permissions = keycloakToken.permissions.map((p) => ({
    resource: p.rsname,
    scopes: p.scopes,
  }));

  request.userAuth = {
    ...userAuth,
    roles: normalizedRoles,
    permissions, // Aqui vem direto do Keycloak!
  };
}
```

#### 6. Frontend: Solicitar token com permissões

```typescript
// main.ts - Trocar token normal por RPT (Requesting Party Token)
const rpt = await keycloak.authorization?.entitlement('api-planos-saude');
```

### Prós

- ✅ **Fine-grained permissions** (por recurso + scope)
- ✅ **Políticas avançadas** (ABAC, Time-based, Context-based)
- ✅ **Gestão centralizada** (Admin Console)
- ✅ **User-Managed Access** (usuários podem compartilhar recursos)
- ✅ **Audit trail completo**
- ✅ **Suporte para UMA 2.0**

### Contras

- ❌ **Configuração complexa** (curva de aprendizado alta)
- ❌ **Tokens maiores** (JWT com permissões pode crescer)
- ❌ **Performance** (mais calls ao Keycloak)
- ❌ **Debugging difícil** (problemas de permissão são obscuros)
- ❌ **Overhead operacional** (manutenção das policies no Keycloak)

### Quando usar

- **Aplicações enterprise** (alta compliance)
- **Múltiplos resource servers**
- **Permissões complexas** (contexto, atributos, tempo)
- **User-Managed Access** (usuários gerenciam seus próprios recursos)

---

## **Comparação Rápida**

| Critério                | Opção 1 (RBAC+Service) | Opção 2 (Database) | Opção 3 (Authorization Services) |
| ----------------------- | ---------------------- | ------------------ | -------------------------------- |
| **Complexidade**        | 🟢 Baixa               | 🟡 Média           | 🔴 Alta                          |
| **Tempo implementação** | 🟢 30min               | 🟡 4-8h            | 🔴 2-3 dias                      |
| **Flexibilidade**       | 🔴 Baixa               | 🟡 Média           | 🟢 Máxima                        |
| **Performance**         | 🟢 Excelente           | 🟢 Boa             | 🟡 Média                         |
| **Manutenção**          | 🟢 Simples             | 🟡 Média           | 🔴 Complexa                      |
| **Auditoria**           | 🔴 Manual              | 🟢 Boa             | 🟢 Completa                      |
| **Escalabilidade**      | 🟡 Média               | 🟢 Boa             | 🟢 Excelente                     |

---

## **Recomendação Final**

### **Para seu caso (API Unimed + SPA Planos Saúde):**

**Opção 1 (RBAC + PermissionsService)** é a melhor escolha porque:

1. ✅ **Você já tem roles bem definidas** (ADMIN, DP, COLABORADOR)
2. ✅ **Permissões são estáveis** (não mudam toda hora)
3. ✅ **Projeto em desenvolvimento** (foco em features, não em infraestrutura)
4. ✅ **Performance crítica** (consulta colaboradores, importações)
5. ✅ **Equipe pequena** (sem necessidade de gestão descentralizada)

### **Roadmap sugerido:**

#### **Curto prazo (Agora):**

- [ ] Refatorar para `PermissionsService` (Clean Architecture)
- [ ] Adicionar testes unitários para o service
- [ ] Manter roles no Keycloak

#### **Médio prazo (Se precisar):**

- [ ] Migrar para **Opção 2** (Database) se permissões mudarem muito
- [ ] Criar UI de gestão de permissões

#### **Longo prazo (Se crescer muito):**

- [ ] Avaliar **Opção 3** (Authorization Services) para compliance/audit avançado

---

## **Como decidir no futuro:**

### Migrar para Opção 2 (Database) se:

- ❓ Permissões mudarem > 1x por semana
- ❓ Múltiplos ambientes com configs diferentes
- ❓ Business solicitar UI de gestão

### Migrar para Opção 3 (Authorization Services) se:

- ❓ Necessidade de ABAC (Attribute-Based Access Control)
- ❓ Compliance exigir audit trail completo
- ❓ Múltiplos resource servers compartilhando permissões
- ❓ User-Managed Access (usuários gerenciando recursos próprios)

---

## **Próximos Passos**

Quer que eu implemente a **Opção 1** (refatorar para PermissionsService)?

Ou prefere que eu prepare o setup completo da **Opção 3** (Authorization Services no Keycloak + backend)?
