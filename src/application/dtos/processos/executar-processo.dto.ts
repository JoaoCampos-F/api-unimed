import {
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  Max,
  Min,
} from 'class-validator';

export class ExecutarProcessoDto {
  @IsString()
  @IsNotEmpty()
  processo: string; // Código do processo

  @IsNumber()
  @Min(1)
  @Max(12)
  mesRef: number;

  @IsNumber()
  @Min(2020)
  anoRef: number;

  @IsIn(['S', 'N'])
  @IsOptional()
  previa?: 'S' | 'N' = 'N';

  @IsIn(['S', 'N'])
  @IsOptional()
  apaga?: 'S' | 'N' = 'N';

  @IsString()
  @IsNotEmpty()
  categoria: string; // 'UNI'

  @IsIn(['S', 'C'])
  @IsNotEmpty()
  tipoComissao: 'S' | 'C';

  @IsNumber()
  @IsOptional()
  codEmpresa?: number; // Se não informado: todas

  @IsNumber()
  @IsOptional()
  codColigada?: number;

  @IsNumber()
  @IsOptional()
  codFilial?: number;

  @IsNumber()
  @IsOptional()
  codBand?: number; // Bandeira (se todas empresas)

  @IsString()
  @IsOptional()
  @Matches(/^\d{11}$/)
  cpf?: string; // CPF específico (requer empresa)
}
