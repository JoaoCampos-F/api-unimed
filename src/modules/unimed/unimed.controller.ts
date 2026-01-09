import { Controller, Get } from '@nestjs/common';
import { UnimedImportService } from '../importacao/services/unimed-import.service';

@Controller()
export class UnimedController {
  constructor(private readonly unimedImportService: UnimedImportService) {}

  @Get('busca-empresas-unimed')
  async buscaEmpresasUnimed() {
    const result = await this.unimedImportService.buscaEmpresasUnimed();
    return result;
  }
}
