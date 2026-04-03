-- =====================================================
-- MIGRATION: Custos Variáveis (Energia, Telefone)
-- =====================================================

CREATE TABLE IF NOT EXISTS custos_variaveis (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  categoria VARCHAR(50) NOT NULL, -- 'ENERGIA', 'TELEFONE'
  descricao TEXT NOT NULL,
  valor DECIMAL(10, 2) NOT NULL DEFAULT 0,
  data DATE NOT NULL,
  observacao TEXT,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
DROP INDEX IF EXISTS idx_custos_variaveis_company;
CREATE INDEX idx_custos_variaveis_company ON custos_variaveis(company_id);

DROP INDEX IF EXISTS idx_custos_variaveis_date;
CREATE INDEX idx_custos_variaveis_date ON custos_variaveis(data);

DROP INDEX IF EXISTS idx_custos_variaveis_categoria;
CREATE INDEX idx_custos_variaveis_categoria ON custos_variaveis(categoria);

-- Trigger updated_at
DROP TRIGGER IF EXISTS update_custos_variaveis_updated_at ON custos_variaveis;
CREATE TRIGGER update_custos_variaveis_updated_at BEFORE UPDATE ON custos_variaveis
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS
ALTER TABLE custos_variaveis ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view custos_variaveis in their company" ON custos_variaveis;
CREATE POLICY "Users can view custos_variaveis in their company"
  ON custos_variaveis FOR SELECT
  USING (company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Authorized users can manage custos_variaveis" ON custos_variaveis;
CREATE POLICY "Authorized users can manage custos_variaveis"
  ON custos_variaveis FOR ALL
  USING (company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid() AND role IN ('ADMIN', 'GESTOR', 'OPERADOR')));

-- =====================================================
-- MIGRATION: Outros Custos
-- =====================================================

CREATE TABLE IF NOT EXISTS outros_custos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  categoria VARCHAR(100) NOT NULL, -- 'EPI', 'MANUT_CORRETIVA', 'VALE_REFEICAO', etc.
  descricao TEXT NOT NULL,
  valor DECIMAL(10, 2) NOT NULL DEFAULT 0,
  mes INTEGER NOT NULL CHECK (mes >= 1 AND mes <= 12),
  ano INTEGER NOT NULL CHECK (ano >= 2020 AND ano <= 2100),
  observacao TEXT,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

DROP INDEX IF EXISTS idx_outros_custos_company;
CREATE INDEX idx_outros_custos_company ON outros_custos(company_id);
DROP INDEX IF EXISTS idx_outros_custos_date;
CREATE INDEX idx_outros_custos_date ON outros_custos(mes, ano);

DROP TRIGGER IF EXISTS update_outros_custos_updated_at ON outros_custos;
CREATE TRIGGER update_outros_custos_updated_at BEFORE UPDATE ON outros_custos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE outros_custos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view outros_custos in their company" ON outros_custos;
CREATE POLICY "Users can view outros_custos in their company"
  ON outros_custos FOR SELECT
  USING (company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Authorized users can manage outros_custos" ON outros_custos;
CREATE POLICY "Authorized users can manage outros_custos"
  ON outros_custos FOR ALL
  USING (company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid() AND role IN ('ADMIN', 'GESTOR', 'OPERADOR')));

-- =====================================================
-- MIGRATION: Transporte
-- =====================================================

CREATE TABLE IF NOT EXISTS transporte (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  descricao TEXT NOT NULL,
  valor DECIMAL(10, 2) NOT NULL DEFAULT 0,
  mes INTEGER NOT NULL CHECK (mes >= 1 AND mes <= 12),
  ano INTEGER NOT NULL CHECK (ano >= 2020 AND ano <= 2100),
  observacao TEXT,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

DROP INDEX IF EXISTS idx_transporte_company;
CREATE INDEX idx_transporte_company ON transporte(company_id);
DROP INDEX IF EXISTS idx_transporte_date;
CREATE INDEX idx_transporte_date ON transporte(mes, ano);

DROP TRIGGER IF EXISTS update_transporte_updated_at ON transporte;
CREATE TRIGGER update_transporte_updated_at BEFORE UPDATE ON transporte
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE transporte ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view transporte in their company" ON transporte;
CREATE POLICY "Users can view transporte in their company"
  ON transporte FOR SELECT
  USING (company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Authorized users can manage transporte" ON transporte;
CREATE POLICY "Authorized users can manage transporte"
  ON transporte FOR ALL
  USING (company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid() AND role IN ('ADMIN', 'GESTOR', 'OPERADOR')));

-- =====================================================
-- MIGRATION: Investimentos (Depreciação)
-- =====================================================

CREATE TABLE IF NOT EXISTS investimentos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  production_line_id UUID REFERENCES production_lines(id) ON DELETE SET NULL,
  equipamento VARCHAR(255) NOT NULL,
  descricao TEXT,
  valor_investimento DECIMAL(12, 2) NOT NULL DEFAULT 0,
  depreciacao_meses INTEGER NOT NULL DEFAULT 12,
  data_aquisicao DATE NOT NULL,
  data_vencimento DATE,
  valor_mensal DECIMAL(12, 2) NOT NULL DEFAULT 0, -- calculado: valor / meses
  observacao TEXT,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

DROP INDEX IF EXISTS idx_investimentos_company;
CREATE INDEX idx_investimentos_company ON investimentos(company_id);
DROP INDEX IF EXISTS idx_investimentos_line;
CREATE INDEX idx_investimentos_line ON investimentos(production_line_id);

DROP TRIGGER IF EXISTS update_investimentos_updated_at ON investimentos;
CREATE TRIGGER update_investimentos_updated_at BEFORE UPDATE ON investimentos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE investimentos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view investimentos in their company" ON investimentos;
CREATE POLICY "Users can view investimentos in their company"
  ON investimentos FOR SELECT
  USING (company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Authorized users can manage investimentos" ON investimentos;
CREATE POLICY "Authorized users can manage investimentos"
  ON investimentos FOR ALL
  USING (company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid() AND role IN ('ADMIN', 'GESTOR')));

-- =====================================================
-- MIGRATION: Peças por Hora (Cálculos Eletroquímicos)
-- =====================================================

CREATE TABLE IF NOT EXISTS pecas_hora (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  production_line_id UUID REFERENCES production_lines(id) ON DELETE CASCADE,
  -- Dados da peça
  area_peca_dm2 DECIMAL(10, 4) NOT NULL DEFAULT 0,
  peso_peca_kg DECIMAL(10, 4) NOT NULL DEFAULT 0,
  kg_por_carga DECIMAL(10, 4) NOT NULL DEFAULT 0,
  -- Parâmetros eletroquímicos
  peso_especifico DECIMAL(10, 4) NOT NULL DEFAULT 7.1,
  equivalente_eletroquimico DECIMAL(10, 4) NOT NULL DEFAULT 1.2195,
  rendimento_corrente DECIMAL(10, 2) NOT NULL DEFAULT 90, -- %
  espessura_mm DECIMAL(10, 4) NOT NULL DEFAULT 4,
  amperagem DECIMAL(12, 4) NOT NULL DEFAULT 0,
  numero_tambores INTEGER NOT NULL DEFAULT 1,
  densidade_corrente DECIMAL(10, 4) NOT NULL DEFAULT 0.5,
  -- Resultados calculados
  pecas_por_carga DECIMAL(12, 4) NOT NULL DEFAULT 0,
  area_carga_dm2 DECIMAL(12, 4) NOT NULL DEFAULT 0,
  pecas_por_hora DECIMAL(12, 4) NOT NULL DEFAULT 0,
  kg_por_hora DECIMAL(12, 4) NOT NULL DEFAULT 0,
  tempo_banho_min DECIMAL(10, 4) NOT NULL DEFAULT 0,
  --
  observacao TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

DROP INDEX IF EXISTS idx_pecas_hora_company;
CREATE INDEX idx_pecas_hora_company ON pecas_hora(company_id);
DROP INDEX IF EXISTS idx_pecas_hora_line;
CREATE INDEX idx_pecas_hora_line ON pecas_hora(production_line_id);

DROP TRIGGER IF EXISTS update_pecas_hora_updated_at ON pecas_hora;
CREATE TRIGGER update_pecas_hora_updated_at BEFORE UPDATE ON pecas_hora
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE pecas_hora ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view pecas_hora in their company" ON pecas_hora;
CREATE POLICY "Users can view pecas_hora in their company"
  ON pecas_hora FOR SELECT
  USING (company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Authorized users can manage pecas_hora" ON pecas_hora;
CREATE POLICY "Authorized users can manage pecas_hora"
  ON pecas_hora FOR ALL
  USING (company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid() AND role IN ('ADMIN', 'GESTOR')));

SELECT 'Todas as tabelas criadas com sucesso!' as status;
