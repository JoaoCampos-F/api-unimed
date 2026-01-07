import { IsNumberString, IsNotEmpty } from 'class-validator';

export class ImportUnimedDto {
  @IsNumberString()
  @IsNotEmpty({ message: 'Mês é obrigatório' })
  mes: string;

  @IsNumberString()
  @IsNotEmpty({ message: 'Ano é obrigatório' })
  ano: string;
}
