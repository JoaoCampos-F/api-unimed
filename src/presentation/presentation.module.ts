import { Module } from '@nestjs/common';
import { ApplicationModule } from '../application/application.module';
import { InfrastructureModule } from '../infrastructure/infrastructure.module';
import { ImportacaoController } from './controllers/importacao.controller';
import { HealthController } from '../common/health/health.controller';
import { ColaboradorController } from './controllers/colaborador.controller';
import { ProcessoController } from './controllers/processo.controller';
import { ExportacaoController } from './controllers/exportacao.controller';
import { AuthController } from './controllers/auth.controller';
import { CommonController } from './controllers/common.controller';
import { DashboardController } from './controllers/dashboard.controller';
import { RelatorioPresentationModule } from './relatorio-presentation.module';
import { ExportacaoRepository } from 'src/infrastructure/repositories/exportacao.repository';
import { ColaboradorRepository } from 'src/infrastructure/repositories/colaborador.repository';

@Module({
  imports: [
    ApplicationModule,
    InfrastructureModule,
    RelatorioPresentationModule,
  ],
  controllers: [
    ImportacaoController,
    HealthController,
    ColaboradorController,
    ProcessoController,
    ExportacaoController,
    AuthController,
    CommonController,
    DashboardController,
  ],
  providers: [
    {
      provide: 'IExportacaoRepository',
      useClass: ExportacaoRepository,
    },
    ColaboradorRepository,
  ],
})
export class PresentationModule {}
