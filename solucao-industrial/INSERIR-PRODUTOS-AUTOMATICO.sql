-- =====================================================
-- INSERIR PRODUTOS QUÍMICOS AUTOMATICAMENTE
-- =====================================================
-- Este script insere produtos para TODAS as linhas da empresa atual

-- =====================================================
-- PASSO 1: Ver suas linhas de produção
-- =====================================================
SELECT
  id as line_id,
  name as line_name,
  line_type,
  company_id
FROM production_lines
WHERE active = true
ORDER BY name;

-- =====================================================
-- PASSO 2: Inserir produtos para uma linha específica
-- =====================================================
-- Copie o line_id da linha que você quer e execute:

-- Para GALVANOPLASTIA:
INSERT INTO chemical_products (company_id, production_line_id, name, unit_price, unit, active)
SELECT
  pl.company_id,
  pl.id,
  produto.name,
  produto.price,
  'kg',
  true
FROM production_lines pl
CROSS JOIN (
  VALUES
    ('SODA', 10.00),
    ('ACTIVE ZMC', 10.00),
    ('COMPOSTO C-10', 10.00),
    ('METAL CLEAN FE 05', 10.00),
    ('METAL CLEAN 7E_F', 10.00),
    ('ÁCIDO SULFÚRICO', 15.00),
    ('ANODO DE COBRE', 50.00),
    ('SULFATO DE COBRE', 75.00),
    ('MC COPPER EVOLUTION M.U', 13.00),
    ('MC COPPER EVOLUTION PARTE A', 10.00),
    ('MC COPPER EVOLUTION PARTE B', 7.00),
    ('MC COPPER EVOLUTION UMECTANTE', 10.00)
) AS produto(name, price)
WHERE pl.id = 'COLE_O_LINE_ID_AQUI'  -- ← SUBSTITUA pelo ID da linha
  AND pl.line_type = 'GALVANOPLASTIA'
ON CONFLICT DO NOTHING;

-- =====================================================
-- PASSO 3: OU inserir para TODAS as linhas de GALVANOPLASTIA
-- =====================================================
-- Execute este para adicionar em todas as linhas de galvanoplastia:

INSERT INTO chemical_products (company_id, production_line_id, name, unit_price, unit, active)
SELECT
  pl.company_id,
  pl.id,
  produto.name,
  produto.price,
  'kg',
  true
FROM production_lines pl
CROSS JOIN (
  VALUES
    ('SODA', 10.00),
    ('ACTIVE ZMC', 10.00),
    ('COMPOSTO C-10', 10.00),
    ('METAL CLEAN FE 05', 10.00),
    ('METAL CLEAN 7E_F', 10.00),
    ('ÁCIDO SULFÚRICO', 15.00),
    ('ANODO DE COBRE', 50.00),
    ('SULFATO DE COBRE', 75.00),
    ('MC COPPER EVOLUTION M.U', 13.00),
    ('MC COPPER EVOLUTION PARTE A', 10.00),
    ('MC COPPER EVOLUTION PARTE B', 7.00),
    ('MC COPPER EVOLUTION UMECTANTE', 10.00)
) AS produto(name, price)
WHERE pl.line_type = 'GALVANOPLASTIA'
  AND pl.active = true
ON CONFLICT DO NOTHING;

-- =====================================================
-- PASSO 4: Para linhas de VERNIZ
-- =====================================================
INSERT INTO chemical_products (company_id, production_line_id, name, unit_price, unit, active)
SELECT
  pl.company_id,
  pl.id,
  produto.name,
  produto.price,
  'kg',
  true
FROM production_lines pl
CROSS JOIN (
  VALUES
    ('VERNIZ BASE', 25.00),
    ('SOLVENTE THINNER', 8.00),
    ('CATALISADOR', 15.00),
    ('DESENGRAXANTE', 12.00)
) AS produto(name, price)
WHERE pl.line_type = 'VERNIZ'
  AND pl.active = true
ON CONFLICT DO NOTHING;

-- =====================================================
-- PASSO 5: Verificar produtos inseridos
-- =====================================================
SELECT
  pl.name as linha,
  pl.line_type as tipo,
  cp.name as produto,
  cp.unit_price as preco,
  cp.active as ativo
FROM chemical_products cp
JOIN production_lines pl ON cp.production_line_id = pl.id
ORDER BY pl.name, cp.name;

-- =====================================================
-- PASSO 6: Contar produtos por linha
-- =====================================================
SELECT
  pl.name as linha,
  pl.line_type as tipo,
  COUNT(cp.id) as total_produtos
FROM production_lines pl
LEFT JOIN chemical_products cp ON cp.production_line_id = pl.id
WHERE pl.active = true
GROUP BY pl.id, pl.name, pl.line_type
ORDER BY pl.name;
