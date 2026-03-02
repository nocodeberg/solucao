-- =====================================================
-- INSERIR PRODUTOS QUÍMICOS AUTOMATICAMENTE V2
-- Execute este SQL no Supabase SQL Editor
-- =====================================================
-- Este script identifica o tipo de linha pelo NOME
-- e insere produtos específicos automaticamente
-- =====================================================

-- =====================================================
-- PRODUTOS PARA LINHAS DE COBRE (contém "COBRE" no nome)
-- =====================================================

INSERT INTO chemical_products (company_id, production_line_id, name, unit_price, unit, active)
SELECT
  pl.company_id,
  pl.id,
  produto.name,
  produto.price,
  produto.unit,
  true
FROM production_lines pl
CROSS JOIN (
  VALUES
    ('SODA CÁUSTICA', 10.00, 'kg'),
    ('DESENGRAXANTE ALCALINO', 12.00, 'kg'),
    ('ÁCIDO CLORÍDRICO 30%', 8.00, 'L'),
    ('ÁCIDO SULFÚRICO 50%', 15.00, 'L'),
    ('SULFATO DE COBRE', 75.00, 'kg'),
    ('ÁCIDO SULFÚRICO 98%', 18.00, 'L'),
    ('BRILHANTE COBRE ÁCIDO', 120.00, 'L'),
    ('NIVELADOR COBRE', 150.00, 'L'),
    ('ANODO DE COBRE', 55.00, 'kg'),
    ('ATIVADOR ÁCIDO', 30.00, 'L'),
    ('INIBIDOR DE CORROSÃO', 25.00, 'L')
) AS produto(name, price, unit)
WHERE pl.active = true
  AND UPPER(pl.name) LIKE '%COBRE%'
  AND NOT EXISTS (
    SELECT 1 FROM chemical_products cp
    WHERE cp.production_line_id = pl.id
      AND cp.name = produto.name
  );

-- =====================================================
-- PRODUTOS PARA LINHAS DE NÍQUEL (contém "NIQUEL" no nome)
-- =====================================================

INSERT INTO chemical_products (company_id, production_line_id, name, unit_price, unit, active)
SELECT
  pl.company_id,
  pl.id,
  produto.name,
  produto.price,
  produto.unit,
  true
FROM production_lines pl
CROSS JOIN (
  VALUES
    ('SODA CÁUSTICA', 10.00, 'kg'),
    ('DESENGRAXANTE ALCALINO', 12.00, 'kg'),
    ('ÁCIDO CLORÍDRICO 30%', 8.00, 'L'),
    ('ÁCIDO SULFÚRICO 50%', 15.00, 'L'),
    ('SULFATO DE NÍQUEL', 95.00, 'kg'),
    ('CLORETO DE NÍQUEL', 85.00, 'kg'),
    ('ÁCIDO BÓRICO', 20.00, 'kg'),
    ('BRILHANTE NÍQUEL PRIMÁRIO', 180.00, 'L'),
    ('BRILHANTE NÍQUEL SECUNDÁRIO', 200.00, 'L'),
    ('NIVELADOR NÍQUEL', 220.00, 'L'),
    ('ANODO DE NÍQUEL', 120.00, 'kg'),
    ('ATIVADOR ÁCIDO', 30.00, 'L')
) AS produto(name, price, unit)
WHERE pl.active = true
  AND (UPPER(pl.name) LIKE '%NIQUEL%' OR UPPER(pl.name) LIKE '%NÍQUEL%')
  AND NOT EXISTS (
    SELECT 1 FROM chemical_products cp
    WHERE cp.production_line_id = pl.id
      AND cp.name = produto.name
  );

-- =====================================================
-- PRODUTOS PARA LINHAS DE CROMO (contém "CROMO" no nome)
-- =====================================================

INSERT INTO chemical_products (company_id, production_line_id, name, unit_price, unit, active)
SELECT
  pl.company_id,
  pl.id,
  produto.name,
  produto.price,
  produto.unit,
  true
FROM production_lines pl
CROSS JOIN (
  VALUES
    ('SODA CÁUSTICA', 10.00, 'kg'),
    ('DESENGRAXANTE ALCALINO', 12.00, 'kg'),
    ('ÁCIDO CLORÍDRICO 30%', 8.00, 'L'),
    ('ÁCIDO CRÔMICO', 180.00, 'kg'),
    ('ÁCIDO SULFÚRICO 98%', 18.00, 'L'),
    ('CATALISADOR CROMO', 250.00, 'L'),
    ('ATIVADOR ÁCIDO', 30.00, 'L')
) AS produto(name, price, unit)
WHERE pl.active = true
  AND UPPER(pl.name) LIKE '%CROMO%'
  AND NOT EXISTS (
    SELECT 1 FROM chemical_products cp
    WHERE cp.production_line_id = pl.id
      AND cp.name = produto.name
  );

