import { Module } from '@nestjs/common';
import { UnimedApiService } from './services/unimed-api.service';
import { UnimedImportService } from './services/unimed-import.service';

@Module({
  imports: [],
  controllers: [],
  providers: [UnimedApiService, UnimedImportService],
})
export class UnimedApiModule {}
