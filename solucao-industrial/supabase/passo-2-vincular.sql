-- =====================================================
-- PASSO 2: VINCULAR PRODUTOS À PRIMEIRA LINHA
-- Execute APENAS este bloco após verificar o Passo 1
-- =====================================================

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
