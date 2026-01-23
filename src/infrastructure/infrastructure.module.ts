import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { EmpresaRepository } from './repositories/empresa.repository';
import { DadosCobrancaRepository } from './repositories/dados-cobranca.repository';
import { ColaboradorRepository } from './repositories/colaborador.repository';
import { UnimedApiService } from './external-apis/unimed-api.service';

@Module({
  imports: [DatabaseModule],
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
    EmpresaRepository,
    DadosCobrancaRepository,
    UnimedApiService,
  ],
  exports: [
    'IEmpresaRepository',
    'IDadosCobrancaRepository',
    'IColaboradorRepository',
    EmpresaRepository,
    DadosCobrancaRepository,
    UnimedApiService,
  ],
})
export class InfrastructureModule {}
