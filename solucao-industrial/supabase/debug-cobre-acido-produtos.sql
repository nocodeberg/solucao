-- =====================================================
-- DEBUG: Verificar produtos da linha Cobre Ácido
-- =====================================================

-- 1. Encontrar a linha "Cobre Ácido"
SELECT
  id,
  name,
  line_type,
  company_id,
  active
FROM production_lines
WHERE name ILIKE '%cobre%acid%' OR name ILIKE '%cobre%ácid%'
ORDER BY created_at DESC;

-- 2. Ver TODOS os produtos químicos (independente de linha)
SELECT
  id,
  name,
  production_line_id,
  company_id,
  unit_price,
  active,
  created_at
FROM chemical_products
ORDER BY created_at DESC
LIMIT 20;

-- 3. Ver produtos químicos COM production_line_id
SELECT
  cp.id,
  cp.name,
  cp.production_line_id,
  pl.name as linha_nome,
  cp.unit_price,
  cp.active
FROM chemical_products cp
LEFT JOIN production_lines pl ON cp.production_line_id = pl.id
WHERE cp.production_line_id IS NOT NULL
ORDER BY cp.created_at DESC;

-- 4. Ver produtos químicos SEM production_line_id
SELECT
  id,
  name,
  production_line_id,
  company_id,
  unit_price,
  active
FROM chemical_products
WHERE production_line_id IS NULL
ORDER BY created_at DESC;

-- 5. Procurar especificamente o produto "teste 003"
SELECT
  cp.id,
  cp.name,
  cp.production_line_id,
  pl.name as linha_nome,
  cp.company_id,
  cp.unit_price,
  cp.active
FROM chemical_products cp
LEFT JOIN production_lines pl ON cp.production_line_id = pl.id
WHERE cp.name ILIKE '%teste%003%' OR cp.name ILIKE '%teste 003%'
ORDER BY cp.created_at DESC;
