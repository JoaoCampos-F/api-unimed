# 🧪 Guia de Testes - Módulo de Relatórios

## 📋 Pré-requisitos

### 1. Configurar Variáveis de Ambiente

No arquivo `.env`, adicione:

```bash
JASPER_SERVER_URL=http://relatorio.viacometa.com.br:8080/jasperserver
JASPER_USERNAME=npd
JASPER_PASSWORD=npd1234@
```

### 2. Verificar Acesso ao JasperServer

O servidor JasperReports precisa estar acessível na rede local:

- URL: http://relatorio.viacometa.com.br:8080/jasperserver
- Credenciais: npd / npd1234@

## 🚀 Testes Rápidos

### Teste 1: Verificar Status do Servidor

```bash
# Subir a aplicação
pnpm run start:dev

# Testar conexão com JasperServer (via código)
```

Adicione esta rota temporária no [relatorio.controller.ts](src/presentation/controllers/relatorio.controller.ts):

```typescript
@Get('test-connection')
async testarConexao() {
  const jasperClient = new JasperClientService();
  const isConnected = await jasperClient.testConnection();
  return {
    conectado: isConnected,
    servidor: process.env.JASPER_SERVER_URL,
  };
}
```

### Teste 2: Gerar Relatório de Colaborador

**Requisição HTTP:**

```bash
GET http://localhost:3000/api/v1/relatorios/colaborador?codEmpresa=1&codColigada=1&codFilial=1&mesRef=01&anoRef=2025&codBand=1
```

**Com cURL:**

```bash
curl -X GET "http://localhost:3000/api/v1/relatorios/colaborador?codEmpresa=1&codColigada=1&codFilial=1&mesRef=01&anoRef=2025&codBand=1" \
  -H "Authorization: Bearer SEU_TOKEN_JWT" \
  --output relatorio-colaborador.pdf
```

**Com Postman/Insomnia:**

1. Método: `GET`
2. URL: `http://localhost:3000/api/v1/relatorios/colaborador`
3. Query Params:
   - `codEmpresa`: 1
   - `codColigada`: 1
   - `codFilial`: 1
   - `mesRef`: 01
   - `anoRef`: 2025
   - `codBand`: 1
   - `cpf` (opcional): 12345678900
4. Headers:
   - `Authorization`: Bearer {seu_token}
5. Save Response: `Save to file` → escolher `.pdf`

### Teste 3: Gerar Relatório de Empresa

```bash
GET http://localhost:3000/api/v1/relatorios/empresa?codEmpresa=1&codColigada=1&codFilial=1&mesRef=01&anoRef=2025&codBand=1
```

### Teste 4: Relatório de Pagamento

```bash
GET http://localhost:3000/api/v1/relatorios/pagamento?codEmpresa=1&codColigada=1&codFilial=1&mesRef=01&anoRef=2025&codBand=1
```

### Teste 5: Relatório de Não-Pagamento

```bash
GET http://localhost:3000/api/v1/relatorios/nao-pagamento?codEmpresa=1&codColigada=1&codFilial=1&mesRef=01&anoRef=2025&codBand=1
```

### Teste 6: Resumo por Departamento

```bash
GET http://localhost:3000/api/v1/relatorios/resumo-depto?codEmpresa=1&codColigada=1&codFilial=1&mesRef=01&anoRef=2025&codBand=1
```

### Teste 7: Resumo por Centro de Custo

```bash
GET http://localhost:3000/api/v1/relatorios/resumo-centro-custo?codEmpresa=1&codColigada=1&codFilial=1&mesRef=01&anoRef=2025&codBand=1
```

## 🔍 Teste Manual Completo

### Script PowerShell para Todos os Relatórios

Salve como `test-relatorios.ps1`:

```powershell
# Configuração
$baseUrl = "http://localhost:3000/api/v1/relatorios"
$token = "SEU_TOKEN_JWT_AQUI"
$outputDir = ".\relatorios-teste"

# Criar pasta de saída
New-Item -ItemType Directory -Force -Path $outputDir | Out-Null

# Parâmetros padrão
$params = @{
    codEmpresa = 1
    codColigada = 1
    codFilial = 1
    mesRef = "01"
    anoRef = 2025
    codBand = 1
}

# Função para baixar relatório
function Get-Relatorio {
    param(
        [string]$Endpoint,
        [hashtable]$Params,
        [string]$OutputFile
    )

    $queryString = ($Params.GetEnumerator() | ForEach-Object { "$($_.Key)=$($_.Value)" }) -join "&"
    $url = "$baseUrl/$Endpoint?$queryString"

    Write-Host "🔄 Gerando: $Endpoint..." -ForegroundColor Yellow

    try {
        Invoke-WebRequest -Uri $url `
            -Method GET `
            -Headers @{ Authorization = "Bearer $token" } `
            -OutFile "$outputDir\$OutputFile"

        Write-Host "✅ Sucesso: $OutputFile" -ForegroundColor Green
    } catch {
        Write-Host "❌ Erro: $_" -ForegroundColor Red
    }
}

# Executar testes
Write-Host "`n🧪 Iniciando testes de relatórios...`n" -ForegroundColor Cyan

