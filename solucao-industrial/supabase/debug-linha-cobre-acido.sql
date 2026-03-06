-- =====================================================
-- DEBUG ESPECÍFICO - LINHA COBRE ÁCIDO
-- Execute este SQL para ver exatamente o que está acontecendo
-- =====================================================

-- 1. Verificar se a linha "Cobre Ácido" existe
SELECT 
  'LINHA COBRE ÁCIDO' as info,
  id,
  name,
  company_id,
  active
FROM production_lines 
WHERE name ILIKE '%cobre%acido%' OR name ILIKE '%cobre%acid%';

-- 2. Verificar TODOS os produtos químicos ativos
SELECT 
  'TODOS OS PRODUTOS ATIVOS' as info,
  cp.id,
  cp.name,
  cp.company_id,
  cp.production_line_id,
  pl.name as linha_nome,
  CASE 
    WHEN cp.production_line_id IS NULL THEN 'SEM LINHA'
    ELSE 'COM LINHA'
  END as status
FROM chemical_products cp
LEFT JOIN production_lines pl ON cp.production_line_id = pl.id
WHERE cp.active = true
ORDER BY cp.name;

-- 3. Verificar especificamente produtos da linha "Cobre Ácido"
SELECT 
  'PRODUTOS DA LINHA COBRE ÁCIDO' as info,
  cp.id,
  cp.name,
  cp.unit_price
FROM chemical_products cp
INNER JOIN production_lines pl ON cp.production_line_id = pl.id
WHERE pl.name ILIKE '%cobre%acido%' OR pl.name ILIKE '%cobre%acid%'
  AND cp.active = true
  AND pl.active = true
ORDER BY cp.name;

-- 4. Verificar produtos que estão SEM LINHA (esses aparecem em todos os lugares)
SELECT 
  'PRODUTOS SEM LINHA (PROBLEMA!)' as info,
  cp.id,
  cp.name,
  cp.company_id
FROM chemical_products cp
WHERE cp.production_line_id IS NULL 
  AND cp.active = true;

-- 5. Contar produtos por linha
SELECT 
  'RESUMO POR LINHA' as info,
  pl.name as linha,
  COUNT(cp.id) as total_produtos
FROM production_lines pl
LEFT JOIN chemical_products cp ON pl.id = cp.production_line_id AND cp.active = true
WHERE pl.active = true
GROUP BY pl.id, pl.name
ORDER BY pl.name;
