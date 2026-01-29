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
import { ExportarParaTOTVSDto } from 'src/application/dtos/exportacao/exportar-para-totvs.dto';
import { Empresa } from 'src/domain/entities/empresa.entity';

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
  ): Promise<{
    sucesso: boolean;
    mensagem: string;
    preview?: any;
    empresasProcessadas?: number;
  }> {
    this.logger.log(
      `Iniciando exportação TOTVS - Período: ${dto.mesRef}/${dto.anoRef}`,
    );

    // 1. Validar permissão para apagar dados
    if (dto.apagar && !this.temPermissaoApagar(permissoes)) {
      throw new ForbiddenException(
        'Você não possui autorização para apagar dados antigos',
      );
    }

    // 2. Determinar CPF (compatibilidade com campo antigo)
    const cpfColaborador = dto.cpfColaborador || dto.cpf || null;

    // 3. LÓGICA DE FILTROS EM CASCATA (replicando NPD-Legacy)
    const exportarTodasEmpresas =
      dto.empresa === 'T' || (!dto.empresa && dto.bandeira);

    // 4. Validação: CPF requer empresa específica (regra do NPD-Legacy)
    if (cpfColaborador && exportarTodasEmpresas) {
      throw new BadRequestException(
        'Para exportar colaborador específico, é necessário informar a empresa',
      );
    }

    let empresas: Empresa[];
    let codBand: string;
    let todas: 'S' | 'N';

    if (exportarTodasEmpresas) {
      // CENÁRIO 1: Exportar TODAS empresas de uma bandeira
      if (!dto.bandeira) {
        throw new BadRequestException(
          'Bandeira é obrigatória ao exportar todas as empresas',
        );
      }

      this.logger.log(`Modo: TODAS empresas da bandeira ${dto.bandeira}`);

      empresas = await this.empresaRepository.buscarPorBandeira(dto.bandeira);

      if (empresas.length === 0) {
        throw new NotFoundException(
          `Nenhuma empresa encontrada para bandeira ${dto.bandeira}`,
        );
      }

      codBand = dto.bandeira;
      todas = 'S';

      this.logger.log(
        `Encontradas ${empresas.length} empresa(s) para exportar`,
      );
    } else {
      // CENÁRIO 2: Empresa específica (por sigla ou código)
      if (!dto.empresa) {
        throw new BadRequestException('Empresa ou bandeira é obrigatória');
      }

      this.logger.log(`Modo: Empresa específica ${dto.empresa}`);

      // Tentar buscar por sigla primeiro, depois por código
      let empresa = await this.empresaRepository.buscarPorSigla(dto.empresa);

      if (!empresa) {
        const codEmpresa = parseInt(dto.empresa, 10);
        if (!isNaN(codEmpresa)) {
          empresa = await this.empresaRepository.buscarPorCodigo(codEmpresa);
        }
      }

      if (!empresa) {
        throw new NotFoundException(`Empresa ${dto.empresa} não encontrada`);
      }

      empresas = [empresa];
      codBand = empresa.codBand.toString();
      todas = 'N';
    }

    // 5. Buscar data final do período (validação de prazo)
    const dataFinal = await this.exportacaoRepository.buscarDataFinalPeriodo(
      dto.mesRef,
      dto.anoRef,
    );

    if (!dataFinal) {
      throw new NotFoundException(
        `Período de fechamento não encontrado: ${dto.mesRef}/${dto.anoRef}`,
      );
    }

    // 6. Buscar configuração do processo
    const configProcesso = await this.exportacaoRepository.buscarConfigProcesso(
      this.CODIGO_PROCESSO_UNIMED,
    );

    if (!configProcesso) {
      throw new NotFoundException(
        `Processo ${this.CODIGO_PROCESSO_UNIMED} (Exportação Unimed) não encontrado`,
      );
    }

    // 7. Validar prazo de execução
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

    // 8. Determinar modo de execução (preview ou real)
    const nodeEnv = process.env.NODE_ENV || 'development';
    const isProduction = nodeEnv === 'production';
    const isTest = nodeEnv === 'test' || nodeEnv === 'staging';
    const allowExecution = process.env.ALLOW_TOTVS_EXPORT === 'true';
    const shouldPreview = !isProduction && !isTest && !allowExecution;

    // 9. EXECUTAR EXPORTAÇÃO
    if (shouldPreview) {
      // MODO PREVIEW (apenas development)
      return await this.executarPreview(
        dto,
        usuario,
        empresas[0],
        codBand,
        cpfColaborador,
      );
    } else {
      // MODO REAL (production/test ou com flag)
      return await this.executarExportacaoReal(
        dto,
        usuario,
        empresas,
        codBand,
        todas,
        cpfColaborador,
        isTest,
      );
    }
  }

  /**
   * Executa preview da exportação (modo desenvolvimento)
   */
  private async executarPreview(
    dto: ExportarParaTOTVSDto,
    usuario: string,
    empresa: Empresa,
    codBand: string,
    cpf: string | null,
  ) {
    this.logger.warn(
      '🔴 MODO PREVIEW - Exportação não executada (ambiente development)',
    );

    const preview = await this.exportacaoRepository.simularExportacao({
      mesRef: dto.mesRef,
      anoRef: dto.anoRef,
      previa: dto.previa || false,
      apagar: dto.apagar || false,
      usuario,
      todas: 'N',
      codEmpresa: empresa.codEmpresa,
      bandeira: codBand,
      tipo: dto.previa ? 'S' : 'C',
      categoria: 'UNI',
      cpf,
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
    dto: ExportarParaTOTVSDto,
    usuario: string,
    empresas: Empresa[],
    codBand: string,
    todas: 'S' | 'N',
    cpf: string | null,
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
        mesRef: dto.mesRef,
        anoRef: dto.anoRef,
        previa: dto.previa || false,
        apagar: dto.apagar || false,
        usuario,
        todas,
        codEmpresa,
        bandeira: codBand,
        tipo: dto.previa ? 'S' : 'C',
        categoria: 'UNI',
        cpf,
      });

      const tipoExecucao = dto.previa ? 'PRÉVIA' : 'EXPORTAÇÃO';
      let alcance: string;

      if (cpf) {
        alcance = `CPF ${cpf}`;
      } else if (todas === 'S') {
        alcance = `todas as ${empresas.length} empresas da bandeira ${codBand}`;
      } else {
        alcance = `empresa ${empresas[0].codEmpresa}`;
      }

      const mensagem = `${tipoExecucao} executada com sucesso para ${alcance} no período ${dto.mesRef}/${dto.anoRef}`;

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
   * Equivalente à permissão 78005 do sistema legado
   */
  private temPermissaoExecutarForaDoPrazo(permissoes: string[]): boolean {
    return permissoes.includes('ADMIN');
  }
}
