-- =====================================================
-- DESABILITAR RLS TEMPORARIAMENTE
-- Execute este SQL para resolver o problema imediatamente
-- =====================================================

-- 1. Desabilitar RLS da tabela chemical_products
ALTER TABLE chemical_products DISABLE ROW LEVEL SECURITY;

-- 2. Verificar se está desabilitado
SELECT 
  'RLS DESABILITADO?' as status,
  schemaname,
  tablename,
  rowsecurity,
  forcerlspolicy
FROM pg_tables 
WHERE tablename = 'chemical_products';

-- 3. Testar leitura direta (agora deve funcionar)
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
  'PRODUTOS POR LINHA (APÓS RLS DESABILITADO)' as info,
  pl.name as linha,
  COUNT(cp.id) as total_produtos
FROM production_lines pl
LEFT JOIN chemical_products cp ON pl.id = cp.production_line_id AND cp.active = true
WHERE pl.active = true
GROUP BY pl.id, pl.name
ORDER BY pl.name;

-- 5. Instruções para reabilitar depois
SELECT 
  'INSTRUÇÕES' as info,
  'Para reabilitar RLS, execute:' as comando,
  'ALTER TABLE chemical_products ENABLE ROW LEVEL SECURITY;' as sql;
