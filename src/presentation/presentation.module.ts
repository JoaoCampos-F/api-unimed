import { Module } from '@nestjs/common';
import { ApplicationModule } from '../application/application.module';
import { ImportacaoController } from './controllers/importacao.controller';
import { HealthController } from '../common/health/health.controller';
import { ColaboradorController } from './controllers/colaborador.controller';
import { ProcessoController } from './controllers/processo.controller';
import { ExportacaoController } from './controllers/exportacao.controller';
import { RelatorioPresentationModule } from './relatorio-presentation.module';
import { ExportacaoRepository } from 'src/infrastructure/repositories/exportacao.repository';

@Module({
  imports: [ApplicationModule, RelatorioPresentationModule],
  controllers: [
    ImportacaoController,
    HealthController,
    ColaboradorController,
    ProcessoController,
    ExportacaoController,
  ],
  providers: [
    {
      provide: 'IExportacaoRepository',
      useClass: ExportacaoRepository,
    },
  ],
})
export class PresentationModule {}
