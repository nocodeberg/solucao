-- =====================================================
-- APAGAR E RECRIR PRODUTOS QUÍMICOS
-- Execute este SQL para limpar e recriar todos os produtos
-- =====================================================

-- 1. Backup dos produtos existentes (para referência)
SELECT 
  'BACKUP - PRODUTOS QUE SERÃO APAGADOS' as info,
  id,
  name,
  unit_price,
  unit,
  company_id,
  production_line_id
FROM chemical_products 
WHERE active = true
ORDER BY company_id, name;

-- 2. Apagar TODOS os produtos químicos (soft delete)
UPDATE chemical_products 
SET active = false 
WHERE active = true;

-- 3. Verificar que foram apagados
SELECT 
  'VERIFICAÇÃO - PRODUTOS APAGADOS' as info,
  COUNT(*) as total_apagados
FROM chemical_products 
WHERE active = false;

-- 4. Criar produtos específicos para cada linha
-- NOTA: Você precisará ajustar os company_ids conforme seu banco

-- Produtos para linha "Cobre Alcalino"
INSERT INTO chemical_products (name, unit_price, unit, company_id, production_line_id, active) VALUES
('BRILHANTE ALCALINO COPPER BRIGHT', 25.50, 'L', 'SEU_COMPANY_ID_AQUI', (SELECT id FROM production_lines WHERE name ILIKE '%cobre%alcalino%' AND active = true LIMIT 1), true),
('ATIVADOR ALCALINO', 18.75, 'L', 'SEU_COMPANY_ID_AQUI', (SELECT id FROM production_lines WHERE name ILIKE '%cobre%alcalino%' AND active = true LIMIT 1), true),
('CLEANER ALCALINO', 12.30, 'L', 'SEU_COMPANY_ID_AQUI', (SELECT id FROM production_lines WHERE name ILIKE '%cobre%alcalino%' AND active = true LIMIT 1), true);

-- Produtos para linha "Cobre Ácido"  
INSERT INTO chemical_products (name, unit_price, unit, company_id, production_line_id, active) VALUES
('BRILHANTE COBRE ÁCIDO', 22.80, 'L', 'SEU_COMPANY_ID_AQUI', (SELECT id FROM production_lines WHERE name ILIKE '%cobre%acido%' AND active = true LIMIT 1), true),
('ATIVADOR ÁCIDO', 15.60, 'L', 'SEU_COMPANY_ID_AQUI', (SELECT id FROM production_lines WHERE name ILIKE '%cobre%acido%' AND active = true LIMIT 1), true),
('ACIDO SULFURICO 98%', 8.90, 'L', 'SEU_COMPANY_ID_AQUI', (SELECT id FROM production_lines WHERE name ILIKE '%cobre%acido%' AND active = true LIMIT 1), true),
('ANODO COBRE ELETROLÍTICO 99,9%', 45.00, 'un', 'SEU_COMPANY_ID_AQUI', (SELECT id FROM production_lines WHERE name ILIKE '%cobre%acido%' AND active = true LIMIT 1), true);

-- Produtos para linha "Níquel"
INSERT INTO chemical_products (name, unit_price, unit, company_id, production_line_id, active) VALUES
('BRILHANTE NÍQUEL', 28.40, 'L', 'SEU_COMPANY_ID_AQUI', (SELECT id FROM production_lines WHERE name ILIKE '%niquel%' AND active = true LIMIT 1), true),
('ATIVADOR NÍQUEL', 19.20, 'L', 'SEU_COMPANY_ID_AQUI', (SELECT id FROM production_lines WHERE name ILIKE '%niquel%' AND active = true LIMIT 1), true),
('CLEANER NÍQUEL', 14.50, 'L', 'SEU_COMPANY_ID_AQUI', (SELECT id FROM production_lines WHERE name ILIKE '%niquel%' AND active = true LIMIT 1), true);

-- Produtos para linha "Zinco"
INSERT INTO chemical_products (name, unit_price, unit, company_id, production_line_id, active) VALUES
('BRILHANTE ZINCO', 20.30, 'L', 'SEU_COMPANY_ID_AQUI', (SELECT id FROM production_lines WHERE name ILIKE '%zinco%' AND active = true LIMIT 1), true),
('ATIVADOR ZINCO', 16.80, 'L', 'SEU_COMPANY_ID_AQUI', (SELECT id FROM production_lines WHERE name ILIKE '%zinco%' AND active = true LIMIT 1), true),
('ACTIVE ZMC', 32.50, 'kg', 'SEU_COMPANY_ID_AQUI', (SELECT id FROM production_lines WHERE name ILIKE '%zinco%' AND active = true LIMIT 1), true);

-- Produtos para linha "Cromo"
INSERT INTO chemical_products (name, unit_price, unit, company_id, production_line_id, active) VALUES
('BRILHANTE CROMO', 35.60, 'L', 'SEU_COMPANY_ID_AQUI', (SELECT id FROM production_lines WHERE name ILIKE '%cromo%' AND active = true LIMIT 1), true),
('ATIVADOR CROMO', 24.90, 'L', 'SEU_COMPANY_ID_AQUI', (SELECT id FROM production_lines WHERE name ILIKE '%cromo%' AND active = true LIMIT 1), true),
('CLEANER CROMO', 18.70, 'L', 'SEU_COMPANY_ID_AQUI', (SELECT id FROM production_lines WHERE name ILIKE '%cromo%' AND active = true LIMIT 1), true);

-- 5. Verificar produtos criados
SELECT 
  'PRODUTOS CRIADOS' as info,
  cp.name,
  cp.unit_price,
  cp.unit,
  pl.name as linha_nome,
  cp.company_id
FROM chemical_products cp
INNER JOIN production_lines pl ON cp.production_line_id = pl.id
WHERE cp.active = true
ORDER BY pl.name, cp.name;

-- 6. Resumo final
SELECT 
  'RESUMO FINAL' as info,
  pl.name as linha,
  COUNT(cp.id) as total_produtos
FROM production_lines pl
LEFT JOIN chemical_products cp ON pl.id = cp.production_line_id AND cp.active = true
WHERE pl.active = true
GROUP BY pl.id, pl.name
ORDER BY pl.name;
