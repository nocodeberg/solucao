-- =====================================================
-- CORREÇÃO IMEDIATA - VINCULAR PRODUTOS À LINHA COBRE ÁCIDO
-- Execute este SQL AGORA para corrigir o problema
-- =====================================================

-- 1. Primeiro, encontrar o ID da linha "Cobre Ácido"
WITH cobre_acido_line AS (
  SELECT id, company_id 
  FROM production_lines 
  WHERE name ILIKE '%cobre%acido%' OR name ILIKE '%cobre%acid%'
    AND active = true
  LIMIT 1
)

-- 2. Atualizar produtos que estão SEM LINHA para a linha "Cobre Ácido"
UPDATE chemical_products cp
SET production_line_id = (SELECT id FROM cobre_acido_line)
WHERE cp.production_line_id IS NULL
  AND cp.active = true
  AND EXISTS (
    SELECT 1 FROM cobre_acido_line WHERE company_id = cp.company_id
  );

-- 3. Verificar resultado
SELECT 
  'APÓS CORREÇÃO - PRODUTOS DA LINHA COBRE ÁCIDO' as info,
  cp.id,
  cp.name,
  cp.unit_price,
  cp.company_id
FROM chemical_products cp
INNER JOIN production_lines pl ON cp.production_line_id = pl.id
WHERE pl.name ILIKE '%cobre%acido%' OR pl.name ILIKE '%cobre%acid%'
  AND cp.active = true
  AND pl.active = true
ORDER BY cp.name;

-- 4. Verificar se ainda há produtos sem linha
SELECT 
  'PRODUTOS AINDA SEM LINHA' as info,
  cp.id,
  cp.name,
  cp.company_id
FROM chemical_products cp
WHERE cp.production_line_id IS NULL 
  AND cp.active = true;
