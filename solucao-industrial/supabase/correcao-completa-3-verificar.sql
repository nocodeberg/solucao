-- =====================================================
-- CORREÇÃO COMPLETA - PASSO 3: VERIFICAR RESULTADO
-- Execute APENAS este arquivo após a correção
-- =====================================================

-- Verificar se ainda existem problemas
SELECT
  CASE
    WHEN cp.production_line_id IS NULL THEN 'SEM_LINHA'
    WHEN pl.id IS NULL THEN 'LINHA_INVALIDA'
    WHEN cp.company_id != pl.company_id THEN 'EMPRESA_DIFERENTE'
    ELSE 'OK'
  END as status,
  COUNT(*) as quantidade
FROM chemical_products cp
LEFT JOIN production_lines pl ON cp.production_line_id = pl.id
WHERE cp.active = true
GROUP BY status
ORDER BY status;
