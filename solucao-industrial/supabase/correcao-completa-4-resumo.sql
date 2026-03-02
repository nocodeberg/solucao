-- =====================================================
-- CORREÇÃO COMPLETA - PASSO 4: RESUMO FINAL
-- Execute APENAS este arquivo para ver o resumo
-- =====================================================

-- Resumo de produtos por empresa e linha
SELECT
  cp.company_id,
  pl.name as linha,
  COUNT(cp.id) as total_produtos,
  STRING_AGG(cp.name, ', ' ORDER BY cp.name) as produtos
FROM chemical_products cp
INNER JOIN production_lines pl ON cp.production_line_id = pl.id
WHERE cp.active = true
  AND pl.active = true
GROUP BY cp.company_id, pl.id, pl.name
ORDER BY cp.company_id, pl.name;
