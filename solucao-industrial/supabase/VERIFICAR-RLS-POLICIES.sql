-- =====================================================
-- VERIFICAR RLS POLICIES DO SUPABASE
-- Pode ser que as políticas estão bloqueando a leitura
-- =====================================================

-- 1. Verificar políticas da tabela chemical_products
SELECT 
  'POLÍTICAS - CHEMICAL_PRODUCTS' as info,
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check,
  check_expr
FROM pg_policies 
WHERE tablename = 'chemical_products'
ORDER BY policyname;

-- 2. Verificar se usuário tem permissão para ler
SELECT 
  'PERMISSÕES DO USUÁRIO ATUAL' as info,
  grantee,
  table_schema,
  table_name,
  privilege_type,
  is_grantable
FROM information_schema.role_table_grants 
WHERE table_name = 'chemical_products'
  AND grantee = current_user;

-- 3. Testar leitura direta (ignorando RLS)
SELECT 
  'TESTE DIRETO (IGNORANDO RLS)' as info,
  cp.id,
  cp.name,
  cp.company_id,
  cp.production_line_id,
  pl.name as linha_nome
FROM chemical_products cp
INNER JOIN production_lines pl ON cp.production_line_id = pl.id
WHERE cp.active = true
ORDER BY pl.name, cp.name;

-- 4. Verificar configuração RLS
SELECT 
  'CONFIGURAÇÃO RLS' as info,
  schemaname,
  tablename,
  rowsecurity,
  forcerlspolicy
FROM pg_tables 
WHERE tablename = 'chemical_products';

-- 5. Contar produtos por empresa (para verificar se há filtro)
SELECT 
  'PRODUTOS POR EMPRESA' as info,
  company_id,
  COUNT(*) as total,
  STRING_AGG(name, ', ' ORDER BY name) as produtos
FROM chemical_products 
WHERE active = true
GROUP BY company_id
ORDER BY company_id;
