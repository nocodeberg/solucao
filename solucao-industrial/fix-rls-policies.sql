-- =====================================================
-- FIX: Recursão infinita nas policies RLS
-- Execute este SQL no Supabase SQL Editor
-- =====================================================

-- PROBLEMA:
-- As policies fazem subqueries recursivas em 'profiles' dentro de policies de 'profiles'
-- Isso causa: "infinite recursion detected in policy for relation profiles"

-- SOLUÇÃO:
-- Criar uma função helper segura que retorna o company_id do usuário
-- e usar essa função em todas as policies

-- =====================================================
-- 1. CRIAR FUNÇÃO HELPER (evita recursão)
-- =====================================================

CREATE OR REPLACE FUNCTION public.user_company_id()
RETURNS UUID
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
  SELECT company_id FROM public.profiles WHERE id = auth.uid() LIMIT 1;
$$;

-- =====================================================
-- 2. REMOVER POLICIES PROBLEMÁTICAS
-- =====================================================

-- Profiles
DROP POLICY IF EXISTS "Users can view profiles in their company" ON profiles;

-- Production Lines
DROP POLICY IF EXISTS "Users can view production lines in their company" ON production_lines;
DROP POLICY IF EXISTS "Admins and Gestores can manage production lines" ON production_lines;

-- Products
DROP POLICY IF EXISTS "Users can view products in their company" ON products;
DROP POLICY IF EXISTS "Admins and Gestores can manage products" ON products;

-- Groups
DROP POLICY IF EXISTS "Users can view groups in their company" ON groups;
DROP POLICY IF EXISTS "Admins and Gestores can manage groups" ON groups;

-- Pieces
DROP POLICY IF EXISTS "Users can view pieces in their company" ON pieces;
DROP POLICY IF EXISTS "Admins and Gestores can manage pieces" ON pieces;

-- Employees
DROP POLICY IF EXISTS "Users can view employees in their company" ON employees;
DROP POLICY IF EXISTS "Admins and RH can manage employees" ON employees;

-- Lancamento MO
DROP POLICY IF EXISTS "Users can view lancamento_mo in their company" ON lancamento_mo;
DROP POLICY IF EXISTS "Authorized users can create lancamento_mo" ON lancamento_mo;
DROP POLICY IF EXISTS "Admins and RH can update/delete lancamento_mo" ON lancamento_mo;

-- Manutencao
DROP POLICY IF EXISTS "Users can view manutencao in their company" ON manutencao;
DROP POLICY IF EXISTS "Authorized users can manage manutencao" ON manutencao;

-- Consumo Agua
DROP POLICY IF EXISTS "Users can view consumo_agua in their company" ON consumo_agua;
DROP POLICY IF EXISTS "Authorized users can manage consumo_agua" ON consumo_agua;

-- Cargos
DROP POLICY IF EXISTS "Users can view cargos in their company" ON cargos;
DROP POLICY IF EXISTS "Admins and RH can manage cargos" ON cargos;

-- Encargos
DROP POLICY IF EXISTS "Users can view encargos in their company" ON encargos;
DROP POLICY IF EXISTS "Only Admins can manage encargos" ON encargos;

-- Chemical Products
DROP POLICY IF EXISTS "Users can view chemical products in their company" ON chemical_products;
DROP POLICY IF EXISTS "Admins and Gestores can manage chemical products" ON chemical_products;

-- Chemical Product Launches
DROP POLICY IF EXISTS "Users can view chemical launches in their company" ON chemical_product_launches;
DROP POLICY IF EXISTS "Authorized users can create chemical launches" ON chemical_product_launches;
DROP POLICY IF EXISTS "Authorized users can update/delete chemical launches" ON chemical_product_launches;

-- =====================================================
-- 3. CRIAR NOVAS POLICIES SEM RECURSÃO
-- =====================================================

-- =====================================================
-- PROFILES POLICIES
-- =====================================================

CREATE POLICY "Users can view profiles in their company"
  ON profiles FOR SELECT
  USING (company_id = public.user_company_id());

-- =====================================================
-- PRODUCTION LINES POLICIES
-- =====================================================

CREATE POLICY "Users can view production lines in their company"
  ON production_lines FOR SELECT
  USING (company_id = public.user_company_id());

CREATE POLICY "Admins and Gestores can manage production lines"
  ON production_lines FOR ALL
  USING (
    company_id = public.user_company_id()
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('ADMIN', 'GESTOR')
    )
  );

-- =====================================================
-- PRODUCTS POLICIES
-- =====================================================

CREATE POLICY "Users can view products in their company"
  ON products FOR SELECT
  USING (company_id = public.user_company_id());

CREATE POLICY "Admins and Gestores can manage products"
  ON products FOR ALL
  USING (
    company_id = public.user_company_id()
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('ADMIN', 'GESTOR')
    )
  );

-- =====================================================
-- GROUPS POLICIES
-- =====================================================

