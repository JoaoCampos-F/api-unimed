import { Beneficiario } from '../entities/beneficiario.entity';
import { Empresa } from '../entities/empresa.entity';
import { Periodo } from '../value-objects/periodo.value-object';
import { DemonstrativoDto } from '../../application/dtos/demonstrativo.dto';

export interface IDadosCobrancaRepository {
  persistirBeneficiarios(
    beneficiarios: Beneficiario[],
    empresa: Empresa,
    periodo: Periodo,
  ): Promise<number>;

  persistirDeDemonstrativo(
    demonstrativo: DemonstrativoDto,
    empresa: Empresa,
    periodo: Periodo,
  ): Promise<number>;

  limparDadosImportacao(empresa: Empresa, periodo: Periodo): Promise<number>;

  executarResumo(periodo: Periodo): Promise<void>;
}
