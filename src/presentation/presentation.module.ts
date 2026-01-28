import { Module } from '@nestjs/common';
import { ApplicationModule } from '../application/application.module';
import { ImportacaoController } from './controllers/importacao.controller';
import { HealthController } from '../common/health/health.controller';
import { ColaboradorController } from './controllers/colaborador.controller';
import { ProcessoController } from './controllers/processo.controller';
import { ExportacaoController } from './controllers/exportacao.controller';

@Module({
  imports: [ApplicationModule],
  controllers: [
    ImportacaoController,
    HealthController,
    ColaboradorController,
    ProcessoController,
    ExportacaoController,
  ],
})
export class PresentationModule {}
