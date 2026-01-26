import { IsString, IsNotEmpty, IsIn, Matches } from 'class-validator';
import { Transform } from 'class-transformer';

export class AtualizarColaboradorDto {
  @Transform(({ value }) => value?.replace(/^0+/, '') || value)
  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{1,11}$/, { message: 'CPF deve ter até 11 dígitos' })
  cpf: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^(0[1-9]|1[0-2])$/)
  mesRef: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^(202[0-9]|203[0-9])$/)
  anoRef: string;

  @IsString()
  @IsIn(['S', 'N'])
  exporta: 'S' | 'N';
}
