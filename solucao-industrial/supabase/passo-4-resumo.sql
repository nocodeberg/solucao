-- =====================================================
-- PASSO 4: RESUMO DA VINCULAÇÃO
-- Execute APENAS este bloco para ver o resultado final
-- =====================================================

SELECT
  pl.name as linha,
  COUNT(cp.id) as total_produtos
FROM chemical_products cp
INNER JOIN production_lines pl ON cp.production_line_id = pl.id
WHERE cp.active = true
GROUP BY pl.name
ORDER BY pl.name;
