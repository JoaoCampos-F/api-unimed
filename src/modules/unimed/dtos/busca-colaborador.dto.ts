import { IsString, IsOptional, IsNumberString } from 'class-validator';

export class BuscaColaboradorDto {
  @IsString()
  @IsOptional()
  busca_empresa?: string;

  @IsString()
  @IsOptional()
  busca_usuario?: string;

  @IsNumberString()
  @IsOptional()
  busca_mes?: string;

  @IsNumberString()
  @IsOptional()
  busca_ano?: string;

  @IsString()
  @IsOptional()
  busca_contrato?: string;

  @IsString()
  @IsOptional()
  departamento?: string;

  @IsString()
  @IsOptional()
  funcao?: string;
}
