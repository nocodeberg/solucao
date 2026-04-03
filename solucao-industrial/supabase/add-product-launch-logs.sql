-- =====================================================
-- LOGS DE LANÇAMENTO DE PRODUTOS (MOVIMENTAÇÃO)
-- =====================================================

-- Tabela de logs: cada lançamento gera um registro
CREATE TABLE IF NOT EXISTS product_launch_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  production_line_id UUID REFERENCES production_lines(id) ON DELETE SET NULL,
  mes INTEGER NOT NULL CHECK (mes >= 1 AND mes <= 12),
  ano INTEGER NOT NULL CHECK (ano >= 2020 AND ano <= 2100),
  tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('ENTRADA', 'SAIDA', 'AJUSTE')),
  quantidade DECIMAL(10, 3) NOT NULL DEFAULT 0,
  custo_unitario DECIMAL(10, 2) NOT NULL DEFAULT 0,
  custo_total DECIMAL(10, 2) NOT NULL DEFAULT 0,
  observacao TEXT,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
DROP INDEX IF EXISTS idx_launch_logs_company;
CREATE INDEX idx_launch_logs_company ON product_launch_logs(company_id);

DROP INDEX IF EXISTS idx_launch_logs_product;
CREATE INDEX idx_launch_logs_product ON product_launch_logs(product_id);

DROP INDEX IF EXISTS idx_launch_logs_line;
CREATE INDEX idx_launch_logs_line ON product_launch_logs(production_line_id);

DROP INDEX IF EXISTS idx_launch_logs_date;
CREATE INDEX idx_launch_logs_date ON product_launch_logs(mes, ano);

DROP INDEX IF EXISTS idx_launch_logs_created;
CREATE INDEX idx_launch_logs_created ON product_launch_logs(created_at);

-- Row Level Security
ALTER TABLE product_launch_logs ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "Users can view launch logs in their company" ON product_launch_logs;
CREATE POLICY "Users can view launch logs in their company"
  ON product_launch_logs FOR SELECT
  USING (
    company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Authorized users can create launch logs" ON product_launch_logs;
CREATE POLICY "Authorized users can create launch logs"
  ON product_launch_logs FOR INSERT
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM profiles
      WHERE id = auth.uid() AND role IN ('ADMIN', 'GESTOR', 'OPERADOR')
    )
  );

DROP POLICY IF EXISTS "Authorized users can manage launch logs" ON product_launch_logs;
CREATE POLICY "Authorized users can manage launch logs"
  ON product_launch_logs FOR ALL
  USING (
    company_id IN (
      SELECT company_id FROM profiles
      WHERE id = auth.uid() AND role IN ('ADMIN', 'GESTOR')
    )
  );

-- Adicionar coluna consumo_acumulado na product_launches se não existir
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'product_launches' AND column_name = 'consumo_acumulado'
  ) THEN
    ALTER TABLE product_launches ADD COLUMN consumo_acumulado DECIMAL(10, 3) DEFAULT 0;
  END IF;
END $$;

SELECT 'Tabela product_launch_logs criada e product_launches atualizada com sucesso!' as status;
