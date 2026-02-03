import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { EmpresaRepository } from './repositories/empresa.repository';
import { DadosCobrancaRepository } from './repositories/dados-cobranca.repository';
import { ColaboradorRepository } from './repositories/colaborador.repository';
import { UnimedApiService } from './external-apis/unimed-api.service';
import { ProcessoRepository } from './repositories/processo.repository';
import { ExportacaoRepository } from './repositories/exportacao.repository';
import { TokenCacheRepository } from './repositories/token-cache.repository';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [DatabaseModule, AuthModule],
  providers: [
    {
      provide: 'IEmpresaRepository',
      useClass: EmpresaRepository,
    },
    {
      provide: 'IDadosCobrancaRepository',
      useClass: DadosCobrancaRepository,
    },
    {
      provide: 'IColaboradorRepository',
      useClass: ColaboradorRepository,
    },
    {
      provide: 'IProcessoRepository',
      useClass: ProcessoRepository,
    },
    {
      provide: 'IExportacaoRepository',
      useClass: ExportacaoRepository,
    },
    {
      provide: 'ITokenCacheRepository',
      useClass: TokenCacheRepository,
    },
    EmpresaRepository,
    DadosCobrancaRepository,
    ColaboradorRepository,
    ProcessoRepository,
    ExportacaoRepository,
    TokenCacheRepository,
    UnimedApiService,
  ],
  exports: [
    'IEmpresaRepository',
    'IDadosCobrancaRepository',
    'IColaboradorRepository',
    'IProcessoRepository',
    'IExportacaoRepository',
    'ITokenCacheRepository',
    EmpresaRepository,
    DadosCobrancaRepository,
    ColaboradorRepository,
    ProcessoRepository,
    ExportacaoRepository,
    TokenCacheRepository,
    UnimedApiService,
    AuthModule,
  ],
})
export class InfrastructureModule {}
