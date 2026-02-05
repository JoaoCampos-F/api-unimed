import { IsIn, IsNotEmpty, IsString } from 'class-validator';

export class ListarProcessosDisponiveisDto {
  @IsString()
  @IsNotEmpty()
  categoria: string; // 'UNI', 'DIRF'

  @IsIn(['S', 'C', 'U'])
  @IsNotEmpty()
  tipoDado: 'S' | 'C' | 'U';
}
