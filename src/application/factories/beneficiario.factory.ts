import { Injectable, Logger } from '@nestjs/common';
import { Beneficiario } from '../../domain/entities/beneficiario.entity';
import { CPF } from '../../domain/value-objects/cpf.value-object';
import { DemonstrativoDto } from '../dtos/demonstrativo.dto';
import { parseBrazilianDate } from '../../common/utils/date.utils';

type Error = {
  message: string;
  [key: string]: any;
};
@Injectable()
export class BeneficiarioFactory {
  private readonly logger = new Logger(BeneficiarioFactory.name);

  criarDeDemonstrativo(demonstrativo: DemonstrativoDto): Beneficiario[] {
    if (
      !demonstrativo.mensalidades ||
      demonstrativo.mensalidades.length === 0
    ) {
      return [];
    }

    const beneficiarios: Beneficiario[] = [];

    for (const mensalidade of demonstrativo.mensalidades) {
      if (mensalidade.composicoes) {
        for (const composicao of mensalidade.composicoes) {
          try {
            const dataNascimento = parseBrazilianDate(composicao.nascimento);
            const dataInclusao = parseBrazilianDate(composicao.inclusao);

            if (!dataNascimento || !dataInclusao) {
              this.logger.warn(
                `Datas inválidas para beneficiário ${composicao.codbeneficiario}: nascimento=${composicao.nascimento}, inclusão=${composicao.inclusao}`,
              );
              continue;
            }

            const beneficiario = new Beneficiario(
              composicao.codbeneficiario,
              composicao.beneficiario,
              new CPF(composicao.cpf),
              parseInt(composicao.idade, 10),
              dataNascimento,
              dataInclusao,
              composicao.dependencia,
              composicao.valorcobrado,
              composicao.descricao,
            );

            beneficiarios.push(beneficiario);
          } catch (error) {
            // Log do erro mas continua processamento
            if (error instanceof Error)
              this.logger.warn(
                `Erro ao criar beneficiário ${composicao.codbeneficiario}: ${error.message}`,
              );
          }
        }
      }
    }

    return beneficiarios;
  }
}
