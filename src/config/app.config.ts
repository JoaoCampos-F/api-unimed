import { registerAs } from '@nestjs/config';
import { IsString, IsNumber, IsNotEmpty, validateSync } from 'class-validator';
import { plainToClass, Type } from 'class-transformer';

class AppConfig {
  @IsString()
  @IsNotEmpty()
  DATABASE_USER: string;

  @IsString()
  @IsNotEmpty()
  DATABASE_PASSWORD: string;

  @IsString()
  @IsNotEmpty()
  DATABASE_CONNECT_STRING: string;

  @IsString()
  @IsNotEmpty()
  UNIMED_API_URL: string;

  @IsString()
  @IsNotEmpty()
  UNIMED_API_USER: string;

  @IsString()
  @IsNotEmpty()
  UNIMED_API_PASSWORD: string;

  @Type(() => Number)
  @IsNumber()
  DATABASE_POOL_MIN: number = 2;

  @Type(() => Number)
  @IsNumber()
  DATABASE_POOL_MAX: number = 10;

  @Type(() => Number)
  @IsNumber()
  API_TIMEOUT: number = 30000;
}

export default registerAs('app', (): AppConfig => {
  const config = plainToClass(AppConfig, {
    DATABASE_USER: process.env.DB_USER,
    DATABASE_PASSWORD: process.env.DB_PASSWORD,
    DATABASE_CONNECT_STRING: process.env.DB_CONNECT_STRING,
    UNIMED_API_URL: process.env.UNIMED_API_URL,
    UNIMED_API_USER: process.env.UNIMED_API_USER,
    UNIMED_API_PASSWORD: process.env.UNIMED_API_PASSWORD,
    DATABASE_POOL_MIN: parseInt(process.env.DB_POOL_MIN || '2', 10),
    DATABASE_POOL_MAX: parseInt(process.env.DB_POOL_MAX || '10', 10),
    API_TIMEOUT: parseInt(process.env.API_TIMEOUT || '30000', 10),
  });

  const errors = validateSync(config);
  if (errors.length > 0) {
    throw new Error(
      `Configuração inválida: ${errors.map((e) => Object.values(e.constraints || {})).join(', ')}`,
    );
  }

  return config;
});