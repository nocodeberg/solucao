-- =====================================================
-- CORRIGIR VÍNCULO DE PRODUTOS QUÍMICOS COM LINHAS
-- Execute este SQL para corrigir o problema de produtos
-- appearing em todas as linhas em vez de aparecerem
-- apenas na linha correta
-- =====================================================

-- PASSO 1: Verificar estado atual dos produtos
SELECT 
  'ESTADO ATUAL' as info,
  cp.id,
  cp.name,
  cp.company_id,
  cp.production_line_id,
  pl.name as linha_nome,
  CASE 
    WHEN cp.production_line_id IS NULL THEN 'SEM LINHA'
    ELSE 'COM LINHA'
  END as status
FROM chemical_products cp
LEFT JOIN production_lines pl ON cp.production_line_id = pl.id
WHERE cp.active = true
ORDER BY cp.company_id, pl.name, cp.name;

-- PASSO 2: Verificar linhas disponíveis por empresa
SELECT 
  'LINHAS POR EMPRESA' as info,
  pl.id,
  pl.name,
  pl.company_id,
  pl.active,
  COUNT(cp.id) as produtos_vinculados
FROM production_lines pl
LEFT JOIN chemical_products cp ON pl.id = cp.production_line_id AND cp.active = true
WHERE pl.active = true
GROUP BY pl.id, pl.name, pl.company_id, pl.active
ORDER BY pl.company_id, pl.name;

-- PASSO 3: Vincular produtos sem linha à primeira linha da mesma empresa
UPDATE chemical_products cp
SET production_line_id = (
  SELECT sub.id
  FROM (
    SELECT pl.id
    FROM production_lines pl
    WHERE pl.company_id = cp.company_id
      AND pl.active = true
    ORDER BY pl.created_at ASC
    LIMIT 1
  ) sub
)
WHERE cp.production_line_id IS NULL
  AND cp.active = true
  AND EXISTS (
    SELECT 1
    FROM production_lines pl
    WHERE pl.company_id = cp.company_id
      AND pl.active = true
  );

-- PASSO 4: Verificar resultado após a correção
SELECT 
  'RESULTADO APÓS CORREÇÃO' as info,
  cp.id,
  cp.name,
  cp.company_id,
  cp.production_line_id,
  pl.name as linha_nome,
  CASE 
    WHEN cp.production_line_id IS NULL THEN 'SEM LINHA'
    ELSE 'COM LINHA'
  END as status
FROM chemical_products cp
LEFT JOIN production_lines pl ON cp.production_line_id = pl.id
WHERE cp.active = true
ORDER BY cp.company_id, pl.name, cp.name;

-- PASSO 5: Resumo final por linha
SELECT 
  'RESUMO FINAL' as info,
  pl.name as linha,
  pl.company_id,
  COUNT(cp.id) as total_produtos,
  STRING_AGG(cp.name, ', ' ORDER BY cp.name) as produtos_lista
FROM production_lines pl
LEFT JOIN chemical_products cp ON pl.id = cp.production_line_id AND cp.active = true
WHERE pl.active = true
GROUP BY pl.id, pl.name, pl.company_id
ORDER BY pl.company_id, pl.name;