-- =====================================================
-- PRODUTOS PARA LINHAS DE ZINCO (contém "ZINCO" no nome)
-- =====================================================

INSERT INTO chemical_products (company_id, production_line_id, name, unit_price, unit, active)
SELECT
  pl.company_id,
  pl.id,
  produto.name,
  produto.price,
  produto.unit,
  true
FROM production_lines pl
CROSS JOIN (
  VALUES
    ('SODA CÁUSTICA', 10.00, 'kg'),
    ('DESENGRAXANTE ALCALINO', 12.00, 'kg'),
    ('ÁCIDO CLORÍDRICO 30%', 8.00, 'L'),
    ('ÓXIDO DE ZINCO', 45.00, 'kg'),
    ('HIDRÓXIDO DE SÓDIO', 8.00, 'kg'),
    ('BRILHANTE ZINCO', 120.00, 'L'),
    ('ANODO DE ZINCO', 35.00, 'kg'),
    ('ATIVADOR ÁCIDO', 30.00, 'L')
) AS produto(name, price, unit)
WHERE pl.active = true
  AND UPPER(pl.name) LIKE '%ZINCO%'
  AND NOT EXISTS (
    SELECT 1 FROM chemical_products cp
    WHERE cp.production_line_id = pl.id
      AND cp.name = produto.name
  );

-- =====================================================
-- PRODUTOS GENÉRICOS (para linhas que não correspondem aos padrões acima)
-- =====================================================

INSERT INTO chemical_products (company_id, production_line_id, name, unit_price, unit, active)
SELECT
  pl.company_id,
  pl.id,
  produto.name,
  produto.price,
  produto.unit,
  true
FROM production_lines pl
CROSS JOIN (
  VALUES
    ('SODA CÁUSTICA', 10.00, 'kg'),
    ('DESENGRAXANTE ALCALINO', 12.00, 'kg'),
    ('ÁCIDO CLORÍDRICO', 8.00, 'L'),
    ('ÁCIDO SULFÚRICO', 15.00, 'L'),
    ('PRODUTO QUÍMICO A', 20.00, 'kg'),
    ('PRODUTO QUÍMICO B', 25.00, 'L'),
    ('ATIVADOR', 30.00, 'L')
) AS produto(name, price, unit)
WHERE pl.active = true
  AND pl.line_type = 'GALVANOPLASTIA'
  AND UPPER(pl.name) NOT LIKE '%COBRE%'
  AND UPPER(pl.name) NOT LIKE '%NIQUEL%'
  AND UPPER(pl.name) NOT LIKE '%NÍQUEL%'
  AND UPPER(pl.name) NOT LIKE '%CROMO%'
  AND UPPER(pl.name) NOT LIKE '%ZINCO%'
  AND NOT EXISTS (
    SELECT 1 FROM chemical_products cp
    WHERE cp.production_line_id = pl.id
      AND cp.name = produto.name
  );

-- =====================================================
-- VERIFICAR RESULTADOS
-- =====================================================

SELECT
  pl.name as linha,
  COUNT(cp.id) as total_produtos,
  STRING_AGG(cp.name, ', ' ORDER BY cp.name) as produtos
FROM production_lines pl
LEFT JOIN chemical_products cp ON cp.production_line_id = pl.id AND cp.active = true
WHERE pl.active = true
GROUP BY pl.id, pl.name
ORDER BY pl.name;

-- Detalhamento completo
SELECT
  pl.name as linha,
  cp.name as produto,
  cp.unit_price as preco,
  cp.unit as unidade,
  cp.active as ativo
FROM chemical_products cp
JOIN production_lines pl ON cp.production_line_id = pl.id
WHERE pl.active = true AND cp.active = true
ORDER BY pl.name, cp.name;

-- =====================================================
-- RESULTADO ESPERADO
-- =====================================================
-- Cada linha deve ter seus produtos específicos:
--
-- Cobre Ácido       → 11 produtos (SODA, SULFATO DE COBRE, BRILHANTE COBRE, etc)
-- Níquel Brilhante  → 12 produtos (SODA, SULFATO DE NÍQUEL, BRILHANTE NÍQUEL, etc)
-- Cromação          → 7 produtos (SODA, ÁCIDO CRÔMICO, CATALISADOR CROMO, etc)
-- Outros            → 7 produtos genéricos
--
-- =====================================================
