import { Module } from '@nestjs/common';
import { UnimedApiService } from './services/unimed-api.service';
import { UnimedController } from './unimed.controller';

@Module({
  controllers: [UnimedController],
  providers: [UnimedApiService],
  exports: [UnimedApiService],
})
export class UnimedApiModule {}
