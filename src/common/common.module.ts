import { Module } from '@nestjs/common';
import { GlobalExceptionFilter } from './filters/global-exception.filter';
import { LoggingInterceptor } from './interceptors/logging.interceptor';

@Module({
  providers: [GlobalExceptionFilter, LoggingInterceptor],
  exports: [GlobalExceptionFilter, LoggingInterceptor],
})
export class CommonModule {}