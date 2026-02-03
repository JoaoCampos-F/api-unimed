# Implementação de Keycloak Authorization Services com RPT

## Problema Resolvido

O campo `authorization.permissions` não estava chegando no backend porque o frontend estava obtendo um **Access Token comum** (OAuth2 flow) em vez de um **RPT (Requesting Party Token)** com permissões do Authorization Services.

---

## O que foi implementado

### 1️⃣ Frontend: Solicitar RPT com permissões

**Arquivo**: `spa-planos-saude/src/main.ts`

Após o login, o frontend agora:

1. Faz login normal no Keycloak (obtém Access Token)
2. **Troca o Access Token por um RPT** fazendo request ao endpoint `/token` com:
   - `grant_type=urn:ietf:params:oauth:grant-type:uma-ticket`
   - `audience=api-planos-saude` (client ID do resource server)
3. Atualiza `keycloak.token` com o RPT
4. Usa o RPT como Bearer token em todas as requisições

```typescript
// Solicitar RPT com permissões do Authorization Services
const rptResponse = await fetch(
  `${keycloak.authServerUrl}/realms/${keycloak.realm}/protocol/openid-connect/token`,
  {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Bearer ${keycloak.token}`,
    },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:uma-ticket',
      audience: 'api-planos-saude',
    }),
  },
);
```

### 2️⃣ Backend: Extrair permissões do RPT

**Arquivo**: `src/infrastructure/auth/guards/local-user.guard.ts`

O `LocalUserGuard` agora:

1. Extrai `keycloakUser.authorization.permissions` do token JWT
2. Adiciona as permissões ao `request.userAuth`
3. Loga avisos se o token não contiver permissões

```typescript
// Extrai permissões do Authorization Services (se houver RPT)
let permissions: any = null;
if (keycloakUser.authorization?.permissions) {
  permissions = keycloakUser.authorization.permissions;
  this.logger.log(`✅ Permissões encontradas: ${permissions.length} recursos`);
} else {
  this.logger.warn('⚠️ Token não contém permissões. Usando fallback.');
}

request.userAuth = {
  ...userAuth,
  roles: normalizedRoles,
  permissions, // 🔥 Permissões do Authorization Services
};
```

### 3️⃣ AuthController: Usar permissões do Keycloak ou fallback

**Arquivo**: `src/presentation/controllers/auth.controller.ts`

O endpoint `GET /auth/usuarios` agora tem lógica de fallback:

**Prioridade 1**: Se `user.permissions` existir → Usa permissões do Authorization Services
**Prioridade 2**: Se não → Usa RBAC hardcoded (fallback)

```typescript
if (user.permissions && user.permissions.length > 0) {
  // Usa permissões do Keycloak
  const formattedPermissions = {};
  user.permissions.forEach((perm) => {
    formattedPermissions[perm.rsname] = perm.scopes;
  });
  return { permissions: formattedPermissions, source: 'keycloak' };
}

