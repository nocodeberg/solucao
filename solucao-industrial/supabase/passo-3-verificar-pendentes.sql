-- =====================================================
-- PASSO 3: VERIFICAR SE AINDA HÁ PRODUTOS SEM LINHA
-- Execute APENAS este bloco após o Passo 2
-- =====================================================

SELECT
  cp.id,
  cp.name,
  cp.company_id,
  ''EMPRESA SEM LINHAS ATIVAS'' as problema
FROM chemical_products cp
WHERE cp.production_line_id IS NULL
  AND cp.active = true;
