import { Module } from '@nestjs/common';
import { RelatorioRepository } from './repositories/relatorio.repository';
import { JasperClientService } from './external-apis/jasper-client.service';

@Module({
  providers: [
    JasperClientService,
    {
      provide: 'IRelatorioRepository',
      useClass: RelatorioRepository,
    },
  ],
  exports: ['IRelatorioRepository'],
})
export class RelatorioInfrastructureModule {}
