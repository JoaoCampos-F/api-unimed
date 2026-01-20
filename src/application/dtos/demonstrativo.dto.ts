import { IsBoolean, IsNumber, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class DemonstrativoDto {
  @Type(() => Array<MensalidadeDto>)
  mensalidades: MensalidadeDto[];

  @IsBoolean()
  status: boolean;

  @IsString()
  descricao_status: string;
}

export class MensalidadeDto {
  @IsString()
  contrato: string;

  @IsString()
  cnpj: string;

  @IsString()
  contratante: string;

  @IsString()
  nomeplano: string;

  @IsString()
  abrangencia: string;

  @IsString()
  codfatura: string;

  valor_fatura: number;

  @IsString()
  periodo: string;

  @Type(() => Array<ComposicaoDto>)
  composicoes: ComposicaoDto[];
}

export class ComposicaoDto {
  @IsString()
  codFatura: string;

  @IsString()
  codtitular: string;

  @IsString()
  titular: string;

  @IsString()
  cpftitular: string;

  @IsString()
  matricula: string;

  @IsString()
  acomodacao: string;

  @IsString()
  codbeneficiario: string;

  @IsString()
  beneficiario: string;

  @IsString()
  idade: string;

  @IsString()
  nascimento: string;

  @IsString()
  inclusao: string;

  @IsString()
  dependencia: string;

  @IsString()
  cpf: string;

  @IsNumber()
  valorcobrado: number;

  @IsString()
  descricao: string;
}
