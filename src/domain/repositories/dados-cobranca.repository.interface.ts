import { Beneficiario } from '../entities/beneficiario.entity';
import { Empresa } from '../entities/empresa.entity';
import { Periodo } from '../value-objects/periodo.value-object';

export interface IDadosCobrancaRepository {
  persistirBeneficiarios(
    beneficiarios: Beneficiario[],
    empresa: Empresa,
    periodo: Periodo,
  ): Promise<number>;

  limparDadosImportacao(empresa: Empresa, periodo: Periodo): Promise<number>;
}
