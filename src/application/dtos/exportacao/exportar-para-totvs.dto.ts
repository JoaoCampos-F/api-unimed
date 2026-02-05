import {
  IsInt,
  Min,
  Max,
  IsString,
  IsBoolean,
  IsOptional,
  IsArray,
  ArrayNotEmpty,
} from 'class-validator';

export class ExportarParaTOTVSDto {
  @IsInt({ message: 'Mês de referência deve ser um número inteiro' })
  @Min(1, { message: 'Mês deve ser maior ou igual a 1' })
  @Max(12, { message: 'Mês deve ser menor ou igual a 12' })
  mesRef: number;

  @IsInt({ message: 'Ano de referência deve ser um número inteiro' })
  @Min(2000, { message: 'Ano deve ser maior ou igual a 2000' })
  anoRef: number;

  @IsArray({ message: 'Processos deve ser um array' })
  @ArrayNotEmpty({ message: 'Necessário selecionar ao menos um processo' })
  @IsString({
    each: true,
    message: 'Cada código de processo deve ser uma string',
  })
  processos: string[]; // Array de códigos dos processos MCW selecionados

  @IsString({ message: 'Bandeira deve ser uma string' })
  @IsOptional()
  codBand?: string = 'T'; // Código da bandeira/seguimento ('2', '4', etc.) ou 'T' para todas

  @IsString({ message: 'Empresa deve ser uma string' })
  @IsOptional()
  empresa?: string = 'T'; // Código da empresa ou 'T' para todas da bandeira

  @IsString({ message: 'CPF do colaborador deve ser uma string' })
  @IsOptional()
  colaborador?: string = ''; // CPF do colaborador específico ou vazio para todos

  @IsBoolean({ message: 'Campo prévia deve ser booleano' })
  @IsOptional()
  previa?: boolean = false; // true = Gerar prévia sem gravar definitivo

  @IsBoolean({ message: 'Campo apagar deve ser booleano' })
  @IsOptional()
  apagar?: boolean = false; // true = Apagar dados antigos antes de processar

  // Campos deprecados (mantidos para compatibilidade)
  @IsString({ message: 'Código do processo deve ser uma string' })
  @IsOptional()
  codigoProcesso?: string; // @deprecated - Use processos[]

  @IsString({ message: 'Bandeira deve ser uma string' })
  @IsOptional()
  bandeira?: string; // @deprecated - Use codBand

  @IsString({ message: 'CPF do colaborador deve ser uma string' })
  @IsOptional()
  cpfColaborador?: string; // @deprecated - Use colaborador

  @IsString({ message: 'CPF deve ser uma string' })
  @IsOptional()
  cpf?: string; // @deprecated - Use colaborador
}
