import { Module } from '@nestjs/common';
import { InfrastructureModule } from '../infrastructure/infrastructure.module';
import { ImportarDadosUnimedUseCase } from './use-cases/importacao/importar-dados-unimed.use-case';
import { ExecutarResumoUnimedUseCase } from './use-cases/importacao/executar-resumo-unimed.use-case';
import { BuscarEmpresasUnimedUseCase } from './use-cases/importacao/buscar-empresas-unimed.use-case';
import { ImportarUnimedPorCnpjUseCase } from './use-cases/importacao/importar-unimed-por-cnpj.use-case';
import { ImportarUnimedPorContratoUseCase } from './use-cases/importacao/importar-unimed-por-contrato.use-case';
import { BuscarColaboradoresUseCase } from './use-cases/colaborador/buscar-colaboradores.use-case';
import { AtualizarValorEmpresaUseCase } from './use-cases/colaborador/atualizar-valor-empresa.use-case';
import { AtualizarColaboradorUseCase } from './use-cases/colaborador/atualizar-colaborador.use-case';
import { AtualizarTodosColaboradoresUseCase } from './use-cases/colaborador/atualizar-todos-colaboradores.use-case';
import { BuscarHistoricoUseCase } from './use-cases/processos/buscar-historico.use-case';
import { ExecutarProcessoUseCase } from './use-cases/processos/executar-processo.use-case';
import { ListarProcessosDisponiveisUseCase } from './use-cases/processos/listar-processos-disponiveis.use-case';
import { Logger } from '@nestjs/common';
@Module({
  imports: [InfrastructureModule],
  providers: [
    ImportarDadosUnimedUseCase,
    ExecutarResumoUnimedUseCase,
    BuscarEmpresasUnimedUseCase,
    ImportarUnimedPorCnpjUseCase,
    ImportarUnimedPorContratoUseCase,
    AtualizarColaboradorUseCase,
    AtualizarTodosColaboradoresUseCase,
    BuscarColaboradoresUseCase,
    AtualizarValorEmpresaUseCase,
    BuscarHistoricoUseCase,
    ExecutarProcessoUseCase,
    ListarProcessosDisponiveisUseCase,
    Logger,
  ],
  exports: [
    ImportarDadosUnimedUseCase,
    ExecutarResumoUnimedUseCase,
    BuscarEmpresasUnimedUseCase,
    ImportarUnimedPorCnpjUseCase,
    ImportarUnimedPorContratoUseCase,
    AtualizarColaboradorUseCase,
    AtualizarTodosColaboradoresUseCase,
    BuscarColaboradoresUseCase,
    AtualizarValorEmpresaUseCase,
    BuscarHistoricoUseCase,
    ExecutarProcessoUseCase,
    ListarProcessosDisponiveisUseCase,
  ],
})
export class ApplicationModule {}
