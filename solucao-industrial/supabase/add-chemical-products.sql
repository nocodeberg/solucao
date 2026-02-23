-- =====================================================
-- PRODUTOS QUÍMICOS E LANÇAMENTOS DE PRÉ-TRATAMENTO
-- =====================================================

-- Tabela de Produtos Químicos
CREATE TABLE IF NOT EXISTS chemical_products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  production_line_id UUID REFERENCES production_lines(id) ON DELETE SET NULL,
  name VARCHAR(255) NOT NULL,
  unit_price DECIMAL(10, 2) NOT NULL DEFAULT 0, -- Custo/kg
  unit VARCHAR(20) DEFAULT 'kg', -- unidade de medida (kg, L, etc)
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
  quantidade DECIMAL(10, 3) NOT NULL DEFAULT 0, -- Lançamento (quantidade)
  consumo DECIMAL(10, 3) DEFAULT 0, -- Consumo
  custo_unitario DECIMAL(10, 2) NOT NULL DEFAULT 0, -- Custo/kg
  custo_total DECIMAL(10, 2) NOT NULL DEFAULT 0, -- Custo Total calculado
  observacao TEXT,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(chemical_product_id, mes, ano, production_line_id)
);

-- Índices
CREATE INDEX idx_chemical_products_company ON chemical_products(company_id);
CREATE INDEX idx_chemical_products_line ON chemical_products(production_line_id);
CREATE INDEX idx_chemical_launches_company ON chemical_product_launches(company_id);
CREATE INDEX idx_chemical_launches_product ON chemical_product_launches(chemical_product_id);
CREATE INDEX idx_chemical_launches_date ON chemical_product_launches(mes, ano);

-- Trigger para atualizar updated_at
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
