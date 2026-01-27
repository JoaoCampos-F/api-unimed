/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import {
  BadRequestException,
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ExecutarProcessoDto } from 'src/application/dtos/processos/executar-processo.dto';
import type { IProcessoRepository } from 'src/domain/repositories/processo.repository.interface';

@Injectable()
export class ExecutarProcessoUseCase {
  constructor(
    @Inject('IProcessoRepository')
    private readonly processoRepository: IProcessoRepository,
    private readonly logger: Logger,
  ) {}

  async execute(request: ExecutarProcessoDto, usuario: string) {
    // Validação de permissões (implementar depois)
    if (request.apaga === 'S') {
      // TODO: Verificar permissão 78004
    }

    // Validar prazo (se aplicável)
    const validacao = await this.processoRepository.validarPrazoExecucao({
      mesRef: request.mesRef,
      anoRef: request.anoRef,
      processo: request.processo,
    });

    if (!validacao.dentroDoPrazo) {
      // TODO: Verificar permissão 78005
      throw new BadRequestException(
        `Processo fora do prazo. Data máxima: ${validacao.dataMaxima.toISOString().split('T')[0]}`,
      );
    }

    // Validação: CPF requer empresa
    if (request.cpf && !request.codEmpresa) {
      throw new BadRequestException(
        'É necessário informar empresa ao processar CPF específico',
      );
    }

    try {
      await this.processoRepository.executarProcesso({
        processo: request.processo,
        mesRef: request.mesRef,
        anoRef: request.anoRef,
        previa: request.previa || 'N',
        apaga: request.apaga || 'N',
        usuario,
        todasEmpresas: request.codEmpresa ? 'N' : 'S',
        codEmpresa: request.codEmpresa,
        codColigada: request.codColigada,
        codFilial: request.codFilial,
        codBand: request.codBand,
        tipoComissao: request.tipoComissao,
        cpf: request.cpf,
      });

      return {
        sucesso: true,
        mensagem: `Processo ${request.processo} executado com sucesso`,
      };
    } catch (error) {
      this.logger.error(`Erro ao executar processo: ${error.message}`);
      throw new InternalServerErrorException(
        `Erro ao executar processo: ${error.message}`,
      );
    }
  }
}
