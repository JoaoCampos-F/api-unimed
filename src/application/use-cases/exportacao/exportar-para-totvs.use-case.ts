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

interface ExecutarProcesso {
  codigoProcesso: string;
  codBand: string;
  codEmpresa: string;
  colaborador?: string;
  usuario: string;
  permissoes: string[];
  isPreview: boolean;
  mesRef: number;
  anoRef: number;
  apagar: boolean;
}

interface ExecutarExportacaoParams {
  codigoProcesso: string;
  codBand: string;
  mesRef: number;
  anoRef: number;
  previa: boolean;
  apagar: boolean;
  usuario: string;
  todas: 'S' | 'N';
  codEmpresa: number;
  tipo: string;
  categoria: string;
  cpf?: string;
}
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
    const processos = dto.processos;
    const codBand = dto.codBand || 'T';
    const empresa = dto.empresa || 'T';
    const colaborador = dto.colaborador || '';

    this.logger.log(
      `Iniciando exportação TOTVS - Período: ${dto.mesRef}/${dto.anoRef} - Processos: ${processos.join(', ')}`,
    );

    if (!dto.mesRef || !dto.anoRef || !processos.length) {
      throw new BadRequestException(
        'Campos obrigatórios: mês, ano e processos',
      );
    }

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

    if (dto.apagar && !this.temPermissaoApagar(permissoes)) {
      throw new ForbiddenException(
        'Você não possui autorização para apagar dados antigos',
      );
    }

    const isPreview = dto.previa || false;

    const resultados: any[] = [];
    for (const codigoProcesso of processos) {
      const resultado = await this.executarProcesso({
        codBand: codBand,
        codigoProcesso,
        codEmpresa: empresa,
        isPreview: isPreview,
        colaborador: colaborador,
        usuario: usuario,
        permissoes: permissoes,
        mesRef: dto.mesRef,
        anoRef: dto.anoRef,
        apagar: dto.apagar || false,
      });

      resultados.push(resultado);
    }

    return {
      sucesso: true,
      mensagem: `${processos.length} processo(s) executado(s) com sucesso`,
      preview: isPreview ? resultados : undefined,
      empresasProcessadas: resultados.length,
    };
  }

  private async executarProcesso(params: ExecutarProcesso) {
    const { codigoProcesso, codBand, codEmpresa, colaborador } = params;

    const exportarTodasEmpresas = codEmpresa === 'T';
    const todasEmpresasFlag: 'S' | 'N' = exportarTodasEmpresas ? 'S' : 'N';

    this.logger.log(
      `Modo selecionado: ${exportarTodasEmpresas ? 'TODAS as empresas ativas da Unimed' : 'Empresa específica'} (todas='${todasEmpresasFlag}')`,
    );

    // 3. Validação: CPF requer empresa específica (regra do NPD-Legacy)
    if (colaborador && exportarTodasEmpresas) {
      throw new BadRequestException(
        'Para exportar colaborador específico, é necessário informar a empresa',
      );
    }

    let empresas: Empresa[];

    if (exportarTodasEmpresas) {
      // CENÁRIO 1: Exportar TODAS empresas ativas da Unimed (empresa='T')
      // No NPD-Legacy: setTodasEmpresas('S') e processa todas automaticamente
      this.logger.log('Modo: TODAS as empresas ativas da Unimed');

      empresas = await this.empresaRepository.buscarEmpresasAtivasUnimed();

      if (empresas.length === 0) {
        throw new NotFoundException(
          'Nenhuma empresa ativa encontrada para processamento Unimed',
        );
      }

      this.logger.log(
        `Encontradas ${empresas.length} empresa(s) ativas para exportar`,
      );
    } else {
      if (!codEmpresa) {
        throw new BadRequestException('Código da empresa é obrigatório');
      }

      this.logger.log(`Modo: Empresa específica ${codEmpresa}`);
    }

    // 4. BUSCAR DADOS DO PROCESSO (tipo_dado e categoria)
    // No NPD-Legacy: setTipodeDado($_POST['tipo']) e setCategoria($_POST['categoria'])
    // Mas esses dados vem da tabela mcw_processo baseado no código selecionado
    const processo =
      await this.processoRepository.buscarPorCodigo(codigoProcesso);

    if (!processo) {
      throw new NotFoundException(
        `Processo ${codigoProcesso} não encontrado ou inativo`,
      );
    }

    const tipoProcesso = processo.tipoDado; // 'S' ou 'C'
    const categoriaProcesso = processo.categoria; // 'UNI', etc.

    this.logger.log(
      `Processo - Tipo: ${tipoProcesso}, Categoria: ${categoriaProcesso}`,
    );

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
      !this.temPermissaoExecutarForaDoPrazo(params.permissoes)
    ) {
      const dataMaximaFormatada = dataMaxima.toLocaleDateString('pt-BR');
      throw new ForbiddenException(
        `Processo ${processo.descricao} passou da data limite de exportação. Máximo: ${dataMaximaFormatada}`,
      );
    }

    if (params.isPreview) {
      this.logger.log('🔍 MODO PREVIEW - Dados não serão persistidos no TOTVS');
      return await this.executarPreview({
        codigoProcesso,
        codBand: codBand,
        mesRef: params.mesRef,
        anoRef: params.anoRef,
        previa: false,
        apagar: params.apagar || false,
        usuario: params.usuario,
        todas: todasEmpresasFlag,
        codEmpresa: parseInt(params.codEmpresa, 10),
        categoria: categoriaProcesso,
        tipo: tipoProcesso,
        cpf: colaborador || undefined,
      });
    } else {
      // MODO REAL (campo previa = false - como NPD-Legacy)
      this.logger.log(
        '✅ MODO EXECUÇÃO REAL - Dados serão persistidos no TOTVS',
      );
      return await this.executarExportacaoReal({
        codigoProcesso,
        codBand: codBand,
        mesRef: params.mesRef,
        anoRef: params.anoRef,
        previa: false,
        apagar: params.apagar || false,
        usuario: params.usuario,
        todas: todasEmpresasFlag,
        codEmpresa: parseInt(params.codEmpresa, 10),
        categoria: categoriaProcesso,
        tipo: tipoProcesso,
        cpf: colaborador || undefined,
      });
    }
  }

  /**
   * Executa preview da exportação (modo desenvolvimento)
   */
  private async executarPreview(params: ExecutarExportacaoParams) {
    this.logger.warn(
      '🔴 MODO PREVIEW - Exportação não será persistida (previa = true)',
    );

    const preview = await this.exportacaoRepository.simularExportacao({
      codigo: params.codigoProcesso, // ✅ Código do processo específico
      mesRef: params.mesRef,
      anoRef: params.anoRef,
      previa: true, // ✅ Sempre true para preview
      apagar: params.apagar || false,
      usuario: params.usuario,
      todas: 'N',
      codEmpresa: params.codEmpresa,
      bandeira: params.codBand,
      tipo: params.tipo, // ✅ Tipo do processo
      categoria: params.categoria, // ✅ Categoria do processo
      cpf: params.cpf || null,
    });

    return {
      sucesso: true,
      mensagem: `[PREVIEW] Simulação concluída - ${preview.colaboradoresAfetados} colaborador(es), Total: R$ ${preview.valorTotal.toFixed(2)}`,
      preview,
    };
  }

  /**
   * Executa exportação real (persistindo dados no TOTVS)
   */

  private async executarExportacaoReal(params: ExecutarExportacaoParams) {
    this.logger.log(
      '✅ EXECUTANDO EXPORTAÇÃO REAL - Dados serão persistidos no TOTVS',
    );

    try {
      await this.exportacaoRepository.executarExportacao({
        codigo: params.codigoProcesso,
        mesRef: params.mesRef,
        anoRef: params.anoRef,
        previa: false,
        apagar: params.apagar || false,
        usuario: params.usuario,
        todas: params.todas,
        codEmpresa: params.codEmpresa,
        bandeira: params.codBand,
        tipo: params.tipo,
        categoria: params.categoria,
        cpf: params.cpf || null,
      });

      const tipoExecucao = 'EXPORTAÇÃO';
      let alcance: string;

      const mensagem = `${tipoExecucao} executada com sucesso no período ${params.mesRef}/${params.anoRef}`;

      this.logger.log(mensagem);

      return {
        sucesso: true,
        mensagem,
        empresasProcessadas: params.todas === 'S' || 1,
      };
    } catch (error) {
      this.logger.error(
        `Erro ao executar exportação: ${error.message}`,
        error.stack,
      );
      throw new Error(`Erro ao executar exportação: ${error.message}`);
    }
  }

  private temPermissaoApagar(permissoes: string[]): boolean {
    return permissoes.includes('ADMIN') || permissoes.includes('DP');
  }

  private temPermissaoExecutarForaDoPrazo(permissoes: string[]): boolean {
    return permissoes.includes('ADMIN') || permissoes.includes('DP');
  }
}
