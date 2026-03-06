-- =====================================================
-- CORREÇÃO DEFINITIVA - VINCULAR TODOS OS PRODUTOS ÀS LINHAS
-- Execute este SQL para corrigir TODOS os produtos sem linha
-- =====================================================

-- 1. Verificar estado atual
SELECT 
  'ANTES DA CORREÇÃO' as status,
  COUNT(*) as total_produtos,
  COUNT(CASE WHEN production_line_id IS NULL THEN 1 END) as sem_linha,
  COUNT(CASE WHEN production_line_id IS NOT NULL THEN 1 END) as com_linha
FROM chemical_products 
WHERE active = true;

-- 2. Mostrar produtos sem linha
SELECT 
  'PRODUTOS SEM LINHA (PROBLEMA!)' as info,
  id,
  name,
  company_id
FROM chemical_products 
WHERE production_line_id IS NULL 
  AND active = true
ORDER BY company_id, name;

-- 3. Corrigir produtos sem linha - vincular à primeira linha da mesma empresa
UPDATE chemical_products cp
SET production_line_id = (
  SELECT pl.id
  FROM production_lines pl
  WHERE pl.company_id = cp.company_id
    AND pl.active = true
  ORDER BY pl.created_at ASC
  LIMIT 1
)
WHERE cp.production_line_id IS NULL
  AND cp.active = true
  AND EXISTS (
    SELECT 1
    FROM production_lines pl
    WHERE pl.company_id = cp.company_id
      AND pl.active = true
  );

-- 4. Verificar resultado após a correção
SELECT 
  'APÓS CORREÇÃO' as status,
  COUNT(*) as total_produtos,
  COUNT(CASE WHEN production_line_id IS NULL THEN 1 END) as sem_linha,
  COUNT(CASE WHEN production_line_id IS NOT NULL THEN 1 END) as com_linha
FROM chemical_products 
WHERE active = true;

-- 5. Mostrar distribuição final por linha
SELECT 
  'DISTRIBUIÇÃO FINAL POR LINHA' as info,
  pl.name as linha,
  pl.company_id,
  COUNT(cp.id) as total_produtos,
  STRING_AGG(cp.name, ', ' ORDER BY cp.name) as produtos
FROM production_lines pl
LEFT JOIN chemical_products cp ON pl.id = cp.production_line_id AND cp.active = true
WHERE pl.active = true
GROUP BY pl.id, pl.name, pl.company_id
ORDER BY pl.company_id, pl.name;

-- 6. Verificar especificamente linha "Cobre Ácido"
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
