import { IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class AtualizarValorEmpresaDto {
  @IsNumber()
  @Type(() => Number)
  codEmpresa: number;

  @IsNumber()
  @Type(() => Number)
  codColigada: number;

  @IsNumber()
  @Type(() => Number)
  codFilial: number;

  @IsNumber()
  @Min(0, { message: 'Valor deve ser maior ou igual a zero' })
  @Type(() => Number)
  valor: number;
}
