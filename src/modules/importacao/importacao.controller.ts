import { Controller, Get, Query } from '@nestjs/common';
import { ImportUnimedDto } from './dtos/import-unimed.dto';
import { UnimedImportService } from './services/unimed-import.service';

@Controller()
export class ImportacaoController {
  constructor(private readonly unimedImportService: UnimedImportService) {}

  @Get('busca-dados-periodo-cnpj')
  async buscaDadosCnpj(@Query() params: ImportUnimedDto) {
    console.log('Parâmetros recebidos:', params);
    const result = await this.unimedImportService.importarPorCnpj(params);
    return result;
  }
}
