import { IsNumber, IsString, IsIn, Matches } from 'class-validator';
import { Type } from 'class-transformer';

export class AtualizarTodosColaboradoresDto {
  @IsNumber()
  @Type(() => Number)
  codEmpresa: number;

  @IsNumber()
  @Type(() => Number)
  codColigada: number;

  @IsNumber()
  @Type(() => Number)
  codFilial: number;

  @IsString()
  @Matches(/^(0[1-9]|1[0-2])$/)
  mesRef: string;

  @IsString()
  @Matches(/^(202[0-9]|203[0-9])$/)
  anoRef: string;

  @IsString()
  @IsIn(['S', 'N'])
  exporta: 'S' | 'N';
}
