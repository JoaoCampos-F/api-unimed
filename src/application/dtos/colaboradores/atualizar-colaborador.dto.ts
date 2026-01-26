import { IsString, IsNotEmpty, IsIn, Matches } from 'class-validator';

export class AtualizarColaboradorDto {
  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{11}$/, { message: 'CPF deve ter 11 dígitos' })
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
