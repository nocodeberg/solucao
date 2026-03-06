-- =====================================================
-- EXECUTAR CORREÇÃO IMEDIATA
-- Copie e cole este SQL no Supabase SQL Editor
-- =====================================================

-- VERIFICAR ESTADO ATUAL
SELECT 
  'ANTES' as status,
  cp.id,
  cp.name,
  cp.company_id,
  cp.production_line_id,
  pl.name as linha_nome
FROM chemical_products cp
LEFT JOIN production_lines pl ON cp.production_line_id = pl.id
WHERE cp.active = true
ORDER BY cp.company_id, pl.name, cp.name;

-- CORRIGIR PRODUTOS SEM LINHA
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

-- VERIFICAR RESULTADO
SELECT 
  'DEPOIS' as status,
  cp.id,
  cp.name,
  cp.company_id,
  cp.production_line_id,
  pl.name as linha_nome
FROM chemical_products cp
LEFT JOIN production_lines pl ON cp.production_line_id = pl.id
WHERE cp.active = true
ORDER BY cp.company_id, pl.name, cp.name;

-- RESUMO FINAL
SELECT 
  'RESUMO' as info,
  pl.name as linha,
  COUNT(cp.id) as total_produtos,
  STRING_AGG(cp.name, ', ' ORDER BY cp.name) as produtos
FROM production_lines pl
LEFT JOIN chemical_products cp ON pl.id = cp.production_line_id AND cp.active = true
WHERE pl.active = true
GROUP BY pl.id, pl.name
ORDER BY pl.name;
