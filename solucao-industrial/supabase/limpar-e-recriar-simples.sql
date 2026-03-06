-- =====================================================
-- LIMPAR E RECRIR PRODUTOS - VERSÃO SIMPLES
-- Execute passo a passo
-- =====================================================

-- PASSO 1: Verificar suas linhas e company_ids
SELECT 
  'SUAS LINHAS ATIVAS' as info,
  id,
  name,
  company_id
FROM production_lines 
WHERE active = true
ORDER BY company_id, name;

-- PASSO 2: Verificar produtos atuais
SELECT 
  'SEUS PRODUTOS ATUAIS' as info,
  id,
  name,
  company_id,
  production_line_id
FROM chemical_products 
WHERE active = true
ORDER BY company_id, name;

-- PASSO 3: Apagar todos os produtos (soft delete)
UPDATE chemical_products 
SET active = false 
WHERE active = true;

-- PASSO 4: Recriar produtos para Cobre Ácido (ajuste o company_id!)
-- SUBSTITUA 'SEU_COMPANY_ID' pelo ID real da sua empresa
INSERT INTO chemical_products (name, unit_price, unit, company_id, production_line_id, active) 
SELECT 
  'BRILHANTE COBRE ÁCIDO' as name,
  22.80 as unit_price,
  'L' as unit,
  company_id,
  id as production_line_id,
  true as active
FROM production_lines 
WHERE name ILIKE '%cobre%acido%' AND active = true;

INSERT INTO chemical_products (name, unit_price, unit, company_id, production_line_id, active) 
SELECT 
  'ATIVADOR ÁCIDO' as name,
  15.60 as unit_price,
  'L' as unit,
  company_id,
  id as production_line_id,
  true as active
FROM production_lines 
WHERE name ILIKE '%cobre%acido%' AND active = true;

INSERT INTO chemical_products (name, unit_price, unit, company_id, production_line_id, active) 
SELECT 
  'ACIDO SULFURICO 98%' as name,
  8.90 as unit_price,
  'L' as unit,
  company_id,
  id as production_line_id,
  true as active
FROM production_lines 
WHERE name ILIKE '%cobre%acido%' AND active = true;

-- PASSO 5: Verificar resultado
SELECT 
  'PRODUTOS CRIADOS PARA COBRE ÁCIDO' as info,
  cp.name,
  cp.unit_price,
  pl.name as linha_nome
FROM chemical_products cp
INNER JOIN production_lines pl ON cp.production_line_id = pl.id
WHERE cp.active = true 
  AND pl.name ILIKE '%cobre%acido%'
ORDER BY cp.name;
