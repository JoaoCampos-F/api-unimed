import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './database/database.module';
import { UnimedApiModule } from './modules/unimed/unimed.module';
import { UnimedApiService } from './modules/unimed/services/unimed-api.service';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),
    DatabaseModule,
    UnimedApiModule,
  ],
  controllers: [AppController],
  providers: [AppService, UnimedApiService],
})
export class AppModule {}
