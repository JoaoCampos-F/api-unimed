export interface UserAuth {
  id: number;
  public_id: string;
  nome: string;
  email: string;
  cpf?: string;
  preferred_username?: string;
  ativo: string;
  cod_empresa?: number;
  codcoligada?: number;
  codfilial?: number;
  roles: string[]; // Roles do Keycloak (realm_access.roles)
  permissions?: Array<{
    // 🔥 NOVO: Permissões do Authorization Services
    rsid?: string; // Resource ID
    rsname?: string; // Resource Name
    scopes?: string[]; // Scopes permitidos
  }>;
}

declare global {
  namespace Express {
    interface Request {
      userAuth?: UserAuth;
    }
  }
}
