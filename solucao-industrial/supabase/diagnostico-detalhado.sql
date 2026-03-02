-- =====================================================
-- DIAGNÓSTICO DETALHADO: Verificar produtos, linhas e empresas
-- Execute este SQL para ver possíveis inconsistências
-- =====================================================

-- 1. Verificar produtos químicos e suas linhas de produção
SELECT
  cp.id as produto_id,
  cp.name as produto_nome,
  cp.company_id as produto_company_id,
  cp.production_line_id,
  pl.id as linha_id,
  pl.name as linha_nome,
  pl.company_id as linha_company_id,
  CASE
    WHEN cp.production_line_id IS NULL THEN '❌ SEM LINHA'
    WHEN cp.company_id != pl.company_id THEN '⚠️ EMPRESA DIFERENTE'
    ELSE '✅ OK'
  END as status
FROM chemical_products cp
LEFT JOIN production_lines pl ON cp.production_line_id = pl.id
WHERE cp.active = true
ORDER BY status DESC, cp.company_id, pl.name, cp.name;

-- 2. Resumo de produtos por linha e empresa
-- SELECT
--   pl.company_id,
--   pl.id as linha_id,
--   pl.name as linha_nome,
--   COUNT(cp.id) as total_produtos
-- FROM production_lines pl
-- LEFT JOIN chemical_products cp ON cp.production_line_id = pl.id AND cp.active = true
-- WHERE pl.active = true
-- GROUP BY pl.company_id, pl.id, pl.name
-- ORDER BY pl.company_id, pl.name;

-- 3. Produtos vinculados a linhas de outras empresas (PROBLEMA!)
-- SELECT
--   cp.id,
--   cp.name as produto,
--   cp.company_id as empresa_do_produto,
--   pl.name as linha,
--   pl.company_id as empresa_da_linha
-- FROM chemical_products cp
-- INNER JOIN production_lines pl ON cp.production_line_id = pl.id
-- WHERE cp.active = true
--   AND cp.company_id != pl.company_id
-- ORDER BY cp.company_id;
