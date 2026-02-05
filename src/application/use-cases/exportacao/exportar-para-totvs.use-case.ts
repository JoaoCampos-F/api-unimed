import {
  Injectable,
  Logger,
  Inject,
  ForbiddenException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import type { IExportacaoRepository } from 'src/domain/repositories/exportacao.repository.interface';
import type { IEmpresaRepository } from 'src/domain/repositories/empresa.repository.interface';
import type { IProcessoRepository } from 'src/domain/repositories/processo.repository.interface';
import { ExportarParaTOTVSDto } from 'src/application/dtos/exportacao/exportar-para-totvs.dto';
import { Empresa } from 'src/domain/entities/empresa.entity';

@Injectable()
export class ExportarParaTOTVSUseCase {
  private readonly logger = new Logger(ExportarParaTOTVSUseCase.name);

  constructor(
    @Inject('IExportacaoRepository')
    private readonly exportacaoRepository: IExportacaoRepository,

    @Inject('IEmpresaRepository')
    private readonly empresaRepository: IEmpresaRepository,

    @Inject('IProcessoRepository')
    private readonly processoRepository: IProcessoRepository,
  ) {}

  async execute(
    dto: ExportarParaTOTVSDto,
    usuario: string,
    permissoes: string[],
  ): Promise<{
    sucesso: boolean;
    mensagem: string;
    preview?: any;
    empresasProcessadas?: number;
  }> {
    // Compatibilidade com DTO antigo
    const processos =
      dto.processos || (dto.codigoProcesso ? [dto.codigoProcesso] : []);
    const codBand = dto.codBand || dto.bandeira || 'T';
    const empresa = dto.empresa || 'T';
    const colaborador = dto.colaborador || dto.cpfColaborador || dto.cpf || '';

    this.logger.log(
      `Iniciando exportação TOTVS - Período: ${dto.mesRef}/${dto.anoRef} - Processos: ${processos.join(', ')}`,
    );

    // Validação como no NPD-Legacy: apenas mês, ano e processos são obrigatórios
    if (!dto.mesRef || !dto.anoRef || !processos.length) {
      throw new BadRequestException(
        'Campos obrigatórios: mês, ano e processos',
      );
    }

    // Validar cada processo existe e está ativo
    for (const codigoProcesso of processos) {
      const processo =
        await this.processoRepository.buscarPorCodigo(codigoProcesso);
      if (!processo) {
        throw new NotFoundException(
          `Processo ${codigoProcesso} não encontrado ou inativo`,
        );
      }
    }

    this.logger.log(`Processos validados: ${processos.length} processo(s)`);

    // Validar permissão para apagar dados
    if (dto.apagar && !this.temPermissaoApagar(permissoes)) {
      throw new ForbiddenException(
        'Você não possui autorização para apagar dados antigos',
      );
    }

    // Determinar modo de execução (preview ou real)
    const nodeEnv = process.env.NODE_ENV || 'development';
    const isProduction = nodeEnv === 'production';
    const isTest = nodeEnv === 'test' || nodeEnv === 'staging';
    const allowExecution = process.env.ALLOW_TOTVS_EXPORT === 'true';
    const shouldPreview = !isProduction && !isTest && !allowExecution;

    // Executar cada processo sequencialmente
    const resultados: any[] = [];
    for (const codigoProcesso of processos) {
      this.logger.log(`Processando: ${codigoProcesso}`);

      const resultado = await this.executarProcesso(
        {
          ...dto,
          codigoProcesso,
          codBand,
          empresa,
          colaborador,
        },
        usuario,
        permissoes,
        shouldPreview,
        isTest,
      );

      resultados.push(resultado);
    }

    return {
      sucesso: true,
      mensagem: `${processos.length} processo(s) executado(s) com sucesso`,
      preview: shouldPreview ? resultados : undefined,
      empresasProcessadas: resultados.length,
    };
  }

  private async executarProcesso(
    params: ExportarParaTOTVSDto & {
      codigoProcesso: string;
      codBand: string;
      empresa: string;
      colaborador: string;
    },
    usuario: string,
    permissoes: string[],
    shouldPreview: boolean,
    isTest: boolean,
  ) {
    const { codigoProcesso, codBand, empresa, colaborador } = params;

    // 1. Buscar processo para validações
    const processo =
      await this.processoRepository.buscarPorCodigo(codigoProcesso);
    if (!processo) {
      throw new NotFoundException(
        `Processo ${codigoProcesso} não encontrado ou inativo`,
      );
    }

    this.logger.log(
      `Processo selecionado: ${processo.descricao} (${processo.codigo})`,
    );

    // 2. LÓGICA DE FILTROS EM CASCATA (replicando NPD-Legacy)
    const exportarTodasEmpresas = empresa === 'T';

    // 3. Validação: CPF requer empresa específica (regra do NPD-Legacy)
    if (colaborador && exportarTodasEmpresas) {
      throw new BadRequestException(
        'Para exportar colaborador específico, é necessário informar a empresa',
      );
    }

    let empresas: Empresa[];
    let bandeiraFinal: string;
    let todas: 'S' | 'N';

    if (exportarTodasEmpresas) {
      // CENÁRIO 1: Exportar TODAS empresas de uma bandeira
      if (!codBand || codBand === 'T') {
        throw new BadRequestException(
          'Bandeira específica é obrigatória ao exportar todas as empresas',
        );
      }

      this.logger.log(`Modo: TODAS empresas da bandeira ${codBand}`);

      empresas = await this.empresaRepository.buscarPorBandeira(codBand);

      if (empresas.length === 0) {
        throw new NotFoundException(
          `Nenhuma empresa encontrada para bandeira ${codBand}`,
        );
      }

      bandeiraFinal = codBand;
      todas = 'S';

      this.logger.log(
        `Encontradas ${empresas.length} empresa(s) para exportar`,
      );
    } else {
      // CENÁRIO 2: Empresa específica (por código)
      if (!empresa || empresa === 'T') {
        throw new BadRequestException('Código da empresa é obrigatório');
      }

      this.logger.log(`Modo: Empresa específica ${empresa}`);

      const codEmpresa = parseInt(empresa, 10);
      if (isNaN(codEmpresa)) {
        throw new BadRequestException('Código da empresa deve ser um número');
      }

      const empresaObj =
        await this.empresaRepository.buscarPorCodigo(codEmpresa);
      if (!empresaObj) {
        throw new NotFoundException(`Empresa ${empresa} não encontrada`);
      }

      empresas = [empresaObj];
      bandeiraFinal = empresaObj.codBand.toString();
      todas = 'N';
    }

    // 4. Buscar data final do período (validação de prazo)
    const dataFinal = await this.exportacaoRepository.buscarDataFinalPeriodo(
      params.mesRef,
      params.anoRef,
    );

    if (!dataFinal) {
      throw new NotFoundException(
        `Período de fechamento não encontrado: ${params.mesRef}/${params.anoRef}`,
      );
    }

    // 5. Validar prazo de execução (usando dias do processo selecionado)
    const hoje = new Date();
    const dataMaxima = new Date(dataFinal);
    dataMaxima.setDate(dataMaxima.getDate() + processo.dias);

    if (
      hoje > dataMaxima &&
      !this.temPermissaoExecutarForaDoPrazo(permissoes)
    ) {
      const dataMaximaFormatada = dataMaxima.toLocaleDateString('pt-BR');
      throw new ForbiddenException(
        `Processo ${processo.descricao} passou da data limite de exportação. Máximo: ${dataMaximaFormatada}`,
      );
    }

    // 6. EXECUTAR EXPORTAÇÃO
    if (shouldPreview) {
      // MODO PREVIEW (apenas development)
      return await this.executarPreview(
        params,
        usuario,
        empresas[0],
        bandeiraFinal,
        colaborador,
      );
    } else {
      // MODO REAL (production/test ou com flag)
      return await this.executarExportacaoReal(
        params,
        usuario,
        empresas,
        bandeiraFinal,
        todas,
        colaborador,
        isTest,
      );
    }
  }

  /**
   * Executa preview da exportação (modo desenvolvimento)
   */
  private async executarPreview(
    params: ExportarParaTOTVSDto & { codigoProcesso: string },
    usuario: string,
    empresa: Empresa,
    codBand: string,
    cpf: string,
  ) {
    this.logger.warn(
      '🔴 MODO PREVIEW - Exportação não executada (ambiente development)',
    );

    const preview = await this.exportacaoRepository.simularExportacao({
      mesRef: params.mesRef,
      anoRef: params.anoRef,
      previa: params.previa || false,
      apagar: params.apagar || false,
      usuario,
      todas: 'N',
      codEmpresa: empresa.codEmpresa,
      bandeira: codBand,
      tipo: params.previa ? 'S' : 'C',
      categoria: 'UNI',
      cpf: cpf || null,
    });

    return {
      sucesso: true,
      mensagem: `[PREVIEW] Simulação concluída - ${preview.colaboradoresAfetados} colaborador(es), Total: R$ ${preview.valorTotal.toFixed(2)}`,
      preview,
    };
  }

  /**
   * Executa exportação real (production/test)
   */
  private async executarExportacaoReal(
    params: ExportarParaTOTVSDto & { codigoProcesso: string },
    usuario: string,
    empresas: Empresa[],
    codBand: string,
    todas: 'S' | 'N',
    cpf: string,
    isTest: boolean,
  ) {
    if (isTest) {
      this.logger.warn(
        '⚠️ EXECUTANDO EM AMBIENTE DE TESTE - Usar @rmteste se disponível',
      );
    }

    try {
      // Se todas='S', procedure processa múltiplas empresas
      // Se todas='N', processa apenas a empresa específica
      const codEmpresa = todas === 'S' ? '' : empresas[0].codEmpresa.toString();

      await this.exportacaoRepository.executarExportacao({
        mesRef: params.mesRef,
        anoRef: params.anoRef,
        previa: params.previa || false,
        apagar: params.apagar || false,
        usuario,
        todas,
        codEmpresa,
        bandeira: codBand,
        tipo: params.previa ? 'S' : 'C',
        categoria: 'UNI',
        cpf: cpf || null,
      });

      const tipoExecucao = params.previa ? 'PRÉVIA' : 'EXPORTAÇÃO';
      let alcance: string;

      if (cpf) {
        alcance = `CPF ${cpf}`;
      } else if (todas === 'S') {
        alcance = `todas as ${empresas.length} empresas da bandeira ${codBand}`;
      } else {
        alcance = `empresa ${empresas[0].codEmpresa}`;
      }

      const mensagem = `${tipoExecucao} executada com sucesso para ${alcance} no período ${params.mesRef}/${params.anoRef}`;

      this.logger.log(mensagem);

      return {
        sucesso: true,
        mensagem,
        empresasProcessadas: empresas.length,
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
   * Equivalente à permissão 78005 do sistema legado (comentado, apenas ADMIN)
   */
  private temPermissaoExecutarForaDoPrazo(permissoes: string[]): boolean {
    return permissoes.includes('ADMIN');
  }
}
