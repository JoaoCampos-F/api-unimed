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

  @IsString({ message: 'Bandeira deve ser uma string' })
  @IsOptional()
  bandeira?: string; // Código da bandeira/seguimento (ex: '1' = 2 rodas, '2' = 4 rodas)

  @IsString({ message: 'Empresa deve ser uma string' })
  @IsOptional()
  empresa?: string; // Sigla da empresa (ex: 'AF', 'BM') ou 'T' para todas da bandeira

  @IsString({ message: 'CPF do colaborador deve ser uma string' })
  @IsOptional()
  cpfColaborador?: string; // CPF do colaborador específico (requer empresa específica)

  @IsBoolean({ message: 'Campo prévia deve ser booleano' })
  @IsOptional()
  previa?: boolean = false; // true = Gerar prévia, false = Definitivo

  @IsBoolean({ message: 'Campo apagar deve ser booleano' })
  @IsOptional()
  apagar?: boolean = false; // true = Apagar dados antigos

  @IsString({ message: 'CPF deve ser uma string' })
  @IsOptional()
  cpf?: string; // @deprecated - Use cpfColaborador (mantido para compatibilidade)
}
