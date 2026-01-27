import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { EmpresaRepository } from './repositories/empresa.repository';
import { DadosCobrancaRepository } from './repositories/dados-cobranca.repository';
import { ColaboradorRepository } from './repositories/colaborador.repository';
import { UnimedApiService } from './external-apis/unimed-api.service';
import { ProcessoRepository } from './repositories/processo.repository';
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
    EmpresaRepository,
    DadosCobrancaRepository,
    ProcessoRepository,
    UnimedApiService,
  ],
  exports: [
    'IEmpresaRepository',
    'IDadosCobrancaRepository',
    'IColaboradorRepository',
    'IProcessoRepository',
    EmpresaRepository,
    DadosCobrancaRepository,
    ProcessoRepository,
    UnimedApiService,
    AuthModule,
  ],
})
export class InfrastructureModule {}
