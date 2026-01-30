import { IsNumber, IsString, IsOptional, Matches, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class BuscarColaboradoresDto {
  @IsNumber()
  @Type(() => Number)
  codEmpresa: number;

  @IsNumber()
  @Type(() => Number)
  codColigada: number;

  @IsOptional()
  @IsString()
  @Matches(/^(0[1-9]|1[0-2])$/, { message: 'Mês deve estar entre 01 e 12' })
  mes?: string;

  @IsOptional()
  @IsString()
  @Matches(/^(202[0-9]|203[0-9])$/, {
    message: 'Ano deve estar entre 2020 e 2039',
  })
  ano?: string;

  @IsOptional()
  @IsString()
  @Matches(/^\d{11}$/, { message: 'CPF deve ter 11 dígitos' })
  cpf?: string;

  // 🔹 PAGINAÇÃO (DataTables format)
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(1, { message: 'Página deve ser maior ou igual a 1' })
  page?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(1, { message: 'Page size deve ser maior ou igual a 1' })
  pageSize?: number;

  @IsOptional()
  @IsString()
  search?: string; // Busca por nome ou CPF
}
