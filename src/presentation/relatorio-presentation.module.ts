import { Module } from '@nestjs/common';
import { RelatorioApplicationModule } from '../application/relatorio-application.module';
import { RelatorioController } from './controllers/relatorio.controller';

@Module({
  imports: [RelatorioApplicationModule],
  controllers: [RelatorioController],
})
export class RelatorioPresentationModule {}
