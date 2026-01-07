import { IsString, IsNotEmpty, IsIn } from 'class-validator';

export class UpdateColaboradorDto {
  @IsString()
  @IsNotEmpty()
  busca_usuario: string;

  @IsString()
  @IsNotEmpty()
  busca_mes: string;

  @IsString()
  @IsNotEmpty()
  busca_ano: string;

  @IsString()
  @IsIn(['S', 'N'])
  ckeckbox: 'S' | 'N';
}
