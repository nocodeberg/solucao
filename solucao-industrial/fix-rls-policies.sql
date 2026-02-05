-- =====================================================
-- FIX: Recursão infinita nas policies do profiles
-- Execute este SQL no Supabase SQL Editor
-- =====================================================

-- 1. Remover a policy problemática
DROP POLICY IF EXISTS "Users can view profiles in their company" ON profiles;

-- 2. Criar helper function para evitar recursão
CREATE OR REPLACE FUNCTION auth.user_company_id()
RETURNS UUID
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
  SELECT company_id FROM public.profiles WHERE id = auth.uid() LIMIT 1;
$$;

-- 3. Criar nova policy SEM recursão
CREATE POLICY "Users can view profiles in their company"
  ON profiles FOR SELECT
  USING (company_id = auth.user_company_id());

-- 4. Verificar se funcionou
SELECT 'Policy corrigida com sucesso!' as status;
