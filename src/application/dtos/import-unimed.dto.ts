import { IsString, IsNotEmpty, Matches } from 'class-validator';

export class ImportUnimedDto {
  @IsString()
  @IsNotEmpty({ message: 'Mês é obrigatório' })
  @Matches(/^(0[1-9]|1[0-2])$/, { message: 'Mês deve estar entre 01 e 12' })
  mes: string;

  @IsString()
  @IsNotEmpty({ message: 'Ano é obrigatório' })
  @Matches(/^\d{4}$/, { message: 'Ano deve ter 4 dígitos' })
  ano: string;
}
