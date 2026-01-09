import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './database/database.module';
import { UnimedApiModule } from './modules/unimed/unimed.module';
import { UnimedApiService } from './modules/unimed/services/unimed-api.service';
import { UnimedController } from './modules/unimed/unimed.controller';
import { ImportacaoController } from './modules/importacao/importacao.controller';
import { ImportacaoModule } from './modules/importacao/importacao.module';
import { UnimedImportService } from './modules/importacao/services/unimed-import.service';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),
    DatabaseModule,
    UnimedApiModule,
    ImportacaoModule,
  ],
  controllers: [AppController, UnimedController, ImportacaoController],
  providers: [AppService, UnimedApiService, UnimedImportService],
})
export class AppModule {}
