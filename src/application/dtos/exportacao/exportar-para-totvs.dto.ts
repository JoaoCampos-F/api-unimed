import {
  IsInt,
  Min,
  Max,
  IsString,
  IsBoolean,
  IsOptional,
} from 'class-validator';

export class ExportarParaTOTVSDto {
  @IsInt({ message: 'Mês de referência deve ser um número inteiro' })
  @Min(1, { message: 'Mês deve ser maior ou igual a 1' })
  @Max(12, { message: 'Mês deve ser menor ou igual a 12' })
  mesRef: number;

  @IsInt({ message: 'Ano de referência deve ser um número inteiro' })
  @Min(2000, { message: 'Ano deve ser maior ou igual a 2000' })
  anoRef: number;

  @IsString({ message: 'Empresa deve ser uma string' })
  empresa: string; // Código da empresa como string (ex: '1', '2', '3')

  @IsBoolean({ message: 'Campo prévia deve ser booleano' })
  @IsOptional()
  previa?: boolean = false; // true = Gerar prévia, false = Definitivo

  @IsBoolean({ message: 'Campo apagar deve ser booleano' })
  @IsOptional()
  apagar?: boolean = false; // true = Apagar dados antigos

  @IsString({ message: 'CPF deve ser uma string' })
  @IsOptional()
  cpf?: string; // CPF específico (opcional, null = todos os colaboradores)
}
