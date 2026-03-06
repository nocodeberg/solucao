-- =====================================================
-- DIAGNÓSTICO EXATO - VERIFICAR O PROBLEMA REAL
-- Execute este SQL para ver exatamente o que está acontecendo
-- =====================================================

-- 1. Verificar se há produtos SEM LINHA (estes são o problema!)
SELECT 
  '❌ PRODUTOS SEM LINHA (ESTES APARECEM EM TODOS OS MODAIS)' as problema,
  cp.id,
  cp.name,
  cp.company_id,
  cp.production_line_id
FROM chemical_products cp
WHERE cp.production_line_id IS NULL 
  AND cp.active = true
ORDER BY cp.name;

-- 2. Verificar produtos COM LINHA correta
SELECT 
  '✅ PRODUTOS COM LINHA (ESTES DEVEM APARECER CORRETAMENTE)' as ok,
  cp.id,
  cp.name,
  cp.company_id,
  cp.production_line_id,
  pl.name as linha_nome
FROM chemical_products cp
INNER JOIN production_lines pl ON cp.production_line_id = pl.id
WHERE cp.active = true
ORDER BY pl.name, cp.name;

-- 3. Verificar linha "Cobre Ácido" especificamente
SELECT 
  '🎯 LINHA COBRE ÁCIDO - PRODUTOS VINCULADOS' as cobre_acido,
  cp.id,
  cp.name,
  cp.unit_price,
  cp.production_line_id
FROM chemical_products cp
INNER JOIN production_lines pl ON cp.production_line_id = pl.id
WHERE pl.name ILIKE '%cobre%acido%' OR pl.name ILIKE '%cobre%acid%'
  AND cp.active = true
  AND pl.active = true
ORDER BY cp.name;

-- 4. Contagem exata por situação
SELECT 
  '📊 RESUMO EXATO DA SITUAÇÃO' as resumo,
  COUNT(*) as total_produtos_ativos,
  COUNT(CASE WHEN production_line_id IS NULL THEN 1 END) as sem_linha,
  COUNT(CASE WHEN production_line_id IS NOT NULL THEN 1 END) as com_linha
FROM chemical_products 
WHERE active = true;
