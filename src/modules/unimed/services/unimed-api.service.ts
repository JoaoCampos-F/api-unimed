import { ConfigService } from '@nestjs/config';
import { Injectable, Logger } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';

@Injectable()
export class UnimedApiService {
  private readonly apiUrl: string | undefined;
  private readonly apiUser: string | undefined;
  private readonly apiPassword: string | undefined;

  private token: string;

  private readonly apiClient: AxiosInstance;
  private readonly logger = new Logger(UnimedApiService.name);

  constructor(private configService: ConfigService) {
    this.apiUrl = this.configService.get<string>('UNIMED_API_URL');
    this.apiUser = 'cometa';
    this.apiPassword = 'C0m3t42019';

    this.apiClient = axios.create({
      baseURL: this.apiUrl,
      timeout: 5000,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  async getToken() {
    try {
      const response = await this.apiClient.post<string>('/Token/geratoken', {
        usuario: this.apiUser,
        senha: this.apiPassword,
      });
      this.logger.log('Token obtido com sucesso', response.data);

      this.token = response.data;
    } catch (e) {
      console.error(e);
    }
  }
}
