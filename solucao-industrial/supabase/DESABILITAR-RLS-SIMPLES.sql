-- =====================================================
-- DESABILITAR RLS - VERSÃO SIMPLIFICADA
-- Funciona em qualquer versão do Supabase
-- =====================================================

-- 1. Desabilitar RLS da tabela chemical_products
ALTER TABLE chemical_products DISABLE ROW LEVEL SECURITY;

-- 2. Verificar se está desabilitado
SELECT 
  'RLS DESABILITADO?' as status,
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE tablename = 'chemical_products';

-- 3. Testar leitura (agora deve funcionar)
SELECT 
  'TESTE APÓS DESABILITAR RLS' as info,
  cp.id,
  cp.name,
  cp.company_id,
  cp.production_line_id,
  pl.name as linha_nome
FROM chemical_products cp
INNER JOIN production_lines pl ON cp.production_line_id = pl.id
WHERE cp.active = true
ORDER BY pl.name, cp.name;

-- 4. Verificar produtos por linha
SELECT 
  'PRODUTOS POR LINHA' as info,
  pl.name as linha,
  COUNT(cp.id) as total_produtos
FROM production_lines pl
LEFT JOIN chemical_products cp ON pl.id = cp.production_line_id AND cp.active = true
WHERE pl.active = true
GROUP BY pl.id, pl.name
ORDER BY pl.name;