Get-Relatorio -Endpoint "colaborador" -Params $params -OutputFile "01-colaborador.pdf"
Get-Relatorio -Endpoint "empresa" -Params $params -OutputFile "02-empresa.pdf"
Get-Relatorio -Endpoint "pagamento" -Params $params -OutputFile "03-pagamento.pdf"
Get-Relatorio -Endpoint "nao-pagamento" -Params $params -OutputFile "04-nao-pagamento.pdf"
Get-Relatorio -Endpoint "resumo-depto" -Params $params -OutputFile "05-resumo-depto.pdf"
Get-Relatorio -Endpoint "resumo-centro-custo" -Params $params -OutputFile "06-resumo-centro-custo.pdf"

Write-Host "`n✨ Testes concluídos! Verifique a pasta: $outputDir" -ForegroundColor Cyan
```

**Executar:**

```powershell
.\test-relatorios.ps1
```

## 🐛 Troubleshooting

### Erro: "Cannot find module 'axios'"

```bash
pnpm add axios
```

### Erro: "Connection timeout"

**Problema:** JasperServer não está acessível

**Soluções:**

1. Verificar se o servidor está online:

   ```bash
   curl http://relatorio.viacometa.com.br:8080/jasperserver
   ```

2. Verificar firewall/rede

3. Testar credenciais no navegador:
   - Abrir: http://relatorio.viacometa.com.br:8080/jasperserver
   - Login: npd / npd1234@

### Erro: "Empresa não encontrada"

**Problema:** Parâmetros inválidos

**Solução:** Usar dados reais do banco:

```sql
SELECT CODEMPRESA, CODCOLIGADA, CODFILIAL, NOME
FROM gc.unimed_empresa
WHERE ROWNUM <= 5;
```

### Erro: "Report not found"

**Problema:** Template não existe no JasperServer

**Solução:** Verificar templates disponíveis:

- Acessar JasperServer web interface
- Navegar para: `/reports/INTRANET/uni/`
- Confirmar que existem os 6 arquivos:
  - RelatorioColaborador.jrxml
  - relatorioCobranca_por_empresa.jrxml
  - RelatorioPagamento.jrxml
  - RelatorioNaoPagamento.jrxml
  - resumoDept.jrxml
  - resumoCentroCust.jrxml

### Erro 401 Unauthorized

**Problema:** Token JWT não enviado ou inválido

**Solução:** Obter token válido do Keycloak:

```bash
# Login no Keycloak para obter token
curl -X POST "https://sso.sandboxcometa.com.br/realms/GC/protocol/openid-connect/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "client_id=api-planos-saude" \
  -d "client_secret=ufKzWUUKQfLgtOaEySpaDYMW8YyCVyxo" \
  -d "grant_type=client_credentials"
```

## ✅ Validação de Sucesso

### Checklist de Testes

- [ ] Servidor NestJS iniciou sem erros
- [ ] JasperServer está acessível
- [ ] Endpoint `/relatorios/colaborador` retorna PDF válido
- [ ] PDF pode ser aberto sem erros
- [ ] Dados no PDF correspondem aos parâmetros enviados
- [ ] Filtro por CPF funciona (retorna apenas 1 colaborador)
- [ ] Relatório de empresa retorna todos colaboradores
- [ ] Relatório de pagamento filtra apenas exporta='S'
- [ ] Relatório de não-pagamento filtra apenas exporta='N'
- [ ] Resumo por depto agrupa corretamente
- [ ] Resumo por centro de custo totaliza corretamente

### Validação Visual dos PDFs

**Verificar:**

1. **Cabeçalho:** Nome da empresa, período de referência
2. **Dados:** CPF, nome, valores corretos
3. **Totalizações:** Somas conferem
4. **Formatação:** Layout profissional, sem quebras
5. **Filtros:** Dados respeitam filtros aplicados

## 📊 Comparação com Sistema Legado

Para validar equivalência, gerar mesmo relatório no sistema legado:

1. Acessar sistema PHP legado
2. Menu Unimed → Relatórios
3. Selecionar mesma empresa/período
4. Gerar PDF
5. Comparar visualmente com PDF da nova API

**Devem ser idênticos!** (mesmos templates JasperServer)

## 🔄 Teste de Integração Automatizado (Futuro)

Criar arquivo `relatorio.e2e-spec.ts`:

```typescript
import { Test } from '@nestjs/testing';
import { AppModule } from '../src/app.module';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';

describe('Relatórios (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  it('/relatorios/colaborador (GET) - deve retornar PDF', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/relatorios/colaborador')
      .query({
        codEmpresa: 1,
        codColigada: 1,
        codFilial: 1,
        mesRef: '01',
        anoRef: 2025,
        codBand: 1,
      })
      .expect(200)
      .expect('Content-Type', /application\/pdf/);

    expect(response.body).toBeDefined();
    expect(response.body.length).toBeGreaterThan(0);
  });
});
```

## 📈 Monitoramento em Produção

Após deploy, monitorar:

- **Tempo de resposta:** < 10s para relatórios simples
- **Taxa de erro:** < 1%
- **Logs:** Verificar erros de conexão com JasperServer
- **Uso de memória:** PDFs grandes podem consumir muita RAM

---

**Pronto para testar!** Comece com os testes rápidos e depois execute o script PowerShell completo.
