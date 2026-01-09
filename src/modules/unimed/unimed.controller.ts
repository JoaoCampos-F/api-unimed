import { Controller, Get, Param, Query } from '@nestjs/common';
import { UnimedImportService } from './services/unimed-import.service';
import { ImportUnimedDto } from './dtos/import-unimed.dto';
@Controller()
export class UnimedController {
  constructor(private readonly unimedImportService: UnimedImportService) {}

  @Get('busca-empresas-unimed')
  async buscaEmpresasUnimed() {
    const result = await this.unimedImportService.buscaEmpresasUnimed();
    return result;
  }

  @Get('busca-dados-periodo-cnpj')
  async buscaDadosCnpj(@Query() params: ImportUnimedDto) {
    console.log('Parâmetros recebidos:', params);
    const result = await this.unimedImportService.importarPorCnpj(params);
    return result;
  }
}
