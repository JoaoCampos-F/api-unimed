import { Controller, Get, Query, Res, HttpStatus } from '@nestjs/common';
import type { Response } from 'express';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import {
  GerarRelatorioColaboradorDto,
  GerarRelatorioEmpresaDto,
  GerarRelatorioPagamentoDto,
} from '../../application/dtos/relatorio';
import {
  GerarRelatorioColaboradorUseCase,
  GerarRelatorioEmpresaUseCase,
  GerarRelatorioPagamentoUseCase,
  GerarRelatorioNaoPagamentoUseCase,
  GerarResumoDeptoUseCase,
  GerarResumoCentroCustoUseCase,
} from '../../application/use-cases/relatorio';

/**
 * Controller para geração de relatórios PDF via JasperReports Server
 * Mantém compatibilidade com endpoints do sistema legado
 */
@ApiTags('Relatórios')
@Controller('relatorios')
export class RelatorioController {
  constructor(
    private readonly gerarRelatorioColaboradorUseCase: GerarRelatorioColaboradorUseCase,
    private readonly gerarRelatorioEmpresaUseCase: GerarRelatorioEmpresaUseCase,
    private readonly gerarRelatorioPagamentoUseCase: GerarRelatorioPagamentoUseCase,
    private readonly gerarRelatorioNaoPagamentoUseCase: GerarRelatorioNaoPagamentoUseCase,
    private readonly gerarResumoDeptoUseCase: GerarResumoDeptoUseCase,
    private readonly gerarResumoCentroCustoUseCase: GerarResumoCentroCustoUseCase,
  ) {}

  @Get('colaborador')
  @ApiOperation({
    summary: 'Gerar relatório de colaborador(es)',
    description:
      'Gera PDF com dados detalhados de colaborador(es). Pode filtrar por CPF específico.',
  })
  @ApiResponse({
    status: 200,
    description: 'PDF gerado com sucesso',
    content: {
      'application/pdf': {
        schema: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  async gerarRelatorioColaborador(
    @Query() dto: GerarRelatorioColaboradorDto,
    @Res() res: Response,
  ): Promise<void> {
    const pdf = await this.gerarRelatorioColaboradorUseCase.execute({
      codEmpresa: dto.codEmpresa,
      codColigada: dto.codColigada,
      codFilial: dto.codFilial,
      mesRef: dto.mesRef,
      anoRef: dto.anoRef,
      codBand: dto.codBand,
      cpf: dto.cpf,
      codContrato: dto.codContrato,
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `inline; filename="relatorio-colaborador-${dto.mesRef}-${dto.anoRef}.pdf"`,
    );
    res.status(HttpStatus.OK).send(pdf);
  }

  @Get('empresa')
  @ApiOperation({
    summary: 'Gerar relatório resumo da empresa',
    description:
      'Gera PDF com resumo de todos colaboradores da empresa (sem filtro por CPF).',
  })
  @ApiResponse({ status: 200, description: 'PDF gerado com sucesso' })
  async gerarRelatorioEmpresa(
    @Query() dto: GerarRelatorioEmpresaDto,
    @Res() res: Response,
  ): Promise<void> {
    const pdf = await this.gerarRelatorioEmpresaUseCase.execute({
      codEmpresa: dto.codEmpresa,
      codColigada: dto.codColigada,
      codFilial: dto.codFilial,
      mesRef: dto.mesRef,
      anoRef: dto.anoRef,
      codBand: dto.codBand,
      codContrato: dto.codContrato,
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `inline; filename="relatorio-empresa-${dto.mesRef}-${dto.anoRef}.pdf"`,
    );
    res.status(HttpStatus.OK).send(pdf);
  }

  @Get('pagamento')
  @ApiOperation({
    summary: 'Gerar relatório de colaboradores com lançamento',
    description: 'Gera PDF apenas com colaboradores que tem EXPORTA=S.',
  })
  @ApiResponse({ status: 200, description: 'PDF gerado com sucesso' })
  async gerarRelatorioPagamento(
    @Query() dto: GerarRelatorioPagamentoDto,
    @Res() res: Response,
  ): Promise<void> {
    const pdf = await this.gerarRelatorioPagamentoUseCase.execute({
      codEmpresa: dto.codEmpresa,
      codColigada: dto.codColigada,
      codFilial: dto.codFilial,
      mesRef: dto.mesRef,
      anoRef: dto.anoRef,
      codBand: dto.codBand,
      codContrato: dto.codContrato,
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `inline; filename="relatorio-pagamento-${dto.mesRef}-${dto.anoRef}.pdf"`,
    );
    res.status(HttpStatus.OK).send(pdf);
  }

  @Get('nao-pagamento')
  @ApiOperation({
    summary: 'Gerar relatório de colaboradores sem lançamento',
    description: 'Gera PDF apenas com colaboradores que tem EXPORTA=N.',
  })
  @ApiResponse({ status: 200, description: 'PDF gerado com sucesso' })
  async gerarRelatorioNaoPagamento(
    @Query() dto: GerarRelatorioPagamentoDto,
    @Res() res: Response,
  ): Promise<void> {
    const pdf = await this.gerarRelatorioNaoPagamentoUseCase.execute({
      codEmpresa: dto.codEmpresa,
      codColigada: dto.codColigada,
      codFilial: dto.codFilial,
      mesRef: dto.mesRef,
      anoRef: dto.anoRef,
      codBand: dto.codBand,
      codContrato: dto.codContrato,
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `inline; filename="relatorio-nao-pagamento-${dto.mesRef}-${dto.anoRef}.pdf"`,
    );
    res.status(HttpStatus.OK).send(pdf);
  }

  @Get('resumo-depto')
  @ApiOperation({
    summary: 'Gerar resumo por departamento',
    description: 'Gera PDF com agrupamento por colaborador e centro de custo.',
  })
  @ApiResponse({ status: 200, description: 'PDF gerado com sucesso' })
  async gerarResumoDepto(
    @Query() dto: GerarRelatorioPagamentoDto,
    @Res() res: Response,
  ): Promise<void> {
    const pdf = await this.gerarResumoDeptoUseCase.execute({
      codEmpresa: dto.codEmpresa,
      codColigada: dto.codColigada,
      codFilial: dto.codFilial,
      mesRef: dto.mesRef,
      anoRef: dto.anoRef,
      codBand: dto.codBand,
      codContrato: dto.codContrato,
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `inline; filename="resumo-depto-${dto.mesRef}-${dto.anoRef}.pdf"`,
    );
    res.status(HttpStatus.OK).send(pdf);
  }

  @Get('resumo-centro-custo')
  @ApiOperation({
    summary: 'Gerar totalização por centro de custo',
    description: 'Gera PDF com totais agregados por centro de custo.',
  })
  @ApiResponse({ status: 200, description: 'PDF gerado com sucesso' })
  async gerarResumoCentroCusto(
    @Query() dto: GerarRelatorioPagamentoDto,
    @Res() res: Response,
  ): Promise<void> {
    const pdf = await this.gerarResumoCentroCustoUseCase.execute({
      codEmpresa: dto.codEmpresa,
      codColigada: dto.codColigada,
      codFilial: dto.codFilial,
      mesRef: dto.mesRef,
      anoRef: dto.anoRef,
      codBand: dto.codBand,
      codContrato: dto.codContrato,
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `inline; filename="resumo-centro-custo-${dto.mesRef}-${dto.anoRef}.pdf"`,
    );
    res.status(HttpStatus.OK).send(pdf);
  }
}