// Fallback para RBAC hardcoded
return { permissions: hardcodedPermissions, source: 'fallback' };
```

### 4️⃣ UserAuth Type: Adicionar campo permissions

**Arquivo**: `src/infrastructure/auth/types/user-auth.type.ts`

```typescript
export interface UserAuth {
  // ... campos existentes
  permissions?: Array<{
    rsid?: string; // Resource ID
    rsname?: string; // Resource Name
    scopes?: string[]; // Scopes permitidos
  }>;
}
```

---

## Como o RPT funciona

### Token JWT normal (Access Token):

```json
{
  "sub": "user-id",
  "preferred_username": "joao",
  "realm_access": { "roles": ["ADMIN"] },
  "resource_access": {
    "api-planos-saude": { "roles": ["ADMIN"] }
  }
}
```

### Token JWT com permissões (RPT):

```json
{
  "sub": "user-id",
  "preferred_username": "joao",
  "realm_access": { "roles": ["ADMIN"] },
  "authorization": {
    "permissions": [
      {
        "rsid": "d2fe9843-6462-4bfc-baba-b5787bb6e0e7",
        "rsname": "importacao",
        "scopes": ["create", "list", "delete"]
      },
      {
        "rsid": "a3bc1234-5678-9abc-def0-123456789abc",
        "rsname": "exportacao",
        "scopes": ["create", "list"]
      }
    ]
  }
}
```

---

## Como testar

### 1. Verificar configuração no Keycloak

#### Admin Console → Clients → `api-planos-saude`

- ✅ **Authorization Enabled**: ON
- ✅ **Service Accounts Enabled**: ON (opcional, mas recomendado)

#### Authorization → Resources

Verificar se os recursos estão criados:

- ✅ `importacao` (scopes: create, list, delete)
- ✅ `exportacao` (scopes: create, list)
- ✅ `colaboradores` (scopes: create, list, update, delete)
- ✅ `processos` (scopes: create, list, execute)
- ✅ `relatorios` (scopes: list, download, all)

#### Authorization → Policies

Verificar se as policies existem:

- ✅ `Admin Policy` (Role-based: ADMIN)
- ✅ `DP Policy` (Role-based: DP)
- ✅ `Colaborador Policy` (Role-based: COLABORADOR)

#### Authorization → Permissions

Verificar se as permissions estão associadas:

- ✅ `Importação Permission` → Resource: importacao → Policy: Admin Policy
- ✅ `Exportação Permission` → Resource: exportacao → Policy: Admin Policy, DP Policy
- E assim por diante...

### 2. Testar no Frontend

#### Abrir DevTools (F12) → Console

Após o login, verificar logs:

```
🔄 Solicitando RPT com permissões...
✅ RPT obtido com sucesso!
🔍 Permissões no RPT: [{rsname: 'importacao', scopes: [...]}]
✅ Permissões carregadas: ['ADMIN']
```

#### Se aparecer erro:

```
⚠️ Não foi possível obter RPT, usando access token normal
```

**Possíveis causas:**

- Authorization Services não está habilitado no Keycloak
- Resources/Policies/Permissions não estão configurados
- Usuário não tem permissão para nenhum recurso

### 3. Testar no Backend

#### Logs do NestJS

Quando o backend recebe uma requisição:

**Com RPT:**

```
[LocalUserGuard] ✅ Permissões do Authorization Services encontradas: 5 recursos
[LocalUserGuard] Usuário autenticado: joao | Roles: ADMIN
[AuthController] ✅ Usando permissões do Keycloak Authorization Services (5 recursos)
```

**Sem RPT (fallback):**

```
[LocalUserGuard] ⚠️ Token não contém permissões do Authorization Services.
[LocalUserGuard] Usuário autenticado: joao | Roles: ADMIN
[AuthController] ⚠️ Token não contém permissões. Usando RBAC hardcoded como fallback.
```

### 4. Testar endpoint /auth/usuarios

```bash
curl http://localhost:3000/auth/usuarios \
  -H "Authorization: Bearer $RPT"
