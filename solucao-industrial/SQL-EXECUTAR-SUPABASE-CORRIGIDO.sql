-- =====================================================
-- PASSO 1: CRIAR TABELAS DE PRODUTOS QUÍMICOS (SEGURO)
-- =====================================================
-- Este SQL pode ser executado múltiplas vezes sem erro

-- Remover triggers existentes se houver
DROP TRIGGER IF EXISTS update_chemical_products_updated_at ON chemical_products;
DROP TRIGGER IF EXISTS update_chemical_launches_updated_at ON chemical_product_launches;

-- Tabela de Produtos Químicos
CREATE TABLE IF NOT EXISTS chemical_products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  production_line_id UUID REFERENCES production_lines(id) ON DELETE SET NULL,
  name VARCHAR(255) NOT NULL,
  unit_price DECIMAL(10, 2) NOT NULL DEFAULT 0,
  unit VARCHAR(20) DEFAULT 'kg',
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Lançamentos de Produtos Químicos
CREATE TABLE IF NOT EXISTS chemical_product_launches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  chemical_product_id UUID REFERENCES chemical_products(id) ON DELETE CASCADE,
  production_line_id UUID REFERENCES production_lines(id) ON DELETE SET NULL,
  mes INTEGER NOT NULL CHECK (mes >= 1 AND mes <= 12),
  ano INTEGER NOT NULL CHECK (ano >= 2020 AND ano <= 2100),
  quantidade DECIMAL(10, 3) NOT NULL DEFAULT 0,
  consumo DECIMAL(10, 3) DEFAULT 0,
  custo_unitario DECIMAL(10, 2) NOT NULL DEFAULT 0,
  custo_total DECIMAL(10, 2) NOT NULL DEFAULT 0,
  observacao TEXT,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(chemical_product_id, mes, ano, production_line_id)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_chemical_products_company ON chemical_products(company_id);
CREATE INDEX IF NOT EXISTS idx_chemical_products_line ON chemical_products(production_line_id);
CREATE INDEX IF NOT EXISTS idx_chemical_launches_company ON chemical_product_launches(company_id);
CREATE INDEX IF NOT EXISTS idx_chemical_launches_product ON chemical_product_launches(chemical_product_id);
CREATE INDEX IF NOT EXISTS idx_chemical_launches_date ON chemical_product_launches(mes, ano);

-- Triggers (recriados)
CREATE TRIGGER update_chemical_products_updated_at
  BEFORE UPDATE ON chemical_products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_chemical_launches_updated_at
  BEFORE UPDATE ON chemical_product_launches
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- PASSO 2: VERIFICAR DADOS EXISTENTES
-- =====================================================
-- Execute para ver suas companies e linhas

SELECT
  c.id as company_id,
  c.name as company_name,
  pl.id as line_id,
  pl.name as line_name
FROM companies c
LEFT JOIN production_lines pl ON pl.company_id = c.id
ORDER BY c.name, pl.name;

-- =====================================================
-- PASSO 3: INSERIR PRODUTOS QUÍMICOS DE EXEMPLO
-- =====================================================
-- IMPORTANTE: Substitua 'SEU_COMPANY_ID' e 'SEU_LINE_ID'
-- pelos valores reais que você pegou no PASSO 2

-- Exemplo de como inserir produtos:
/*
INSERT INTO chemical_products (company_id, production_line_id, name, unit_price, unit, active)
VALUES
  ('SEU_COMPANY_ID', 'SEU_LINE_ID', 'SODA', 10.00, 'kg', true),
  ('SEU_COMPANY_ID', 'SEU_LINE_ID', 'ACTIVE ZMC', 10.00, 'kg', true),
  ('SEU_COMPANY_ID', 'SEU_LINE_ID', 'COMPOSTO C-10', 10.00, 'kg', true),
  ('SEU_COMPANY_ID', 'SEU_LINE_ID', 'METAL CLEAN FE 05', 10.00, 'kg', true),
  ('SEU_COMPANY_ID', 'SEU_LINE_ID', 'METAL CLEAN 7E_F', 10.00, 'kg', true),
  ('SEU_COMPANY_ID', 'SEU_LINE_ID', 'ÁCIDO SULFÚRICO', 15.00, 'kg', true),
  ('SEU_COMPANY_ID', 'SEU_LINE_ID', 'ANODO DE COBRE', 50.00, 'kg', true),
  ('SEU_COMPANY_ID', 'SEU_LINE_ID', 'SULFATO DE COBRE', 75.00, 'kg', true);
*/

-- =====================================================
-- PASSO 4: VERIFICAR PRODUTOS CRIADOS
-- =====================================================
-- Execute para ver os produtos químicos cadastrados

SELECT
  cp.name,
  cp.unit_price,
  cp.unit,
  cp.active,
  pl.name as linha,
  c.name as empresa
FROM chemical_products cp
JOIN production_lines pl ON cp.production_line_id = pl.id
JOIN companies c ON cp.company_id = c.id
ORDER BY pl.name, cp.name;
