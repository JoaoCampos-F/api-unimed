import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { UnimedApiService } from './modules/unimed/services/unimed-api.service';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly unimedApiService: UnimedApiService,
  ) {}

  @Get()
  async getHello(): Promise<string> {
    await this.unimedApiService.getToken();

    console.log('Token no Controller:', this.unimedApiService['token']);
    return this.appService.getHello();
  }
}
