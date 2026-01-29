import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { RelatorioInfrastructureModule } from '../infrastructure/relatorio-infrastructure.module';
import {
  GerarRelatorioColaboradorUseCase,
  GerarRelatorioEmpresaUseCase,
  GerarRelatorioPagamentoUseCase,
  GerarRelatorioNaoPagamentoUseCase,
  GerarResumoDeptoUseCase,
  GerarResumoCentroCustoUseCase,
} from './use-cases/relatorio';
import { EmpresaRepository } from 'src/infrastructure/repositories/empresa.repository';

@Module({
  imports: [DatabaseModule, RelatorioInfrastructureModule],
  providers: [
    GerarRelatorioColaboradorUseCase,
    GerarRelatorioEmpresaUseCase,
    GerarRelatorioPagamentoUseCase,
    GerarRelatorioNaoPagamentoUseCase,
    GerarResumoDeptoUseCase,
    GerarResumoCentroCustoUseCase,
    {
      provide: 'IEmpresaRepository',
      useClass: EmpresaRepository,
    },
  ],
  exports: [
    GerarRelatorioColaboradorUseCase,
    GerarRelatorioEmpresaUseCase,
    GerarRelatorioPagamentoUseCase,
    GerarRelatorioNaoPagamentoUseCase,
    GerarResumoDeptoUseCase,
    GerarResumoCentroCustoUseCase,
  ],
})
export class RelatorioApplicationModule {}
