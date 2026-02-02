import { IsString, Matches } from 'class-validator';

export class ImportarPeriodoDto {
  @IsString()
  @Matches(/^(0[1-9]|1[0-2])$/, { message: 'Mês inválido (01-12)' })
  mes: string; // "01", "02", ..., "12"

  @IsString()
  @Matches(/^\d{4}$/, { message: 'Ano inválido' })
  ano: string; // "2026"
}
