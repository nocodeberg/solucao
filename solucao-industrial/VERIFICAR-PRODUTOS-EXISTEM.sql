-- =====================================================
-- SCRIPT DE VERIFICAÇÃO - Produtos Químicos
-- Execute no Supabase SQL Editor para ver se produtos existem
-- =====================================================

-- 1. Quantos produtos químicos existem por linha?
SELECT
  pl.name as linha,
  COUNT(cp.id) as total_produtos_quimicos,
  pl.company_id
FROM production_lines pl
LEFT JOIN chemical_products cp ON cp.production_line_id = pl.id AND cp.active = true
WHERE pl.active = true
GROUP BY pl.id, pl.name, pl.company_id
ORDER BY pl.name;

-- 2. Quais são os produtos químicos de cada linha?
SELECT
  pl.name as linha,
  cp.name as produto_quimico,
  cp.unit_price as preco,
  cp.unit as unidade,
  cp.company_id,
  cp.production_line_id
FROM production_lines pl
LEFT JOIN chemical_products cp ON cp.production_line_id = pl.id AND cp.active = true
WHERE pl.active = true
ORDER BY pl.name, cp.name;

-- 3. Total geral de produtos químicos
SELECT COUNT(*) as total_geral_produtos_quimicos
FROM chemical_products
WHERE active = true;

-- =====================================================
-- RESULTADO ESPERADO:
-- Se os scripts foram executados corretamente, você verá:
-- - "Cobre Ácido" com 17 produtos
-- - Cada linha com seus produtos específicos
-- - Total geral > 0
--
-- Se você ver 0 produtos, significa que precisa executar:
-- PRODUTOS-ESPECIFICOS-FINAIS.sql
-- =====================================================
