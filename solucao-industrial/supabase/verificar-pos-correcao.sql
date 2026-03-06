-- =====================================================
-- VERIFICAÇÃO PÓS-CORREÇÃO
-- Execute este SQL para confirmar que tudo está correto
-- =====================================================

-- 1. Verificar se todos os produtos agora têm linha
SELECT 
  'PRODUTOS COM LINHA' as info,
  COUNT(*) as total_produtos,
  COUNT(CASE WHEN production_line_id IS NOT NULL THEN 1 END) as com_linha,
  COUNT(CASE WHEN production_line_id IS NULL THEN 1 END) as sem_linha
FROM chemical_products 
WHERE active = true;

-- 2. Verificar distribuição por linha
SELECT 
  'DISTRIBUIÇÃO POR LINHA' as info,
  pl.name as linha,
  COUNT(cp.id) as total_produtos,
  STRING_AGG(cp.name, ', ' ORDER BY cp.name) as produtos_lista
FROM production_lines pl
LEFT JOIN chemical_products cp ON pl.id = cp.production_line_id AND cp.active = true
WHERE pl.active = true
GROUP BY pl.id, pl.name
ORDER BY pl.name;

-- 3. Verificar se há produtos sem linha (deveria ser 0)
SELECT 
  'PRODUTOS SEM LINHA (DEVERIA SER 0)' as info,
  cp.id,
  cp.name,
  cp.company_id
FROM chemical_products cp
WHERE cp.production_line_id IS NULL 
  AND cp.active = true;

-- 4. Verificar produtos da linha "Cobre Alcalino" (se existir)
SELECT 
  'PRODUTOS DA LINHA COBRE ALCALINO' as info,
  cp.name,
  cp.unit_price
FROM chemical_products cp
INNER JOIN production_lines pl ON cp.production_line_id = pl.id
WHERE pl.name ILIKE '%cobre%alcalino%' 
  AND cp.active = true
  AND pl.active = true
ORDER BY cp.name;
