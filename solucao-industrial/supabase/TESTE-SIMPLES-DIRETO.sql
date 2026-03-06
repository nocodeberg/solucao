-- =====================================================
-- TESTE SIMPLES E DIRETO
-- Execute passo a passo para testar
-- =====================================================

-- 1. VERIFICAR LINHAS
SELECT 'LINHAS DISPONÍVEIS' as info, id, name, company_id, active 
FROM production_lines 
WHERE active = true
ORDER BY name;

-- 2. APAGAR TUDO
DELETE FROM chemical_products WHERE 1=1;

-- 3. CRIAR UM PRODUTO SÓ PARA COBRE ÁCIDO
INSERT INTO chemical_products (name, unit_price, unit, company_id, production_line_id, active, created_at)
SELECT 
  'TESTE UNICO PRODUTO',
  50.00,
  'L',
  company_id,
  id,
  true,
  NOW()
FROM production_lines 
WHERE name ILIKE '%cobre%acido%' AND active = true
LIMIT 1;

-- 4. VERIFICAR RESULTADO
SELECT 
  'RESULTADO FINAL' as info,
  cp.id,
  cp.name,
  cp.company_id,
  cp.production_line_id,
  pl.name as linha_nome
FROM chemical_products cp
INNER JOIN production_lines pl ON cp.production_line_id = pl.id
WHERE cp.active = true
ORDER BY pl.name, cp.name;
