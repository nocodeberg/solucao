# Setup do Módulo de Lançamento de Pré-Tratamento

## Passos para configuração:

### 1. Executar SQL no Supabase

Acesse o **SQL Editor** do Supabase e execute o arquivo:
```
supabase/add-chemical-products.sql
```

Este SQL criará:
- Tabela `chemical_products` (produtos químicos)
- Tabela `chemical_product_launches` (lançamentos de produtos)
- Índices e políticas de segurança (RLS)

### 2. Inserir produtos químicos de exemplo

Após executar o SQL acima, execute este comando no **SQL Editor** para inserir os produtos padrão:

```sql
-- Inserir produtos químicos padrão para todas as empresas
INSERT INTO chemical_products (company_id, name, unit_price, unit, active)
SELECT
  c.id as company_id,
  p.name,
  p.unit_price,
  p.unit,
  true as active
FROM companies c
CROSS JOIN (
  VALUES
    ('SODA', 10.00, 'kg'),
    ('ACTIVE ZMC', 10.00, 'kg'),
    ('COMPOSTO C-10', 10.00, 'kg'),
    ('METAL CLEAN FE 05', 10.00, 'kg'),
    ('METAL CLEAN 7E_F', 10.00, 'kg')
) AS p(name, unit_price, unit)
ON CONFLICT DO NOTHING;
```

### 3. Verificar a instalação

Acesse a aplicação e clique em:
**Gestão Áreas > Lançamento**

Você deverá ver:
- Lista de produtos químicos cadastrados
- Botão "Novo Lançamento" que abre o modal com:
  - Seletor de meses (Jan/2026, Fev/2026, etc)
  - Tabela com os produtos e campos para lançamento

## Funcionalidades implementadas:

✅ Estrutura de banco de dados para produtos químicos
✅ Item "Lançamento" na Sidebar (Gestão Áreas)
✅ Página de lançamento de pré-tratamento
✅ Modal com seletor de meses e tabela de produtos
✅ Lógica de salvamento dos lançamentos
✅ Cálculo automático do custo total (quantidade × custo/kg)

## Próximos passos (opcionais):

- [ ] Adicionar funcionalidade de edição de produtos químicos
- [ ] Adicionar funcionalidade de exclusão de produtos
- [ ] Implementar histórico de lançamentos por mês
- [ ] Adicionar relatórios de consumo
- [ ] Vincular produtos a linhas de produção específicas
