import { Module } from '@nestjs/common';
import { InfrastructureModule } from '../infrastructure/infrastructure.module';
import { ImportarDadosUnimedUseCase } from './use-cases/importar-dados-unimed.use-case';
import { ExecutarResumoUnimedUseCase } from './use-cases/executar-resumo-unimed.use-case';
import { BuscarEmpresasUnimedUseCase } from './use-cases/buscar-empresas-unimed.use-case';
import { ImportarUnimedPorCnpjUseCase } from './use-cases/importar-unimed-por-cnpj.use-case';
import { ImportarUnimedPorContratoUseCase } from './use-cases/importar-unimed-por-contrato.use-case';
import { BuscarColaboradoresUseCase } from './use-cases/buscar-colaboradores.use-case';
import { AtualizarValorEmpresaUseCase } from './use-cases/atualizar-valor-empresa.use-case';
import { AtualizarColaboradorUseCase } from './use-cases/atualizar-colaborador.use-case';
import { AtualizarTodosColaboradoresUseCase } from './use-cases/atualizar-todos-colaboradores.use-case';
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
  ],
})
export class ApplicationModule {}
