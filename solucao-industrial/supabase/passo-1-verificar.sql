-- =====================================================
-- PASSO 1: VERIFICAR PRODUTOS SEM LINHA
-- Execute APENAS este bloco primeiro
-- =====================================================

SELECT
  cp.id,
  cp.name,
  cp.company_id,
  cp.production_line_id,
  'SEM LINHA' as status
FROM chemical_products cp
WHERE cp.production_line_id IS NULL
  AND cp.active = true
ORDER BY cp.company_id, cp.name;
