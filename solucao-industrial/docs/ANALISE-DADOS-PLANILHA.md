# Análise dos Dados da Planilha Modelo.xlsx

## Resumo da Extração

Foi realizada a extração dos dados da planilha `Modelo.xlsx`, que contém informações sobre produtos químicos utilizados em diferentes linhas de produção de galvanoplastia e verniz.

### Estatísticas Gerais

- **Total de produtos químicos extraídos:** 85 produtos
- **Total de linhas de produção:** 14 linhas

### Distribuição por Linha de Produção

| Linha de Produção | Quantidade de Produtos |
|-------------------|------------------------|
| Pré Tratamento | 7 produtos |
| Cobre Alcalino | 7 produtos |
| Níquel Strik | 5 produtos |
| Cobre Ácido | 8 produtos |
| Desengraxante Químico | 1 produto |
| Níquel Brilhante | 8 produtos |
| Níquel Strik (2) | 5 produtos |
| Cromo | 4 produtos |
| Pré Tratamento Verniz | 2 produtos |
| Verniz Cataforético | 26 produtos |
| Verniz Imersão | 2 produtos |
| Desplacante | 0 produtos |
| Desplacante de gancheira | 4 produtos |
| E.T.E | 6 produtos |

## Estrutura dos Dados Extraídos

Cada produto químico contém as seguintes informações:

```json
{
  "nome": "Nome do produto",
  "id": "ID do produto (pode ser null)",
  "volumeTanque": "Volume do tanque em litros",
  "concentracao": "Concentração do produto",
  "consumoMarco": "Consumo em Kg/lt no mês de março",
  "custoMarco": "Custo unitário por Kg no mês de março",
  "custoTotalMarco": "Custo total no mês de março"
}
```

## Exemplos de Produtos por Linha

### Pré Tratamento
- **SODA** - ID: 5643, Volume: 3000 lts, Custo Total (Mar): R$ 645,00
- **METAL CLEAN FE-05** - ID: 65073, Volume: 600 lts, Custo Total (Mar): R$ 2.031,75

### Cobre Alcalino
- **Anodo de Cobre** - ID: 56574, Volume: 2500 lts, Custo Total (Mar): R$ 669,80
- **ENVIROCOPPER MAKE-UP** - Custo Total (Mar): R$ 3.266,40

### Níquel Strik
- **Ânodo de Níquel** - ID: 56944, Volume: 3500 lts, Custo Total (Mar): R$ 5.676,00
- **SULFATO DE NÍQUEL SOLUÇÃO 60%** - ID: 100490, Custo Total (Mar): R$ 1.755,00

### Cromo
- **Ânodo Chumbo** - ID: 56574, Custo Total (Mar): R$ 24.196,50 (produto mais caro)
- **COMPOSTO CRMC** - Custo Total (Mar): R$ 5.082,75

## Mapeamento para o Banco de Dados

### Estrutura Atual no Projeto

O projeto já possui as seguintes tabelas e interfaces:

#### 1. `production_lines` (Linhas de Produção)
```typescript
interface ProductionLine {
  id: string;
  company_id: string;
  name: string;
  description?: string;
  line_type: 'GALVANOPLASTIA' | 'VERNIZ';
  active: boolean;
  created_at: string;
  updated_at: string;
}
```

#### 2. `chemical_products` (Produtos Químicos)
```typescript
interface ChemicalProduct {
  id: string;
  company_id: string;
  production_line_id?: string;
  name: string;
  unit_price: number;
  unit: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}
```

#### 3. `chemical_product_launches` (Lançamentos de Produtos Químicos)
```typescript
interface ChemicalProductLaunch {
  id: string;
  company_id: string;
  chemical_product_id: string;
  production_line_id?: string;
  mes: number;
  ano: number;
  quantidade: number;
  consumo: number;
  custo_unitario: number;
  custo_total: number;
  observacao?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}
```

## Plano de Importação

### Etapa 1: Criar/Identificar Linhas de Produção

Mapear as 14 linhas da planilha para a tabela `production_lines`:

| Linha da Planilha | Nome no Sistema | Tipo |
|-------------------|-----------------|------|
| Pré Tratamento | Pré Tratamento | GALVANOPLASTIA |
| Cobre Alcalino | Cobre Alcalino | GALVANOPLASTIA |
| Níquel Strik | Níquel Strik | GALVANOPLASTIA |
| Cobre Ácido | Cobre Ácido | GALVANOPLASTIA |
| Desengraxante Químico | Desengraxante Químico | GALVANOPLASTIA |
| Níquel Brilhante | Níquel Brilhante | GALVANOPLASTIA |
| Níquel Strik (2) | Níquel Strik 2 | GALVANOPLASTIA |
| Cromo | Cromo | GALVANOPLASTIA |
| Pré Tratamento Verniz | Pré Tratamento Verniz | VERNIZ |
| Verniz Cataforético | Verniz Cataforético | VERNIZ |
| Verniz Imersão | Verniz Imersão | VERNIZ |
| Desplacante | Desplacante | GALVANOPLASTIA |
| Desplacante de gancheira | Desplacante de Gancheira | GALVANOPLASTIA |
| E.T.E | Estação de Tratamento de Efluentes | GALVANOPLASTIA |

### Etapa 2: Importar Produtos Químicos

Para cada produto, criar registro em `chemical_products`:
- `name`: nome do produto (limpar espaços extras)
- `unit_price`: custoMarco
- `unit`: "Kg" ou "L" (definir padrão)
- `production_line_id`: ID da linha correspondente
- `active`: true

### Etapa 3: Importar Lançamentos de Março/2024

Para cada produto com dados de março, criar registro em `chemical_product_launches`:
- `mes`: 3 (março)
- `ano`: 2024 (ou ano atual)
- `quantidade`: volumeTanque
- `consumo`: consumoMarco
- `custo_unitario`: custoMarco
- `custo_total`: custoTotalMarco

## Observações Importantes

1. **IDs na Planilha**: Alguns produtos têm IDs numéricos na planilha. Esses IDs podem ser armazenados em um campo adicional ou usados como referência externa.

2. **Produtos sem ID**: Muitos produtos não possuem ID na planilha (valor null). Estes receberão UUIDs gerados pelo sistema.

3. **Volumes Zero**: Alguns produtos têm volume de tanque = 0, o que pode indicar produtos que não estão em uso ou que são adicionados diretamente.

4. **Custos Significativos**: O produto mais caro é o "Ânodo Chumbo" (Cromo) com custo de R$ 24.196,50 em março.

5. **Linha Verniz Cataforético**: Esta é a linha com maior número de produtos (26), indicando um processo complexo.

## Próximos Passos

1. ✅ Extrair dados da planilha Excel
2. ✅ Analisar estrutura e mapear para banco de dados
3. ⏳ Criar script de importação para Supabase
4. ⏳ Validar dados importados
5. ⏳ Criar interface para gerenciar produtos químicos importados

## Arquivo de Dados

Os dados extraídos estão salvos em:
```
data/produtos-quimicos-extraidos.json
```

Este arquivo pode ser usado pelo script de importação.
