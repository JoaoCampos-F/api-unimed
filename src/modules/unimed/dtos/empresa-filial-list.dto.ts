import { IsNumber, IsString } from 'class-validator';

export class EmpresaFilialListDto {
  @IsNumber()
  COD_EMPRESA: number;
  @IsNumber()
  CODCOLIGADA: number;
  @IsNumber()
  CODFILIAL: number;
  @IsNumber()
  COD_BAND: number;

  @IsString()
  CNPJ: string;
}
