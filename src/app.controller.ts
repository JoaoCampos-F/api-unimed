import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { UnimedApiService } from './modules/unimed/services/unimed-api.service';
import { UnimedImportService } from './modules/unimed/services/unimed-import.service';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly unimedApiService: UnimedApiService,
    private readonly unimedImportService: UnimedImportService,
  ) {}

  @Get()
  async getHello(): Promise<string> {
    const result = await this.unimedImportService.buscaEmpresasUnimed();

    console.log('Token no Controller:', result);
    return this.appService.getHello();
  }
}
