import { Module } from '@nestjs/common';
import { UnimedApiService } from './services/unimed-api.service';

@Module({
  imports: [],
  controllers: [],
  providers: [UnimedApiService],
})
export class UnimedApiModule {}
