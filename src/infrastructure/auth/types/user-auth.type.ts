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
}

declare global {
  namespace Express {
    interface Request {
      userAuth?: UserAuth;
    }
  }
}
