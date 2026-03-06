-- =====================================================
-- ANÁLISE COMPLETA - VERIFICAR POR QUE PRODUTOS ERRADOS APARECEM
-- Execute este SQL para diagnosticar o problema
-- =====================================================

-- 1. Verificar TODAS as linhas de produção
SELECT 
  'TODAS AS LINHAS' as info,
  id,
  name,
  company_id,
  active,
  created_at
FROM production_lines 
WHERE active = true
ORDER BY company_id, name;

-- 2. Verificar TODOS os produtos químicos e suas linhas
SELECT 
  'TODOS OS PRODUTOS E SUAS LINHAS' as info,
  cp.id,
  cp.name as produto,
  cp.company_id,
  cp.production_line_id,
  cp.active,
  pl.name as linha_nome,
  CASE 
    WHEN cp.production_line_id IS NULL THEN '❌ SEM LINHA'
    ELSE '✅ COM LINHA'
  END as status
FROM chemical_products cp
LEFT JOIN production_lines pl ON cp.production_line_id = pl.id
WHERE cp.active = true
ORDER BY cp.company_id, pl.name, cp.name;

-- 3. Verificar especificamente produtos da linha "Cobre Ácido"
SELECT 
  'PRODUTOS ESPECÍFICOS - COBRE ÁCIDO' as info,
  cp.id,
  cp.name as produto,
  cp.unit_price,
  cp.company_id,
  cp.production_line_id
FROM chemical_products cp
INNER JOIN production_lines pl ON cp.production_line_id = pl.id
WHERE pl.name ILIKE '%cobre%acido%' OR pl.name ILIKE '%cobre%acid%'
  AND cp.active = true
  AND pl.active = true
ORDER BY cp.name;

-- 4. Verificar se há produtos SEM LINHA (estes são o problema!)
SELECT 
  '❌ PRODUTOS SEM LINHA (APARECEM EM TODOS OS MODAIS)' as info,
  cp.id,
  cp.name as produto,
  cp.company_id,
  cp.unit_price
FROM chemical_products cp
WHERE cp.production_line_id IS NULL 
  AND cp.active = true
ORDER BY cp.name;

-- 5. Contar produtos por linha para ver a distribuição
SELECT 
  'DISTRIBUIÇÃO DE PRODUTOS POR LINHA' as info,
  pl.name as linha,
  pl.company_id,
  COUNT(cp.id) as total_produtos,
  STRING_AGG(cp.name, ', ' ORDER BY cp.name) as produtos_lista
FROM production_lines pl
LEFT JOIN chemical_products cp ON pl.id = cp.production_line_id AND cp.active = true
WHERE pl.active = true
GROUP BY pl.id, pl.name, pl.company_id
ORDER BY pl.company_id, pl.name;

-- 6. Verificar lançamentos existentes para entender o padrão
SELECT 
  'LANÇAMENTOS EXISTENTES' as info,
  cpl.production_line_id,
  pl.name as linha_nome,
  COUNT(cpl.id) as total_lancamentos,
  cpl.mes,
  cpl.ano
FROM chemical_product_launches cpl
INNER JOIN production_lines pl ON cpl.production_line_id = pl.id
GROUP BY cpl.production_line_id, pl.name, cpl.mes, cpl.ano
ORDER BY pl.name, cpl.ano, cpl.mes;
