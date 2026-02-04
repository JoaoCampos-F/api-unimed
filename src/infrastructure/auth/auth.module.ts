import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthGuard, KeycloakConnectModule } from 'nest-keycloak-connect';
import { LocalUserGuard } from './guards/local-user.guard';
import { RolesGuard } from './guards/roles.guard';
import { UsuarioRepository } from './repositories/usuario.repository';
import { ColaboradorRepository } from '../repositories/colaborador.repository';
import { DatabaseModule } from '../../database/database.module';

@Module({
  imports: [
    ConfigModule,
    DatabaseModule,
    KeycloakConnectModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        authServerUrl: config.get<string>('SSO_URL') || '',
        realm: config.get<string>('SSO_REALM') || '',
        clientId: config.get<string>('SSO_CLIENT_ID') || '',
        secret: config.get<string>('SSO_SECRET') || '',
        logLevels: ['error'],
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [
    UsuarioRepository,
    ColaboradorRepository,
    {
      provide: APP_GUARD,
      useClass: AuthGuard, // 1º: Valida JWT Keycloak
    },
    {
      provide: APP_GUARD,
      useClass: LocalUserGuard, // 2º: Busca/cria usuário no banco + enriquece com dados do colaborador
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
  exports: [UsuarioRepository],
})
export class AuthModule {}
