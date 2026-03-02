-- =====================================================
-- VINCULAR PRODUTOS QUÍMICOS EXISTENTES A LINHAS
-- Execute este SQL no Supabase SQL Editor
-- =====================================================

-- PASSO 1: Verificar produtos sem linha
SELECT
  cp.id,
  cp.name,
  cp.company_id,
  cp.production_line_id,
  ''SEM LINHA'' as status
FROM chemical_products cp
WHERE cp.production_line_id IS NULL
  AND cp.active = true
ORDER BY cp.company_id, cp.name;

-- PASSO 2: Atualizar produtos sem linha para a primeira linha ativa da empresa
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

-- PASSO 3: Verificar produtos que ainda não têm linha
SELECT
  cp.id,
  cp.name,
  cp.company_id,
  ''EMPRESA SEM LINHAS ATIVAS'' as problema
FROM chemical_products cp
WHERE cp.production_line_id IS NULL
  AND cp.active = true;

-- PASSO 4: Resumo da vinculação
SELECT
  pl.name as linha,
  COUNT(cp.id) as total_produtos
FROM chemical_products cp
INNER JOIN production_lines pl ON cp.production_line_id = pl.id
WHERE cp.active = true
GROUP BY pl.name
ORDER BY pl.name;
