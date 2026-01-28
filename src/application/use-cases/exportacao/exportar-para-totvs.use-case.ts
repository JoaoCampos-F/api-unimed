import { Injectable, Logger, Inject, ForbiddenException } from '@nestjs/common';
import type { IExportacaoRepository } from 'src/domain/repositories/exportacao.repository.interface';
import type { IEmpresaRepository } from 'src/domain/repositories/empresa.repository.interface';
import { ExportarParaTOTVSDto } from 'src/application/dtos/exportacao/exportar-para-totvs.dto';

@Injectable()
export class ExportarParaTOTVSUseCase {
  private readonly logger = new Logger(ExportarParaTOTVSUseCase.name);
  private readonly CODIGO_PROCESSO_UNIMED = '90000001';

  constructor(
    @Inject('IExportacaoRepository')
    private readonly exportacaoRepository: IExportacaoRepository,

    @Inject('IEmpresaRepository')
    private readonly empresaRepository: IEmpresaRepository,
  ) {}

  async execute(
    dto: ExportarParaTOTVSDto,
    usuario: string,
    permissoes: string[],
  ): Promise<{ sucesso: boolean; mensagem: string; preview?: any }> {
    this.logger.log(
      `Iniciando exportação TOTVS - Empresa: ${dto.empresa}, Período: ${dto.mesRef}/${dto.anoRef}`,
    );

    // 1. Validar permissão para apagar dados
    if (dto.apagar && !this.temPermissaoApagar(permissoes)) {
      throw new ForbiddenException(
        'Você não possui autorização para apagar dados antigos',
      );
    }

    // 2. Validar código da empresa (deve ser número)
    const codEmpresa = parseInt(dto.empresa, 10);
    if (isNaN(codEmpresa)) {
      throw new Error(
        `Código da empresa inválido: ${dto.empresa}. Deve ser um número.`,
      );
    }

    // 3. Buscar empresa no banco
    const empresa = await this.empresaRepository.buscarPorCodigo(codEmpresa);
    if (!empresa) {
      throw new Error(`Empresa com código ${dto.empresa} não encontrada`);
    }

    // 4. Buscar data final do período
    const dataFinal = await this.exportacaoRepository.buscarDataFinalPeriodo(
      dto.mesRef,
      dto.anoRef,
    );

    if (!dataFinal) {
      throw new Error(
        `Período de fechamento não encontrado: ${dto.mesRef}/${dto.anoRef}`,
      );
    }

    // 5. Buscar configuração do processo (sempre '90000001' para Unimed)
    const configProcesso = await this.exportacaoRepository.buscarConfigProcesso(
      this.CODIGO_PROCESSO_UNIMED,
    );

    if (!configProcesso) {
      throw new Error(
        `Processo ${this.CODIGO_PROCESSO_UNIMED} (Exportação Unimed) não encontrado`,
      );
    }

    // 6. Validar prazo de execução
    const hoje = new Date();
    const dataMaxima = new Date(dataFinal);
    dataMaxima.setDate(dataMaxima.getDate() + configProcesso.dias);

    if (
      hoje > dataMaxima &&
      !this.temPermissaoExecutarForaDoPrazo(permissoes)
    ) {
      const dataMaximaFormatada = dataMaxima.toLocaleDateString('pt-BR');
      throw new ForbiddenException(
        `Processo ${configProcesso.descricao} passou da data limite de exportação. Máximo: ${dataMaximaFormatada}`,
      );
    }

    // 7. Determinar modo de execução baseado no ambiente
    const nodeEnv = process.env.NODE_ENV || 'development';
    const isProduction = nodeEnv === 'production';
    const isTest = nodeEnv === 'test' || nodeEnv === 'staging';
    const allowExecution = process.env.ALLOW_TOTVS_EXPORT === 'true';

    // MODO PREVIEW: apenas em development (não test/staging)
    const shouldPreview = !isProduction && !isTest && !allowExecution;

    if (shouldPreview) {
      this.logger.warn(
        '🔴 MODO PREVIEW - Exportação não executada (ambiente development)',
      );

      const preview = await this.exportacaoRepository.simularExportacao({
        mesRef: dto.mesRef,
        anoRef: dto.anoRef,
        previa: dto.previa || false,
        apagar: dto.apagar || false,
        usuario,
        codEmpresa: empresa.codEmpresa,
        bandeira: empresa.codBand.toString(),
        tipo: dto.previa ? 'S' : 'C', // S = Simplificado/Prévia, C = Completo
        categoria: 'UNI',
        cpf: dto.cpf || null,
      });

      return {
        sucesso: true,
        mensagem: `[PREVIEW] Simulação concluída - ${preview.colaboradoresAfetados} colaborador(es), Total: R$ ${preview.valorTotal.toFixed(2)}`,
        preview,
      };
    }

    // 8. Executar procedure de exportação TOTVS (produção, test/staging ou com flag)
    if (isTest) {
      this.logger.warn(
        '⚠️ EXECUTANDO EM AMBIENTE DE TESTE - Usar @rmteste se disponível',
      );
    }

    try {
      await this.exportacaoRepository.executarExportacao({
        mesRef: dto.mesRef,
        anoRef: dto.anoRef,
        previa: dto.previa || false,
        apagar: dto.apagar || false,
        usuario,
        codEmpresa: empresa.codEmpresa,
        bandeira: empresa.codBand.toString(),
        tipo: dto.previa ? 'S' : 'C',
        categoria: 'UNI',
        cpf: dto.cpf || null,
      });

      const tipoExecucao = dto.previa ? 'PRÉVIA' : 'EXPORTAÇÃO';
      const alcance = dto.cpf ? `CPF ${dto.cpf}` : 'todos os colaboradores';
      const mensagem = `${tipoExecucao} executada com sucesso para ${alcance} da empresa ${dto.empresa} no período ${dto.mesRef}/${dto.anoRef}`;

      this.logger.log(mensagem);

      return {
        sucesso: true,
        mensagem,
      };
    } catch (error) {
      this.logger.error(
        `Erro ao executar exportação: ${error.message}`,
        error.stack,
      );
      throw new Error(`Erro ao executar exportação: ${error.message}`);
    }
  }

  /**
   * Verifica se usuário tem permissão para apagar dados antigos
   * Equivalente à permissão 78004 do sistema legado
   */
  private temPermissaoApagar(permissoes: string[]): boolean {
    return permissoes.includes('ADMIN') || permissoes.includes('DP');
  }

  /**
   * Verifica se usuário tem permissão para executar fora do prazo
   * Equivalente à permissão 78005 do sistema legado
   */
  private temPermissaoExecutarForaDoPrazo(permissoes: string[]): boolean {
    return permissoes.includes('ADMIN');
  }
}
