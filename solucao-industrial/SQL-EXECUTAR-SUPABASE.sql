-- =====================================================
-- PASSO 1: CRIAR TABELAS DE PRODUTOS QUÍMICOS
-- =====================================================
-- Copie e execute este bloco primeiro no SQL Editor do Supabase

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

-- Triggers
CREATE TRIGGER update_chemical_products_updated_at BEFORE UPDATE ON chemical_products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_chemical_launches_updated_at BEFORE UPDATE ON chemical_product_launches
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security
ALTER TABLE chemical_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE chemical_product_launches ENABLE ROW LEVEL SECURITY;

-- Policies para chemical_products
CREATE POLICY "Users can view chemical products in their company"
  ON chemical_products FOR SELECT
  USING (
    company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Admins and Gestores can manage chemical products"
  ON chemical_products FOR ALL
  USING (
    company_id IN (
      SELECT company_id FROM profiles
      WHERE id = auth.uid() AND role IN ('ADMIN', 'GESTOR')
    )
  );

-- Policies para chemical_product_launches
CREATE POLICY "Users can view chemical launches in their company"
  ON chemical_product_launches FOR SELECT
  USING (
    company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Authorized users can create chemical launches"
  ON chemical_product_launches FOR INSERT
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM profiles
      WHERE id = auth.uid() AND role IN ('ADMIN', 'GESTOR', 'OPERADOR')
    )
  );

CREATE POLICY "Authorized users can update/delete chemical launches"
  ON chemical_product_launches FOR ALL
  USING (
    company_id IN (
      SELECT company_id FROM profiles
      WHERE id = auth.uid() AND role IN ('ADMIN', 'GESTOR', 'OPERADOR')
    )
  );


-- =====================================================
-- PASSO 2: INSERIR PRODUTOS QUÍMICOS PADRÃO
-- =====================================================
-- Após executar o PASSO 1 com sucesso, execute este bloco:

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


-- =====================================================
-- VERIFICAÇÃO (OPCIONAL)
-- =====================================================
-- Execute este comando para verificar se os produtos foram inseridos:

SELECT
  cp.name as produto,
  cp.unit_price as preco,
  cp.unit as unidade,
  c.name as empresa
FROM chemical_products cp
JOIN companies c ON c.id = cp.company_id
ORDER BY c.name, cp.name;
