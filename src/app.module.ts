import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './database/database.module';
import { UnimedApiModule } from './modules/unimed/unimed.module';
import { ImportacaoModule } from './modules/importacao/importacao.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),
    DatabaseModule,
    UnimedApiModule,
    ImportacaoModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
