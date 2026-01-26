import { IsIn, IsNotEmpty, IsString } from 'class-validator';

export class ListarProcessosDisponiveisDto {
  @IsString()
  @IsNotEmpty()
  categoria: string; // 'UNI', 'DIRF'

  @IsIn(['S', 'C'])
  @IsNotEmpty()
  tipoDeDado: 'S' | 'C';
}
