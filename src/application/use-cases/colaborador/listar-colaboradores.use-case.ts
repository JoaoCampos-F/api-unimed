import { Injectable } from '@nestjs/common';
import { ColaboradorRepository } from '../../../infrastructure/repositories/colaborador.repository';

export interface ColaboradorSimplificadoDto {
  codEmpresa: number;
  codColigada: number;
  codFilial: number;
  codBand: number;
  cpf: string;
  nome: string;
  apelido: string;
}

@Injectable()
export class ListarColaboradoresUseCase {
  constructor(private readonly colaboradorRepository: ColaboradorRepository) {}

  async execute(
    codEmpresa: number,
    codColigada: number,
  ): Promise<ColaboradorSimplificadoDto[]> {
    const resultado = await this.colaboradorRepository.buscarColaboradores({
      codEmpresa,
      codColigada,
      page: 1,
      pageSize: 10000, // Buscar todos para listagem
    });

    // Remover duplicatas por CPF
    const colaboradoresUnicos = new Map<string, ColaboradorSimplificadoDto>();

    resultado.data.forEach((colab) => {
      const cpf = colab.cpf.value;
      if (!colaboradoresUnicos.has(cpf)) {
        colaboradoresUnicos.set(cpf, {
          codEmpresa: colab.codEmpresa,
          codColigada: colab.codColigada,
          codFilial: colab.codFilial,
          codBand: colab.codBand,
          cpf: colab.cpf.value,
          nome: colab.nome,
          apelido: colab.apelido,
        });
      }
    });

    return Array.from(colaboradoresUnicos.values()).sort((a, b) =>
      a.nome.localeCompare(b.nome),
    );
  }
}
