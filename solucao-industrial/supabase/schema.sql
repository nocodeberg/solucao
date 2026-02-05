-- =====================================================
-- SOLUÇÃO INDUSTRIAL - DATABASE SCHEMA
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- ENUMS
-- =====================================================

CREATE TYPE user_role AS ENUM ('ADMIN', 'GESTOR', 'RH', 'OPERADOR', 'LEITOR');
CREATE TYPE lancamento_tipo AS ENUM ('MOD', 'MOI');

-- =====================================================
-- COMPANIES (Multi-tenant)
-- =====================================================

CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  cnpj VARCHAR(18) UNIQUE NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(20),
  address JSONB,
  logo_url TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- USERS & AUTH
-- =====================================================

CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  role user_role NOT NULL DEFAULT 'LEITOR',
  full_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  avatar_url TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- PRODUCTION LINES (Linhas de Produção)
-- =====================================================

CREATE TABLE production_lines (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- PRODUCTS (Produtos/Matéria Prima por Linha)
-- =====================================================

CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  production_line_id UUID REFERENCES production_lines(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  price DECIMAL(10, 2) NOT NULL DEFAULT 0,
  published BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- GROUPS (Grupos de Acabamento)
-- =====================================================

CREATE TABLE groups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- PIECES (Peças)
-- =====================================================

CREATE TABLE pieces (
  id SERIAL PRIMARY KEY,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  group_id UUID REFERENCES groups(id) ON DELETE SET NULL,
  name VARCHAR(255) NOT NULL,
  area_dm2 DECIMAL(10, 2) DEFAULT 0,
  weight_kg DECIMAL(10, 3) DEFAULT 0,
  production_type VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- CARGOS (Cargos/Funções)
-- =====================================================

CREATE TABLE cargos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- EMPLOYEES (Funcionários)
-- =====================================================

CREATE TABLE employees (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  cargo_id UUID REFERENCES cargos(id) ON DELETE SET NULL,
  full_name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(20),
  cpf VARCHAR(14),
  salary DECIMAL(10, 2) NOT NULL DEFAULT 0,
  admission_date DATE,
  active BOOLEAN DEFAULT true,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- ENCARGOS (Encargos Trabalhistas)
-- =====================================================

CREATE TABLE encargos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  value DECIMAL(10, 2) NOT NULL DEFAULT 0,
  is_percentage BOOLEAN DEFAULT true,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default encargos
INSERT INTO encargos (company_id, name, value, is_percentage, description)
SELECT id, 'INSS', 10.00, true, 'Contribuição INSS' FROM companies
UNION ALL
SELECT id, 'FGTS', 8.00, true, 'Fundo de Garantia' FROM companies
UNION ALL
SELECT id, 'Férias', 12.00, true, 'Provisão de Férias (1/12)' FROM companies
UNION ALL
SELECT id, '1/3 Férias', 3.00, true, '1/3 sobre Férias' FROM companies
UNION ALL
SELECT id, '13º Salário', 12.00, true, '13º Salário (1/12)' FROM companies
UNION ALL
SELECT id, 'Insalubridade', 20.00, true, 'Adicional de Insalubridade' FROM companies;

-- =====================================================
-- MÃO DE OBRA LANCAMENTOS
-- =====================================================

CREATE TABLE lancamento_mo (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
  production_line_id UUID REFERENCES production_lines(id) ON DELETE CASCADE,
  tipo lancamento_tipo NOT NULL,
  mes INTEGER NOT NULL CHECK (mes >= 1 AND mes <= 12),
  ano INTEGER NOT NULL CHECK (ano >= 2020 AND ano <= 2100),
  data_lancamento DATE NOT NULL,
  horas_trabalhadas DECIMAL(10, 2),
  salario_base DECIMAL(10, 2) NOT NULL,
  custo_mensal DECIMAL(10, 2) NOT NULL,
  observacao TEXT,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- MANUTENÇÃO
-- =====================================================

CREATE TABLE manutencao (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  production_line_id UUID REFERENCES production_lines(id) ON DELETE SET NULL,
  descricao TEXT NOT NULL,
  valor DECIMAL(10, 2) NOT NULL DEFAULT 0,
  data DATE NOT NULL,
  observacao TEXT,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- CONSUMO DE ÁGUA
-- =====================================================

CREATE TABLE consumo_agua (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  descricao TEXT NOT NULL,
  valor DECIMAL(10, 2) NOT NULL DEFAULT 0,
  data DATE NOT NULL,
  observacao TEXT,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- INDEXES
-- =====================================================

CREATE INDEX idx_profiles_company ON profiles(company_id);
CREATE INDEX idx_production_lines_company ON production_lines(company_id);
CREATE INDEX idx_products_company ON products(company_id);
CREATE INDEX idx_products_line ON products(production_line_id);
CREATE INDEX idx_groups_company ON groups(company_id);
CREATE INDEX idx_pieces_company ON pieces(company_id);
CREATE INDEX idx_employees_company ON employees(company_id);
CREATE INDEX idx_lancamento_mo_company ON lancamento_mo(company_id);
CREATE INDEX idx_lancamento_mo_employee ON lancamento_mo(employee_id);
CREATE INDEX idx_lancamento_mo_date ON lancamento_mo(mes, ano);
CREATE INDEX idx_manutencao_company ON manutencao(company_id);
CREATE INDEX idx_manutencao_date ON manutencao(data);
CREATE INDEX idx_consumo_agua_company ON consumo_agua(company_id);
CREATE INDEX idx_consumo_agua_date ON consumo_agua(data);

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE production_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE pieces ENABLE ROW LEVEL SECURITY;
ALTER TABLE cargos ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE encargos ENABLE ROW LEVEL SECURITY;
ALTER TABLE lancamento_mo ENABLE ROW LEVEL SECURITY;
ALTER TABLE manutencao ENABLE ROW LEVEL SECURITY;
ALTER TABLE consumo_agua ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- PROFILES POLICIES
-- =====================================================

CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- =====================================================
-- COMPANY-BASED POLICIES (Multi-tenant)
-- =====================================================

-- Profiles policy for company access
CREATE POLICY "Users can view profiles in their company"
  ON profiles FOR SELECT
  USING (
    company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Production Lines
CREATE POLICY "Users can view production lines in their company"
  ON production_lines FOR SELECT
  USING (
    company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Admins and Gestores can manage production lines"
  ON production_lines FOR ALL
  USING (
    company_id IN (
      SELECT company_id FROM profiles
      WHERE id = auth.uid() AND role IN ('ADMIN', 'GESTOR')
    )
  );

-- Products
CREATE POLICY "Users can view products in their company"
  ON products FOR SELECT
  USING (
    company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Admins and Gestores can manage products"
  ON products FOR ALL
  USING (
    company_id IN (
      SELECT company_id FROM profiles
      WHERE id = auth.uid() AND role IN ('ADMIN', 'GESTOR')
    )
  );

-- Groups
CREATE POLICY "Users can view groups in their company"
  ON groups FOR SELECT
  USING (
    company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Admins and Gestores can manage groups"
  ON groups FOR ALL
  USING (
    company_id IN (
      SELECT company_id FROM profiles
      WHERE id = auth.uid() AND role IN ('ADMIN', 'GESTOR')
    )
  );

-- Pieces
CREATE POLICY "Users can view pieces in their company"
  ON pieces FOR SELECT
  USING (
    company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Admins and Gestores can manage pieces"
  ON pieces FOR ALL
  USING (
    company_id IN (
      SELECT company_id FROM profiles
      WHERE id = auth.uid() AND role IN ('ADMIN', 'GESTOR')
    )
  );

-- Employees
CREATE POLICY "Users can view employees in their company"
  ON employees FOR SELECT
  USING (
    company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Admins and RH can manage employees"
  ON employees FOR ALL
  USING (
    company_id IN (
      SELECT company_id FROM profiles
      WHERE id = auth.uid() AND role IN ('ADMIN', 'RH', 'GESTOR')
    )
  );

-- Lancamento MO
CREATE POLICY "Users can view lancamento_mo in their company"
  ON lancamento_mo FOR SELECT
  USING (
    company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Authorized users can create lancamento_mo"
  ON lancamento_mo FOR INSERT
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM profiles
      WHERE id = auth.uid() AND role IN ('ADMIN', 'RH', 'GESTOR', 'OPERADOR')
    )
  );

CREATE POLICY "Admins and RH can update/delete lancamento_mo"
  ON lancamento_mo FOR ALL
  USING (
    company_id IN (
      SELECT company_id FROM profiles
      WHERE id = auth.uid() AND role IN ('ADMIN', 'RH', 'GESTOR')
    )
  );

-- Manutencao
CREATE POLICY "Users can view manutencao in their company"
  ON manutencao FOR SELECT
  USING (
    company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Authorized users can manage manutencao"
  ON manutencao FOR ALL
  USING (
    company_id IN (
      SELECT company_id FROM profiles
      WHERE id = auth.uid() AND role IN ('ADMIN', 'GESTOR', 'OPERADOR')
    )
  );

-- Consumo Agua
CREATE POLICY "Users can view consumo_agua in their company"
  ON consumo_agua FOR SELECT
  USING (
    company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Authorized users can manage consumo_agua"
  ON consumo_agua FOR ALL
  USING (
    company_id IN (
      SELECT company_id FROM profiles
      WHERE id = auth.uid() AND role IN ('ADMIN', 'GESTOR', 'OPERADOR')
    )
  );

-- Cargos
CREATE POLICY "Users can view cargos in their company"
  ON cargos FOR SELECT
  USING (
    company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Admins and RH can manage cargos"
  ON cargos FOR ALL
  USING (
    company_id IN (
      SELECT company_id FROM profiles
      WHERE id = auth.uid() AND role IN ('ADMIN', 'RH')
    )
  );

-- Encargos
CREATE POLICY "Users can view encargos in their company"
  ON encargos FOR SELECT
  USING (
    company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Only Admins can manage encargos"
  ON encargos FOR ALL
  USING (
    company_id IN (
      SELECT company_id FROM profiles
      WHERE id = auth.uid() AND role = 'ADMIN'
    )
  );

-- =====================================================
-- FUNCTIONS & TRIGGERS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for all tables
CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON companies
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_production_lines_updated_at BEFORE UPDATE ON production_lines
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_groups_updated_at BEFORE UPDATE ON groups
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pieces_updated_at BEFORE UPDATE ON pieces
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_employees_updated_at BEFORE UPDATE ON employees
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_lancamento_mo_updated_at BEFORE UPDATE ON lancamento_mo
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_manutencao_updated_at BEFORE UPDATE ON manutencao
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_consumo_agua_updated_at BEFORE UPDATE ON consumo_agua
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, role)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name', NEW.email, 'LEITOR');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
