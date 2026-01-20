import { IsNumberString, IsNotEmpty, Matches } from 'class-validator';
import { Transform } from 'class-transformer';

export class ImportarDadosUnimedDto {
  @IsNumberString({}, { message: 'Mês deve ser um número válido' })
  @IsNotEmpty({ message: 'Mês é obrigatório' })
  @Matches(/^(0[1-9]|1[0-2])$/, { message: 'Mês deve estar entre 01 e 12' })
  @Transform(({ value }) => value.padStart(2, '0'))
  mes: string;

  @IsNumberString({}, { message: 'Ano deve ser um número válido' })
  @IsNotEmpty({ message: 'Ano é obrigatório' })
  @Matches(/^(202[0-9]|203[0-9])$/, {
    message: 'Ano deve estar entre 2020 e 2039',
  })
  ano: string;
}
