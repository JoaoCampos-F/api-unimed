import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

// src/application/dtos/processos/buscar-historico.dto.ts
export class BuscarHistoricoDto {
  @IsString()
  @IsNotEmpty()
  categoria: string;

  @IsNumber()
  @IsOptional()
  mesRef?: number;

  @IsNumber()
  @IsOptional()
  anoRef?: number;

  @IsString()
  @IsOptional()
  codigo?: string;
}
