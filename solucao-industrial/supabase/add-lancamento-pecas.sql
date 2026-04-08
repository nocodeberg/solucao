-- =====================================================
-- MIGRATION: Lançamento de Produção por Peça
-- Registra quantidade produzida por peça/mês/ano
-- =====================================================

CREATE TABLE IF NOT EXISTS lancamento_pecas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  piece_id INTEGER REFERENCES pieces(id) ON DELETE CASCADE,
  mes INTEGER NOT NULL CHECK (mes >= 1 AND mes <= 12),
  ano INTEGER NOT NULL CHECK (ano >= 2020 AND ano <= 2100),
  quantidade INTEGER NOT NULL DEFAULT 0,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(company_id, piece_id, mes, ano)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_lancamento_pecas_company ON lancamento_pecas(company_id);
CREATE INDEX IF NOT EXISTS idx_lancamento_pecas_piece ON lancamento_pecas(piece_id);
CREATE INDEX IF NOT EXISTS idx_lancamento_pecas_date ON lancamento_pecas(mes, ano);

-- Trigger updated_at
DROP TRIGGER IF EXISTS update_lancamento_pecas_updated_at ON lancamento_pecas;
CREATE TRIGGER update_lancamento_pecas_updated_at BEFORE UPDATE ON lancamento_pecas
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS
ALTER TABLE lancamento_pecas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view lancamento_pecas in their company" ON lancamento_pecas;
CREATE POLICY "Users can view lancamento_pecas in their company"
  ON lancamento_pecas FOR SELECT
  USING (company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Authorized users can manage lancamento_pecas" ON lancamento_pecas;
CREATE POLICY "Authorized users can manage lancamento_pecas"
  ON lancamento_pecas FOR ALL
  USING (company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid() AND role IN ('ADMIN', 'GESTOR', 'OPERADOR')));

SELECT 'Tabela lancamento_pecas criada com sucesso!' as status;
