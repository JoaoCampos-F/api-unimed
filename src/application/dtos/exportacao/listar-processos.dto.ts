import { IsInt, IsString, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO para listar processos disponíveis
 * Replicando comportamento do NPD-Legacy: carregaProcessosProcessa()
 */
export class ListarProcessosDto {
  @IsString()
  @ApiProperty({
    description: 'Categoria do processo',
    example: 'UNI',
    enum: ['UNI'],
  })
  categoria: string;

  @IsString()
  @ApiProperty({
    description: 'Tipo de dado (S=Sintético, C=Completo, U=Unimed)',
    example: 'U',
    enum: ['S', 'C', 'U'],
  })
  tipoDado: string;

  @IsInt()
  @Min(1)
  @Max(12)
  @ApiProperty({
    description: 'Mês de referência',
    example: 1,
    minimum: 1,
    maximum: 12,
  })
  mesRef: number;

  @IsInt()
  @Min(2000)
  @ApiProperty({
    description: 'Ano de referência',
    example: 2026,
    minimum: 2000,
  })
  anoRef: number;
}

/**
 * DTO de resposta com dados do processo
 */
export class ProcessoResponseDto {
  @ApiProperty({ description: 'Código do processo', example: '90000001' })
  codigo: string;

  @ApiProperty({ description: 'Categoria', example: 'UNI' })
  categoria: string;

  @ApiProperty({
    description: 'Nome da procedure Oracle',
    example: 'P_MCW_FECHA_COMISSAO_GLOBAL',
  })
  procedure: string;

  @ApiProperty({
    description: 'Descrição do processo',
    example: 'Exporta Unimed para Folha',
  })
  descricao: string;

  @ApiProperty({ description: 'Ordem de execução', example: 1 })
  ordem: number;

  @ApiProperty({
    description: 'Prazo em dias após fechamento do período',
    example: 5,
  })
  dias: number;

  @ApiProperty({ description: 'Usuário criador', example: 'SISTEMA' })
  usuario: string;

  @ApiProperty({ description: 'Tipo de empresa', example: 'T' })
  tipoEmpresa: string;

  @ApiProperty({ description: 'Tipo de dado', example: 'C' })
  tipoDado: string;

  @ApiProperty({ description: 'Status ativo', example: 'S' })
  ativo: string;

  @ApiProperty({
    description: 'Data/hora da última execução',
    example: '27/01/2026 15:31:05',
    nullable: true,
  })
  dataUltimaExecucao: string | null;
}
