import { Module } from '@nestjs/common';
import { ApplicationModule } from '../application/application.module';
import { ImportacaoController } from './controllers/importacao.controller';
import { HealthController } from '../common/health/health.controller';

@Module({
  imports: [ApplicationModule],
  controllers: [ImportacaoController, HealthController],
})
export class PresentationModule {}