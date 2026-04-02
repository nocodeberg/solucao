# Guia de Importação de Produtos Químicos

Este guia descreve o processo completo para importar os dados da planilha `Modelo.xlsx` para o sistema Solução Industrial.

## Pré-requisitos

1. **Node.js** instalado (versão 18 ou superior)
2. **Acesso ao Supabase** com credenciais configuradas
3. **Arquivo Modelo.xlsx** localizado em: `C:\Users\bergn\OneDrive\Documentos\projetos\Clayton Malta\Modelo.xlsx`

## Configuração Inicial

### 1. Instalar Dependências

```bash
npm install
```

Certifique-se de que a biblioteca `xlsx` está instalada:

```bash
npm install xlsx
```

### 2. Configurar Variáveis de Ambiente

Crie ou edite o arquivo `.env.local` na raiz do projeto com as seguintes variáveis:

```env
NEXT_PUBLIC_SUPABASE_URL=sua_url_do_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_anonima
SUPABASE_SERVICE_ROLE_KEY=sua_chave_de_servico
```

⚠️ **IMPORTANTE**: A `SUPABASE_SERVICE_ROLE_KEY` é necessária para os scripts de importação.

## Processo de Importação

### Passo 1: Extrair Dados da Planilha

Execute o script de extração para ler os dados do arquivo Excel:

```bash
node scripts/extract-product-data.js
```

**O que este script faz:**
- Lê o arquivo `Modelo.xlsx`
- Extrai dados de 14 planilhas de produtos químicos
- Salva os dados em formato JSON em `data/produtos-quimicos-extraidos.json`
- Exibe estatísticas sobre os dados extraídos

**Resultado esperado:**
```
✅ Dados extraídos com sucesso!
📁 Arquivo salvo em: data/produtos-quimicos-extraidos.json

=== RESUMO GERAL ===
  TOTAL: 85 produtos químicos
```

### Passo 2: Obter o ID da Empresa

Para importar os dados, você precisa do ID da empresa no sistema:

```bash
node scripts/get-company-id.js
```

**O que este script faz:**
- Lista todas as empresas cadastradas no Supabase
- Exibe ID, nome, CNPJ e status de cada empresa

**Resultado esperado:**
```
=== EMPRESAS CADASTRADAS ===

1. Solução Industrial Galvanoplastia
   ID: 123e4567-e89b-12d3-a456-426614174000
   CNPJ: 12.345.678/0001-90
   Status: Ativa
```

**Copie o ID da empresa** que você deseja importar os dados.

### Passo 3: Executar a Importação

Execute o script de importação passando o ID da empresa:

```bash
node scripts/import-chemical-products.js 123e4567-e89b-12d3-a456-426614174000
```

Substitua `123e4567-e89b-12d3-a456-426614174000` pelo ID real da sua empresa.

**O que este script faz:**

1. **Cria ou identifica linhas de produção** (14 linhas):
   - Pré Tratamento, Cobre Alcalino, Níquel Strik, etc.
   - Classifica cada linha como GALVANOPLASTIA ou VERNIZ

2. **Importa produtos químicos** (85 produtos):
   - Cria registro em `chemical_products`
   - Vincula cada produto à sua linha de produção
   - Define preço unitário e unidade de medida

3. **Cria lançamentos de março/2024**:
   - Registra consumo e custos do mês de março
   - Armazena em `chemical_product_launches`

**Resultado esperado:**
```
=== RESUMO DA IMPORTAÇÃO ===

✓ Linhas criadas: 14
✓ Produtos criados: 85
✓ Lançamentos criados: 78

✅ Importação concluída sem erros!
```

## Estrutura dos Dados Importados

### Linhas de Produção Criadas

