import { Module } from '@nestjs/common';
import { BuscaEmpresasUnimedService } from './services/busca-empresas-unimed.service';

@Module({
  imports: [],
  controllers: [],
  providers: [BuscaEmpresasUnimedService],
})
export class ImportacaoModule {}
