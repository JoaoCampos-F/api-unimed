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

// Interface interna para organizar os parâmetros da lógica
interface ExecutarLogicaParams {
  processo: any; // Tipar com a Entidade de Processo correta
  codBand: string;
  codEmpresaInput: string;
  colaborador?: string;
  usuario: string;
  permissoes: string[];
  mesRef: number;
  anoRef: number;
  apagar: boolean;
  isPreview: boolean;
}

// Interface para os parâmetros que vão para o Repositório/Banco
interface ExecutarExportacaoRepoParams {
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
    const { processos: codigosProcessos, mesRef, anoRef } = dto;
    // Se não vier bandeira, assume 'T' (Todas/Geral), conforme lógica do PL/SQL
    const codBand = dto.codBand || 'T';
    const empresaInput = dto.empresa || 'T';
    const colaborador = dto.colaborador || '';

    this.logger.log(
      `Iniciando exportação TOTVS - Período: ${mesRef}/${anoRef} - Band: ${codBand} - Processos: ${codigosProcessos.join(', ')}`,
    );

    if (!mesRef || !anoRef || !codigosProcessos.length) {
      throw new BadRequestException(
        'Campos obrigatórios: mês, ano e processos',
      );
    }

    const processosEntidades = await Promise.all(
      codigosProcessos.map(async (cod) => {
        const proc = await this.processoRepository.buscarPorCodigo(cod);
        if (!proc) {
          throw new NotFoundException(
            `Processo ${cod} não encontrado ou inativo`,
          );
        }
        return proc;
      }),
    );

    this.logger.log(
      `Processos validados: ${processosEntidades.length} processo(s)`,
    );

    if (dto.apagar && !this.temPermissaoApagar(permissoes)) {
      throw new ForbiddenException(
        'Você não possui autorização para apagar dados antigos',
      );
    }

    const isPreview = dto.previa || false;
    const resultados: any[] = [];

    // 2. Executar cada processo solicitado
    for (const processo of processosEntidades) {
      const resultado = await this.executarLogicaProcesso({
        processo,
        codBand,
        codEmpresaInput: empresaInput,
        colaborador,
        usuario,
        permissoes,
        mesRef,
        anoRef,
        apagar: dto.apagar || false,
        isPreview,
      });

      resultados.push(resultado);
    }

