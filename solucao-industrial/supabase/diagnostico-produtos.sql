-- =====================================================
-- DIAGNÓSTICO: Verificar produtos e suas linhas
-- Execute este SQL para ver o estado atual
-- =====================================================

SELECT
  cp.id,
  cp.name as produto,
  cp.production_line_id,
  pl.name as linha,
  cp.company_id,
  CASE
    WHEN cp.production_line_id IS NULL THEN 'SEM LINHA'
    ELSE 'COM LINHA'
  END as status
FROM chemical_products cp
LEFT JOIN production_lines pl ON cp.production_line_id = pl.id
WHERE cp.active = true
ORDER BY cp.production_line_id, cp.name;
