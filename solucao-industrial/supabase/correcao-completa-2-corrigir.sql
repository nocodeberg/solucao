-- =====================================================
-- CORREÇÃO COMPLETA - PASSO 2: CORRIGIR VINCULAÇÕES
-- Execute APENAS este arquivo após o diagnóstico
-- =====================================================

-- Corrigir produtos vinculados a linhas de outras empresas
-- ou produtos sem linha
UPDATE chemical_products cp
SET production_line_id = (
  SELECT pl.id
  FROM production_lines pl
  WHERE pl.company_id = cp.company_id
    AND pl.active = true
  ORDER BY
    -- Priorizar linhas por tipo/nome específico
    CASE
      WHEN pl.line_type = 'GALVANOPLASTIA' AND LOWER(pl.name) LIKE '%pré-tratamento%' THEN 1
      WHEN pl.line_type = 'GALVANOPLASTIA' AND LOWER(pl.name) LIKE '%cobre%' THEN 2
      WHEN pl.line_type = 'GALVANOPLASTIA' AND LOWER(pl.name) LIKE '%níquel%' THEN 3
      WHEN pl.line_type = 'GALVANOPLASTIA' AND LOWER(pl.name) LIKE '%cromo%' THEN 4
      WHEN pl.line_type = 'GALVANOPLASTIA' THEN 5
      ELSE 6
    END,
    pl.created_at ASC
  LIMIT 1
)
WHERE cp.active = true
  AND (
    -- Produtos sem linha
    cp.production_line_id IS NULL
    OR
    -- Produtos vinculados a linhas de outras empresas
    cp.production_line_id NOT IN (
      SELECT id FROM production_lines WHERE company_id = cp.company_id
    )
  );