CREATE POLICY "Users can view groups in their company"
  ON groups FOR SELECT
  USING (company_id = public.user_company_id());

CREATE POLICY "Admins and Gestores can manage groups"
  ON groups FOR ALL
  USING (
    company_id = public.user_company_id()
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('ADMIN', 'GESTOR')
    )
  );

-- =====================================================
-- PIECES POLICIES
-- =====================================================

CREATE POLICY "Users can view pieces in their company"
  ON pieces FOR SELECT
  USING (company_id = public.user_company_id());

CREATE POLICY "Admins and Gestores can manage pieces"
  ON pieces FOR ALL
  USING (
    company_id = public.user_company_id()
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('ADMIN', 'GESTOR')
    )
  );

-- =====================================================
-- EMPLOYEES POLICIES
-- =====================================================

CREATE POLICY "Users can view employees in their company"
  ON employees FOR SELECT
  USING (company_id = public.user_company_id());

CREATE POLICY "Admins and RH can manage employees"
  ON employees FOR ALL
  USING (
    company_id = public.user_company_id()
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('ADMIN', 'RH', 'GESTOR')
    )
  );

-- =====================================================
-- LANCAMENTO MO POLICIES
-- =====================================================

CREATE POLICY "Users can view lancamento_mo in their company"
  ON lancamento_mo FOR SELECT
  USING (company_id = public.user_company_id());

CREATE POLICY "Authorized users can create lancamento_mo"
  ON lancamento_mo FOR INSERT
  WITH CHECK (
    company_id = public.user_company_id()
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('ADMIN', 'RH', 'GESTOR', 'OPERADOR')
    )
  );

CREATE POLICY "Admins and RH can update/delete lancamento_mo"
  ON lancamento_mo FOR ALL
  USING (
    company_id = public.user_company_id()
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('ADMIN', 'RH', 'GESTOR')
    )
  );

-- =====================================================
-- MANUTENCAO POLICIES
-- =====================================================

CREATE POLICY "Users can view manutencao in their company"
  ON manutencao FOR SELECT
  USING (company_id = public.user_company_id());

CREATE POLICY "Authorized users can manage manutencao"
  ON manutencao FOR ALL
  USING (
    company_id = public.user_company_id()
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('ADMIN', 'GESTOR', 'OPERADOR')
    )
  );

-- =====================================================
-- CONSUMO AGUA POLICIES
-- =====================================================

CREATE POLICY "Users can view consumo_agua in their company"
  ON consumo_agua FOR SELECT
  USING (company_id = public.user_company_id());

CREATE POLICY "Authorized users can manage consumo_agua"
  ON consumo_agua FOR ALL
  USING (
    company_id = public.user_company_id()
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('ADMIN', 'GESTOR', 'OPERADOR')
    )
  );

-- =====================================================
-- CARGOS POLICIES
-- =====================================================

CREATE POLICY "Users can view cargos in their company"
  ON cargos FOR SELECT
  USING (company_id = public.user_company_id());

CREATE POLICY "Admins and RH can manage cargos"
  ON cargos FOR ALL
  USING (
    company_id = public.user_company_id()
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('ADMIN', 'RH')
    )
  );

-- =====================================================
-- ENCARGOS POLICIES
-- =====================================================

CREATE POLICY "Users can view encargos in their company"
  ON encargos FOR SELECT
  USING (company_id = public.user_company_id());

CREATE POLICY "Only Admins can manage encargos"
  ON encargos FOR ALL
  USING (
    company_id = public.user_company_id()
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role = 'ADMIN'
    )
  );

-- =====================================================
-- CHEMICAL PRODUCTS POLICIES
-- =====================================================

CREATE POLICY "Users can view chemical products in their company"
  ON chemical_products FOR SELECT
  USING (company_id = public.user_company_id());

CREATE POLICY "Admins and Gestores can manage chemical products"
  ON chemical_products FOR ALL
  USING (
    company_id = public.user_company_id()
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('ADMIN', 'GESTOR')
    )
  );

-- =====================================================
-- CHEMICAL PRODUCT LAUNCHES POLICIES
-- =====================================================

CREATE POLICY "Users can view chemical launches in their company"
  ON chemical_product_launches FOR SELECT
  USING (company_id = public.user_company_id());

CREATE POLICY "Authorized users can create chemical launches"
  ON chemical_product_launches FOR INSERT
  WITH CHECK (
    company_id = public.user_company_id()
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('ADMIN', 'GESTOR', 'OPERADOR')
    )
  );

CREATE POLICY "Authorized users can update/delete chemical launches"
  ON chemical_product_launches FOR ALL
  USING (
    company_id = public.user_company_id()
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('ADMIN', 'GESTOR', 'OPERADOR')
    )
  );

-- =====================================================
-- 4. VERIFICAR SE FUNCIONOU
-- =====================================================

SELECT 'Policies corrigidas com sucesso!' as status;

-- Opcional: Verificar as policies criadas
SELECT
  schemaname,
  tablename,
  policyname
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