```

**Resposta esperada (com RPT):**

```json
{
  "permissions": {
    "importacao": ["create", "list", "delete"],
    "exportacao": ["create", "list"],
    "colaboradores": ["create", "list", "update", "delete"],
    "processos": ["create", "list", "execute"],
    "relatorios": ["list", "download", "all"]
  },
  "roles": ["ADMIN"],
  "rolesSystem": ["ADMIN", "DP", "COLABORADOR"],
  "source": "keycloak-authorization-services"
}
```

**Resposta esperada (sem RPT - fallback):**

```json
{
  "permissions": {
    "importacao": ["create", "list", "delete"],
    "exportacao": ["create", "list"],
    "colaboradores": ["create", "list", "update", "delete"],
    "processos": ["create", "list", "execute"],
    "relatorios": ["list", "download", "all"]
  },
  "roles": ["ADMIN"],
  "rolesSystem": ["ADMIN", "DP", "COLABORADOR"],
  "source": "hardcoded-fallback"
}
```

**Campo `source` indica de onde vieram as permissões!**

---

## Troubleshooting

### Problema: RPT request retorna 403 Forbidden

**Causa**: Usuário não tem permissão para nenhum recurso no Keycloak.

**Solução**:

1. Admin Console → Authorization → Permissions
2. Verificar se as permissions estão associadas às policies corretas
3. Verificar se as policies estão associadas aos roles corretos

### Problema: RPT request retorna 400 Bad Request

**Causa**: Parâmetro `audience` está errado ou Authorization Services não está habilitado.

**Solução**:

1. Verificar se `audience=api-planos-saude` é exatamente o Client ID do resource server
2. Verificar se Authorization Enabled está ON no client

### Problema: Token não tem campo authorization.permissions

**Causa**: Token não é um RPT, é um Access Token comum.

**Solução**:

1. Verificar se o fetch do RPT está sendo executado (ver console do navegador)
2. Verificar se `keycloak.token` está sendo atualizado com o RPT
3. Verificar se o RPT está sendo enviado nas requisições ao backend

### Problema: Permissões estão vazias no RPT

**Causa**: Nenhuma permission foi configurada no Keycloak ou usuário não tem acesso.

**Solução**:

1. Admin Console → Authorization → Evaluate
2. Testar com o usuário específico
3. Ver quais permissions o Keycloak está concedendo
4. Ajustar policies/permissions conforme necessário

---

## Exemplo de configuração no Keycloak

### Resource: importacao

```
Name: importacao
Display Name: Importação de Dados
Type: resource
URI: /api/importacao
Scopes: create, list, delete
Owner: (vazio - pertence ao resource server)
```

### Policy: Admin Policy (Role-based)

```
Name: Admin Policy
Description: Apenas administradores
Roles: ADMIN (realm role ou client role)
Logic: Positive
```

### Permission: Importação Admin Permission (Resource-based)

```
Name: Importação Admin Permission
Description: Permite ADMIN acessar importação
Resources: importacao
Apply Policy: Admin Policy
Decision Strategy: Affirmative
```

---

## Próximos passos (opcional)

### 1. Remover fallback hardcoded (se não precisar)

Se todas as permissões vierem do Keycloak, pode remover o fallback:

```typescript
@Get('usuarios')
async buscarPermissoes(@AuthUser() user: UserAuth) {
  if (!user.permissions || user.permissions.length === 0) {
    throw new ForbiddenException('Usuário não possui permissões');
  }

  // Retornar apenas permissões do Keycloak
  const formattedPermissions = {};
  user.permissions.forEach((perm) => {
    formattedPermissions[perm.rsname] = perm.scopes;
  });

  return { permissions: formattedPermissions };
}
```

### 2. Cache de RPT no frontend

Para evitar solicitar RPT toda vez:

```typescript
// Armazenar RPT no sessionStorage
if (rptResponse.ok) {
  const rptData = await rptResponse.json();
  sessionStorage.setItem('rpt', rptData.access_token);
  keycloak.token = rptData.access_token;
}

// Verificar se já tem RPT em cache antes de solicitar novo
const cachedRpt = sessionStorage.getItem('rpt');
if (cachedRpt && !isTokenExpired(cachedRpt)) {
  keycloak.token = cachedRpt;
} else {
  // Solicitar novo RPT
}
```

### 3. Usar ResourceGuard do nest-keycloak-connect

Para proteção mais granular no backend:

```typescript
@Controller('importacao')
@Resource('importacao') // 🔥 Protege todo o controller
export class ImportacaoController {
  @Post()
  @Scopes('create') // 🔥 Requer scope 'create'
  async criar() {
    // Keycloak já validou permissão automaticamente
  }

  @Get()
  @Scopes('list') // 🔥 Requer scope 'list'
  async listar() {
    // Keycloak já validou permissão automaticamente
  }
}
```

---

## Vantagens dessa implementação

✅ **Permissões dinâmicas**: Configuradas no Keycloak Admin Console sem redeploy
✅ **Fallback robusto**: Sistema continua funcionando mesmo sem Authorization Services
✅ **Fine-grained permissions**: Controle por resource + scope
✅ **Audit trail**: Keycloak registra todas as avaliações de políticas
✅ **Escalável**: Fácil adicionar novos resources/scopes/policies
✅ **Testável**: Keycloak Evaluate permite simular permissões

---

## Documentação adicional

- [Keycloak Authorization Services](https://www.keycloak.org/docs/latest/authorization_services/)
- [UMA 2.0 Grant Type](https://docs.kantarainitiative.org/uma/wg/oauth-uma-grant-2.0-09.html)
- [nest-keycloak-connect ResourceGuard](https://github.com/ferrerojosh/nest-keycloak-connect#resource-guard)
