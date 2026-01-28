import { IsInt, IsString, IsOptional, Matches, Min } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class GerarRelatorioPagamentoDto {
  @ApiProperty({
    description: 'Código da empresa',
    example: 1,
  })
  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(1)
  codEmpresa: number;

  @ApiProperty({
    description: 'Código da coligada',
    example: 1,
  })
  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(1)
  codColigada: number;

  @ApiProperty({
    description: 'Código da filial',
    example: 1,
  })
  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(1)
  codFilial: number;

  @ApiProperty({
    description: 'Mês de referência (01-12)',
    example: '01',
  })
  @IsString()
  @Matches(/^(0[1-9]|1[0-2])$/, {
    message: 'mesRef deve estar no formato 01-12',
  })
  mesRef: string;

  @ApiProperty({
    description: 'Ano de referência',
    example: 2025,
  })
  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(2000)
  anoRef: number;

  @ApiProperty({
    description: 'Código da bandeira',
    example: 1,
  })
  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(1)
  codBand: number;

  @ApiPropertyOptional({
    description: 'Código do contrato (filtro opcional)',
    example: '123456',
  })
  @IsOptional()
  @IsString()
  codContrato?: string;
}
