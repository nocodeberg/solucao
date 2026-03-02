-- =====================================================
-- CORREÇÃO COMPLETA - PASSO 1: DIAGNÓSTICO
-- Execute APENAS este arquivo primeiro
-- =====================================================

-- Verificar produtos com problemas de vinculação
SELECT
  cp.id as produto_id,
  cp.name as produto_nome,
  cp.company_id as produto_company_id,
  cp.production_line_id,
  pl.id as linha_id,
  pl.name as linha_nome,
  pl.company_id as linha_company_id,
  CASE
    WHEN cp.production_line_id IS NULL THEN 'SEM_LINHA'
    WHEN pl.id IS NULL THEN 'LINHA_INVALIDA'
    WHEN cp.company_id != pl.company_id THEN 'EMPRESA_DIFERENTE'
    ELSE 'OK'
  END as status
FROM chemical_products cp
LEFT JOIN production_lines pl ON cp.production_line_id = pl.id
WHERE cp.active = true
  AND (
    cp.production_line_id IS NULL
    OR pl.id IS NULL
    OR cp.company_id != pl.company_id
  )
ORDER BY status, cp.company_id, cp.name;
