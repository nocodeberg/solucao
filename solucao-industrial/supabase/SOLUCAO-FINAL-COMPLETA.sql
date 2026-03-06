-- =====================================================
-- SOLUÇÃO FINAL COMPLETA - RESET TOTAL
-- Execute este SQL para LIMPAR TUDO e recriar do zero
-- =====================================================

-- 1. LIMPAR TUDO (hard delete completo)
DELETE FROM chemical_product_launches WHERE 1=1;
DELETE FROM chemical_products WHERE 1=1;

-- 2. VERIFICAR LIMPEZA
SELECT 
  '✅ TUDO LIMPADO' as status,
  (SELECT COUNT(*) FROM chemical_products) as produtos_restantes,
  (SELECT COUNT(*) FROM chemical_product_launches) as lancamentos_restantes;

-- 3. RECRIR APENAS produtos para COBRE ÁCIDO (para teste focado)
INSERT INTO chemical_products (name, unit_price, unit, company_id, production_line_id, active, created_at)
SELECT 
  'PRODUTO TESTE 01',
  10.00,
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

-- 4. VERIFICAR RESULTADO
SELECT 
  '🎯 PRODUTOS CRIADOS PARA COBRE ÁCIDO' as resultado,
  cp.id,
  cp.name,
  cp.unit_price,
  pl.name as linha_nome,
  cp.production_line_id
FROM chemical_products cp
INNER JOIN production_lines pl ON cp.production_line_id = pl.id
WHERE pl.name ILIKE '%cobre%acido%' AND cp.active = true
ORDER BY cp.name;

-- 5. VERIFICAR QUE NÃO HÁ PRODUTOS FORA DO LUGAR
SELECT 
  '🔍 VERIFICAÇÃO - PRODUTOS FORA DO LUGAR' as verificacao,
  COUNT(*) as total_fora,
  CASE 
    WHEN COUNT(*) = 0 THEN '✅ TODOS OS PRODUTOS ESTÃO CORRETOS'
    ELSE '❌ HÁ PRODUTOS FORA DO LUGAR!'
  END as status
FROM chemical_products cp
WHERE cp.active = true 
  AND (
    cp.production_line_id IS NULL 
    OR NOT EXISTS (
      SELECT 1 FROM production_lines pl 
      WHERE pl.id = cp.production_line_id AND pl.active = true
    )
  );

-- 6. RESUMO FINAL
SELECT 
  '📊 RESUMO FINAL - TUDO PRONTO?' as resumo,
  pl.name as linha,
  COUNT(cp.id) as total_produtos,
  CASE 
    WHEN COUNT(cp.id) > 0 THEN '✅ PRONTO PARA TESTAR'
    ELSE '❌ PROBLEMA AINDA!'
  END as status
FROM production_lines pl
LEFT JOIN chemical_products cp ON pl.id = cp.production_line_id AND cp.active = true
WHERE pl.active = true
GROUP BY pl.id, pl.name
ORDER BY pl.name;
