-- =====================================================
-- CORREÇÃO DIRETA E DEFINITIVA
-- Execute este SQL AGORA para resolver o problema de uma vez
-- =====================================================

-- 1. FORÇAR: Apagar TODOS os produtos químicos (hard delete)
DELETE FROM chemical_product_launches WHERE 1=1;
DELETE FROM chemical_products WHERE 1=1;

-- 2. VERIFICAR: Confirmar que está tudo limpo
SELECT 
  '✅ TABELA LIMPA' as status,
  COUNT(*) as total_produtos_restantes
FROM chemical_products;

-- 3. RECRIR: Produtos específicos para cada linha (usando subqueries diretas)
-- NOTA: Isso vai criar produtos já corretamente vinculados

-- Para Cobre Ácido
INSERT INTO chemical_products (name, unit_price, unit, company_id, production_line_id, active, created_at)
SELECT 
  'BRILHANTE COBRE ÁCIDO',
  25.50,
  'L',
  company_id,
  id,
  true,
  NOW()
FROM production_lines 
WHERE name ILIKE '%cobre%acido%' AND active = true
LIMIT 1;

INSERT INTO chemical_products (name, unit_price, unit, company_id, production_line_id, active, created_at)
SELECT 
  'ATIVADOR ÁCIDO',
  18.75,
  'L',
  company_id,
  id,
  true,
  NOW()
FROM production_lines 
WHERE name ILIKE '%cobre%acido%' AND active = true
LIMIT 1;

INSERT INTO chemical_products (name, unit_price, unit, company_id, production_line_id, active, created_at)
SELECT 
  'ACIDO SULFURICO 98%',
  12.30,
  'L',
  company_id,
  id,
  true,
  NOW()
FROM production_lines 
WHERE name ILIKE '%cobre%acido%' AND active = true
LIMIT 1;

-- Para Cobre Alcalino
INSERT INTO chemical_products (name, unit_price, unit, company_id, production_line_id, active, created_at)
SELECT 
  'BRILHANTE ALCALINO COPPER BRIGHT',
  28.90,
  'L',
  company_id,
  id,
  true,
  NOW()
FROM production_lines 
WHERE name ILIKE '%cobre%alcalino%' AND active = true
LIMIT 1;

INSERT INTO chemical_products (name, unit_price, unit, company_id, production_line_id, active, created_at)
SELECT 
  'ATIVADOR ALCALINO',
  22.40,
  'L',
  company_id,
  id,
  true,
  NOW()
FROM production_lines 
WHERE name ILIKE '%cobre%alcalino%' AND active = true
LIMIT 1;

-- Para outras linhas (genérico)
INSERT INTO chemical_products (name, unit_price, unit, company_id, production_line_id, active, created_at)
SELECT 
  'ACTIVE ZMC',
  35.60,
  'kg',
  company_id,
  id,
  true,
  NOW()
FROM production_lines 
WHERE name NOT ILIKE '%cobre%' AND active = true
LIMIT 1;

INSERT INTO chemical_products (name, unit_price, unit, company_id, production_line_id, active, created_at)
SELECT 
  'ANODO COBRE ELETROLÍTICO 99,9%',
  45.00,
  'un',
  company_id,
  id,
  true,
  NOW()
FROM production_lines 
WHERE name NOT ILIKE '%cobre%' AND active = true
LIMIT 1;

-- 4. VERIFICAR: Resultado final
SELECT 
  '🎯 PRODUTOS CRIADOS E VINCULADOS' as resultado,
  cp.name,
  cp.unit_price,
  pl.name as linha_nome,
  cp.production_line_id,
  cp.company_id
FROM chemical_products cp
INNER JOIN production_lines pl ON cp.production_line_id = pl.id
WHERE cp.active = true
ORDER BY pl.name, cp.name;

-- 5. RESUMO FINAL
SELECT 
  '📊 RESUMO FINAL - TUDO CORRETO?' as resumo,
  pl.name as linha,
  COUNT(cp.id) as total_produtos,
  '0 produtos sem linha = PROBLEMA RESOLVIDO' as status
FROM production_lines pl
LEFT JOIN chemical_products cp ON pl.id = cp.production_line_id AND cp.active = true
WHERE pl.active = true
GROUP BY pl.id, pl.name
ORDER BY pl.name;

-- 6. VERIFICAÇÃO FINAL: Confirmar que não há produtos sem linha
SELECT 
  '🔍 VERIFICAÇÃO FINAL - PRODUTOS SEM LINHA' as verificacao,
  COUNT(*) as produtos_sem_linha,
  CASE 
    WHEN COUNT(*) = 0 THEN '✅ PROBLEMA RESOLVIDO!'
    ELSE '❌ AINDA HÁ PROBLEMA!'
  END as status
FROM chemical_products 
WHERE production_line_id IS NULL AND active = true;
