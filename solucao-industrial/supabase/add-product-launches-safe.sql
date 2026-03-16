-- =====================================================
-- LANÇAMENTOS DE PRODUTOS DE MATÉRIA-PRIMA (SAFE VERSION)
-- =====================================================

-- Tabela de Lançamentos de Produtos (matéria-prima)
CREATE TABLE IF NOT EXISTS product_launches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
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
  UNIQUE(product_id, mes, ano, production_line_id)
);

-- Índices (DROP IF EXISTS para evitar erro)
DROP INDEX IF EXISTS idx_product_launches_company;
CREATE INDEX idx_product_launches_company ON product_launches(company_id);

DROP INDEX IF EXISTS idx_product_launches_product;
CREATE INDEX idx_product_launches_product ON product_launches(product_id);

DROP INDEX IF EXISTS idx_product_launches_line;
CREATE INDEX idx_product_launches_line ON product_launches(production_line_id);

DROP INDEX IF EXISTS idx_product_launches_date;
CREATE INDEX idx_product_launches_date ON product_launches(mes, ano);

-- Trigger para atualizar updated_at
DROP TRIGGER IF EXISTS update_product_launches_updated_at ON product_launches;
CREATE TRIGGER update_product_launches_updated_at BEFORE UPDATE ON product_launches
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security
ALTER TABLE product_launches ENABLE ROW LEVEL SECURITY;

-- Políticas (DROP IF EXISTS para evitar erro)
DROP POLICY IF EXISTS "Users can view product launches in their company" ON product_launches;
CREATE POLICY "Users can view product launches in their company"
  ON product_launches FOR SELECT
  USING (
    company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Authorized users can create product launches" ON product_launches;
CREATE POLICY "Authorized users can create product launches"
  ON product_launches FOR INSERT
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM profiles
      WHERE id = auth.uid() AND role IN ('ADMIN', 'GESTOR', 'OPERADOR')
    )
  );

DROP POLICY IF EXISTS "Authorized users can update/delete product launches" ON product_launches;
CREATE POLICY "Authorized users can update/delete product launches"
  ON product_launches FOR ALL
  USING (
    company_id IN (
      SELECT company_id FROM profiles
      WHERE id = auth.uid() AND role IN ('ADMIN', 'GESTOR', 'OPERADOR')
    )
  );

-- Verificar se foi criado com sucesso
SELECT 'Tabela product_launches criada/atualizada com sucesso!' as status;