    return {
      sucesso: true,
      mensagem: `${processosEntidades.length} processo(s) executado(s) com sucesso`,
      preview: isPreview ? resultados : undefined,
      empresasProcessadas: resultados.length, // Ajustar conforme retorno real
    };
  }

  private async executarLogicaProcesso(params: ExecutarLogicaParams) {
    const {
      processo,
      codEmpresaInput,
      colaborador,
      mesRef,
      anoRef,
      permissoes,
      codBand,
    } = params;

    const exportarTodasEmpresas = codEmpresaInput === 'T';

    // Define a flag P_TODAS que será enviada para a procedure P_MCW_EMPRESA_MAPA
    const todasEmpresasFlag: 'S' | 'N' = exportarTodasEmpresas ? 'S' : 'N';

    this.logger.log(
      `Configuração: Empresa='${codEmpresaInput}' (Todas=${todasEmpresasFlag}), Bandeira='${codBand}'`,
    );

    // 3. Validação: CPF requer empresa específica (Regra de Negócio Legada)
    if (colaborador && exportarTodasEmpresas) {
      throw new BadRequestException(
        'Para exportar colaborador específico, é necessário informar a empresa',
      );
    }

    // 4. Tratamento do ID da Empresa
    let codEmpresaNumber = 0;

    if (exportarTodasEmpresas) {
      // MODO LOTE (TODAS)
      // Não precisamos buscar as empresas no banco.
      // A procedure P_MCW_EMPRESA_MAPA vai selecionar as empresas baseada no codBand e Tipo.
      this.logger.log('Modo Lote: O Oracle gerenciará a seleção das empresas.');
      codEmpresaNumber = 0; // Envia 0 ou null pois o Oracle vai ignorar este campo quando P_TODAS='S'
    } else {
      // MODO INDIVIDUAL
      if (!codEmpresaInput) {
        throw new BadRequestException('Código da empresa é obrigatório');
      }
      codEmpresaNumber = parseInt(codEmpresaInput, 10);

      // Validação de segurança simples para garantir que virou número
      if (isNaN(codEmpresaNumber)) {
        throw new BadRequestException(
          `Código de empresa inválido: ${codEmpresaInput}`,
        );
      }
      this.logger.log(`Modo Individual: Empresa ${codEmpresaNumber}`);
    }

    // 5. Validação de Prazos (Fechamento)
    const dataFinal = await this.exportacaoRepository.buscarDataFinalPeriodo(
      mesRef,
      anoRef,
    );

    if (!dataFinal) {
      throw new NotFoundException(
        `Período de fechamento não encontrado: ${mesRef}/${anoRef}`,
      );
    }

    const hoje = new Date();
    const dataMaxima = new Date(dataFinal);
    dataMaxima.setDate(dataMaxima.getDate() + processo.dias);

    if (
      hoje > dataMaxima &&
      !this.temPermissaoExecutarForaDoPrazo(permissoes)
    ) {
      const dataMaximaFormatada = dataMaxima.toLocaleDateString('pt-BR');
      throw new ForbiddenException(
        `Processo ${processo.descricao} passou da data limite. Máximo: ${dataMaximaFormatada}`,
      );
    }

    // Monta o objeto final para o repositório
    const repoParams: ExecutarExportacaoRepoParams = {
      codigoProcesso: processo.codigo,
      codBand: codBand, // Passa 'T', '2', '4', etc. O Oracle decide quem filtrar.
      mesRef,
      anoRef,
      previa: params.isPreview,
      apagar: params.apagar,
      usuario: params.usuario,
      todas: todasEmpresasFlag, // 'S' ou 'N'
      codEmpresa: codEmpresaNumber, // 0 se for Todas, ID se for Específica
      categoria: processo.categoria,
      tipo: processo.tipoDado,
      cpf: colaborador || undefined,
    };

    if (params.isPreview) {
      return await this.executarPreview(repoParams);
    } else {
      return await this.executarExportacaoReal(repoParams);
    }
  }

  private async executarPreview(params: ExecutarExportacaoRepoParams) {
    this.logger.warn(`🔴 MODO PREVIEW - Processo ${params.codigoProcesso}`);

    // No preview, forçamos previa=true.
    // O Repositório deve chamar a procedure que faz ROLLBACK ou cálculo simulado.
    const preview = await this.exportacaoRepository.simularExportacao({
      ...params,
      codigo: params.codigoProcesso, // Ajuste de compatibilidade com a interface do repo
      bandeira: params.codBand,
      cpf: params.cpf || null,
      previa: true,
    });

    return {
      sucesso: true,
      mensagem: `[PREVIEW] Simulação concluída`,
      preview,
    };
  }

  private async executarExportacaoReal(params: ExecutarExportacaoRepoParams) {
    this.logger.log(
      `✅ EXECUTANDO EXPORTAÇÃO REAL - Processo ${params.codigoProcesso}`,
    );

    try {
      // Chamada ÚNICA ao banco.
      // Se params.todas == 'S', o Oracle processa todas as empresas de uma vez.
      await this.exportacaoRepository.executarExportacao({
        ...params,
        codigo: params.codigoProcesso,
        bandeira: params.codBand,
        cpf: params.cpf || null,
        previa: false,
      });

      const mensagem = `Exportação executada com sucesso no período ${params.mesRef}/${params.anoRef}`;
      this.logger.log(mensagem);

      return {
        sucesso: true,
        mensagem,
        empresasProcessadas: params.todas === 'S' ? 'Múltiplas (Lote)' : 1,
      };
    } catch (error) {
      this.logger.error(
        `Erro ao executar exportação ${params.codigoProcesso}: ${error.message}`,
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
