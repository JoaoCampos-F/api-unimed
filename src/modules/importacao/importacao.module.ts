import { Module } from '@nestjs/common';
import { BuscaEmpresasUnimedService } from './services/busca-empresas-unimed.service';
import { ImportacaoController } from './importacao.controller';
import { UnimedApiModule } from '../unimed/unimed.module';
import { UnimedImportService } from './services/unimed-import.service';
import { PersisteDadosCobrancaService } from './services/persiste-dados-cobranca.service';

@Module({
  imports: [UnimedApiModule],
  controllers: [ImportacaoController],
  providers: [
    BuscaEmpresasUnimedService,
    UnimedImportService,
    PersisteDadosCobrancaService,
  ],
})
export class ImportacaoModule {}