| Nome | Tipo | Produtos |
|------|------|----------|
| Pré Tratamento | GALVANOPLASTIA | 7 |
| Cobre Alcalino | GALVANOPLASTIA | 7 |
| Níquel Strik | GALVANOPLASTIA | 5 |
| Cobre Ácido | GALVANOPLASTIA | 8 |
| Desengraxante Químico | GALVANOPLASTIA | 1 |
| Níquel Brilhante | GALVANOPLASTIA | 8 |
| Níquel Strik 2 | GALVANOPLASTIA | 5 |
| Cromo | GALVANOPLASTIA | 4 |
| Pré Tratamento Verniz | VERNIZ | 2 |
| Verniz Cataforético | VERNIZ | 26 |
| Verniz Imersão | VERNIZ | 2 |
| Desplacante | GALVANOPLASTIA | 0 |
| Desplacante de Gancheira | GALVANOPLASTIA | 4 |
| E.T.E | GALVANOPLASTIA | 6 |

### Exemplo de Produto Importado

**Produto:**
```json
{
  "name": "SODA",
  "unit_price": 5.16,
  "unit": "Kg",
  "production_line_id": "...",
  "active": true
}
```

**Lançamento de Março:**
```json
{
  "mes": 3,
  "ano": 2024,
  "quantidade": 3000,
  "consumo": 125,
  "custo_unitario": 5.16,
  "custo_total": 645,
  "observacao": "Importado da planilha Modelo.xlsx"
}
```

## Verificação dos Dados

Após a importação, você pode verificar os dados no sistema:

1. **Acesse o sistema** no navegador
2. **Navegue até "Produtos Químicos"**
3. **Verifique as linhas de produção** criadas
4. **Confira os produtos** importados em cada linha
5. **Revise os lançamentos** do mês de março

## Executar Nova Importação

Se você precisar executar a importação novamente:

⚠️ **IMPORTANTE**: O script é idempotente, ou seja:
- Linhas existentes **não serão duplicadas**
- Produtos existentes **serão identificados e pulados**
- Apenas dados novos serão inseridos

Para reimportar **todos os dados**, você precisará:
1. Limpar as tabelas no Supabase
2. Executar o script novamente

## Solução de Problemas

### Erro: Variáveis de ambiente não configuradas

```
❌ Erro: Variáveis de ambiente NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY não configuradas
```

**Solução:**
1. Verifique se o arquivo `.env.local` existe
2. Confirme que as variáveis estão configuradas corretamente
3. Reinicie o terminal e execute o script novamente

### Erro: Arquivo de dados não encontrado

```
❌ Erro: Arquivo de dados não encontrado
```

**Solução:**
Execute primeiro o script de extração:
```bash
node scripts/extract-product-data.js
```

### Erro: Company ID não fornecido

```
❌ Erro: Company ID não fornecido
```

**Solução:**
1. Execute `node scripts/get-company-id.js` para obter o ID
2. Execute o script de importação com o ID correto

### Erro de permissão no Supabase

```
❌ Erro ao processar linha: permission denied for table production_lines
```

**Solução:**
1. Verifique se a `SUPABASE_SERVICE_ROLE_KEY` está correta
2. Confirme que o usuário tem permissões de admin no Supabase
3. Verifique as políticas RLS (Row Level Security) das tabelas

## Scripts Disponíveis

| Script | Descrição |
|--------|-----------|
| `read-excel-model.js` | Visualiza estrutura da planilha Excel |
| `extract-product-data.js` | Extrai dados e salva em JSON |
| `get-company-id.js` | Lista empresas cadastradas |
| `import-chemical-products.js` | Importa produtos para o banco |

## Arquivos Gerados

```
solucao-industrial/
├── data/
│   └── produtos-quimicos-extraidos.json    # Dados extraídos da planilha
├── docs/
│   ├── ANALISE-DADOS-PLANILHA.md          # Análise detalhada dos dados
│   └── GUIA-IMPORTACAO-PRODUTOS.md        # Este guia
└── scripts/
    ├── read-excel-model.js                # Script de leitura
    ├── extract-product-data.js            # Script de extração
    ├── get-company-id.js                  # Script auxiliar
    └── import-chemical-products.js        # Script de importação
```

## Suporte

Para dúvidas ou problemas:
1. Verifique a documentação no diretório `docs/`
2. Consulte os logs de erro gerados pelos scripts
3. Entre em contato com o time de desenvolvimento
