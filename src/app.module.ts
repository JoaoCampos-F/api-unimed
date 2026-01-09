import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './database/database.module';
import { UnimedApiModule } from './modules/unimed/unimed.module';
import { UnimedApiService } from './modules/unimed/services/unimed-api.service';
import { UnimedImportService } from './modules/unimed/services/unimed-import.service';
import { UnimedController } from './modules/unimed/unimed.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),
    DatabaseModule,
    UnimedApiModule,
  ],
  controllers: [AppController, UnimedController],
  providers: [AppService, UnimedApiService, UnimedImportService],
})
export class AppModule {}
