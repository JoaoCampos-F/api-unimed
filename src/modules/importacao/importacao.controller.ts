import { Controller, Get, Query } from '@nestjs/common';
import { ImportUnimedDto } from './dtos/import-unimed.dto';
import { UnimedImportService } from './services/unimed-import.service';
import { BuscaEmpresasUnimedService } from './services/busca-empresas-unimed.service';

@Controller()
export class ImportacaoController {
  constructor(
    private readonly unimedImportService: UnimedImportService,
    private readonly buscaEmpresasUnimedService: BuscaEmpresasUnimedService,
  ) {}

  @Get('busca-dados-periodo-cnpj')
  async buscaDadosCnpj(@Query() params: ImportUnimedDto) {
    console.log('Parâmetros recebidos:', params);
    const result = await this.unimedImportService.importarPorCnpj(params);
    return result;
  }

  @Get('busca-empresas-unimed')
  async buscaEmpresasUnimed() {
    const result = await this.buscaEmpresasUnimedService.execute();
    return result;
  }

  @Get('executar-resumo')
  async executarResumo(@Query() params: ImportUnimedDto) {
    const result = await this.unimedImportService.executarResumo(params);
    return result;
  }
}
