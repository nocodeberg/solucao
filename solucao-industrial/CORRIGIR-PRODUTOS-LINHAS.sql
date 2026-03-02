-- =====================================================
-- SCRIPT DEFINITIVO - PRODUTOS ESPECÍFICOS POR LINHA
-- Execute este SQL no Supabase SQL Editor
-- =====================================================
-- Este script:
-- 1. Remove produtos genéricos existentes
-- 2. Insere produtos específicos para cada tipo de linha
-- 3. Verifica o resultado
-- =====================================================

-- =====================================================
-- PASSO 1: LIMPAR PRODUTOS EXISTENTES (OPCIONAL)
-- =====================================================
-- ATENÇÃO: Descomente APENAS se quiser recomeçar do zero

-- DELETE FROM chemical_product_launches WHERE TRUE;
-- DELETE FROM chemical_products WHERE TRUE;

-- =====================================================
-- PASSO 2: INSERIR PRODUTOS ESPECÍFICOS POR TIPO DE LINHA
-- =====================================================

-- ============================================
-- LINHAS DE COBRE (ex: "Cobre Ácido")
-- ============================================

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
    -- Pré-tratamento
    ('SODA CÁUSTICA', 10.00, 'kg'),
    ('DESENGRAXANTE ALCALINO', 12.00, 'kg'),
    ('ÁCIDO CLORÍDRICO 30%', 8.00, 'L'),

    -- Decapagem
    ('ÁCIDO SULFÚRICO 50%', 15.00, 'L'),
    ('INIBIDOR DE CORROSÃO', 25.00, 'L'),

    -- Banho de Cobre
    ('SULFATO DE COBRE', 75.00, 'kg'),
    ('ÁCIDO SULFÚRICO 98%', 18.00, 'L'),
    ('BRILHANTE COBRE ÁCIDO', 120.00, 'L'),
    ('NIVELADOR COBRE', 150.00, 'L'),
    ('CLORETO DE SÓDIO', 5.00, 'kg'),

    -- Anodos e Ativação
    ('ANODO DE COBRE FOSFOROSO', 55.00, 'kg'),
    ('ATIVADOR ÁCIDO', 30.00, 'L')
) AS produto(name, price, unit)
WHERE pl.active = true
  AND UPPER(pl.name) LIKE '%COBRE%'
  AND NOT EXISTS (
    SELECT 1 FROM chemical_products cp
    WHERE cp.production_line_id = pl.id
      AND cp.name = produto.name
  );

-- ============================================
-- LINHAS DE NÍQUEL (ex: "Níquel Brilhante")
-- ============================================

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
    -- Pré-tratamento
    ('SODA CÁUSTICA', 10.00, 'kg'),
    ('DESENGRAXANTE ALCALINO', 12.00, 'kg'),
    ('ÁCIDO CLORÍDRICO 30%', 8.00, 'L'),
    ('ÁCIDO SULFÚRICO 50%', 15.00, 'L'),

    -- Banho de Níquel
    ('SULFATO DE NÍQUEL', 95.00, 'kg'),
    ('CLORETO DE NÍQUEL', 85.00, 'kg'),
    ('ÁCIDO BÓRICO', 20.00, 'kg'),
    ('BRILHANTE NÍQUEL PRIMÁRIO', 180.00, 'L'),
    ('BRILHANTE NÍQUEL SECUNDÁRIO', 200.00, 'L'),
    ('NIVELADOR NÍQUEL', 220.00, 'L'),
    ('UMECTANTE NÍQUEL', 45.00, 'L'),

    -- Anodos e Ativação
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

-- ============================================
-- LINHAS DE CROMO (ex: "Cromação")
-- ============================================

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
    -- Pré-tratamento
    ('SODA CÁUSTICA', 10.00, 'kg'),
    ('DESENGRAXANTE ALCALINO', 12.00, 'kg'),
    ('ÁCIDO CLORÍDRICO 30%', 8.00, 'L'),

    -- Banho de Cromo
    ('ÁCIDO CRÔMICO', 180.00, 'kg'),
    ('ÁCIDO SULFÚRICO 98%', 18.00, 'L'),
    ('CATALISADOR CROMO', 250.00, 'L'),

    -- Ativação
    ('ATIVADOR ÁCIDO', 30.00, 'L')
) AS produto(name, price, unit)
WHERE pl.active = true
  AND UPPER(pl.name) LIKE '%CROMO%'
  AND NOT EXISTS (
    SELECT 1 FROM chemical_products cp
    WHERE cp.production_line_id = pl.id
      AND cp.name = produto.name
  );

-- ============================================
-- LINHAS DE ZINCO
-- ============================================

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
    -- Pré-tratamento
    ('SODA CÁUSTICA', 10.00, 'kg'),
    ('DESENGRAXANTE ALCALINO', 12.00, 'kg'),
    ('ÁCIDO CLORÍDRICO 30%', 8.00, 'L'),

    -- Banho de Zinco
    ('ÓXIDO DE ZINCO', 45.00, 'kg'),
    ('HIDRÓXIDO DE SÓDIO', 8.00, 'kg'),
    ('BRILHANTE ZINCO', 120.00, 'L'),

    -- Anodos
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

-- ============================================
-- OUTRAS LINHAS (genérico)
-- ============================================

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
    ('PRODUTO QUÍMICO GENÉRICO', 20.00, 'kg')
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
-- PASSO 3: VERIFICAR RESULTADOS
-- =====================================================

-- Resumo: Quantos produtos por linha
SELECT
  pl.name as linha,
  COUNT(cp.id) as total_produtos
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
  cp.unit as unidade
FROM production_lines pl
JOIN chemical_products cp ON cp.production_line_id = pl.id
WHERE pl.active = true AND cp.active = true
ORDER BY pl.name, cp.name;

-- =====================================================
-- RESULTADO ESPERADO
-- =====================================================
-- Cada tipo de linha deve ter produtos DIFERENTES:
--
-- Cobre Ácido       → 12 produtos específicos (SULFATO DE COBRE, BRILHANTE COBRE, etc)
-- Níquel Brilhante  → 13 produtos específicos (SULFATO DE NÍQUEL, BRILHANTE NÍQUEL, etc)
-- Cromação          → 7 produtos específicos (ÁCIDO CRÔMICO, CATALISADOR CROMO, etc)
-- Zinco             → 8 produtos específicos (ÓXIDO DE ZINCO, BRILHANTE ZINCO, etc)
-- Outras            → 5 produtos genéricos
--
-- IMPORTANTE: Alguns produtos podem aparecer em várias linhas
-- (ex: SODA CÁUSTICA é usada em todas)
-- Isso está CORRETO e é esperado!
-- =====================================================
