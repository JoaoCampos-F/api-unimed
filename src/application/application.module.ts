import { Module } from '@nestjs/common';
import { InfrastructureModule } from '../infrastructure/infrastructure.module';
import { ImportarDadosUnimedUseCase } from './use-cases/importar-dados-unimed.use-case';
import { ExecutarResumoUnimedUseCase } from './use-cases/executar-resumo-unimed.use-case';
import { BuscarEmpresasUnimedUseCase } from './use-cases/buscar-empresas-unimed.use-case';
import { BeneficiarioFactory } from './factories/beneficiario.factory';

@Module({
  imports: [InfrastructureModule],
  providers: [
    ImportarDadosUnimedUseCase,
    ExecutarResumoUnimedUseCase,
    BuscarEmpresasUnimedUseCase,
    BeneficiarioFactory,
  ],
  exports: [
    ImportarDadosUnimedUseCase,
    ExecutarResumoUnimedUseCase,
    BuscarEmpresasUnimedUseCase,
  ],
})
export class ApplicationModule {}