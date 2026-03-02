-- =====================================================
-- INSERIR PRODUTOS QUÍMICOS ESPECÍFICOS POR LINHA
-- Execute este SQL no Supabase SQL Editor
-- =====================================================

-- =====================================================
-- IMPORTANTE: Este script insere produtos específicos
-- baseados no NOME da linha de produção
-- =====================================================

-- =====================================================
-- PASSO 1: Ver suas linhas de produção
-- =====================================================
SELECT
  id,
  name,
  line_type,
  company_id
FROM production_lines
WHERE active = true
ORDER BY name;

-- =====================================================
-- PASSO 2: Para cada linha, copie o ID e execute o INSERT correspondente
-- =====================================================

-- =====================================================
-- EXEMPLO: LINHA "COBRE ÁCIDO"
-- =====================================================
-- Substitua 'SEU_LINE_ID_AQUI' pelo ID da linha Cobre Ácido

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
    -- Produtos de Desengraxe
    ('SODA CÁUSTICA', 10.00, 'kg'),
    ('DESENGRAXANTE ALCALINO', 12.00, 'kg'),

    -- Produtos de Decapagem
    ('ÁCIDO CLORÍDRICO 30%', 8.00, 'L'),
    ('ÁCIDO SULFÚRICO 50%', 15.00, 'L'),
    ('INIBIDOR DE CORROSÃO', 25.00, 'L'),

    -- Produtos do Banho de Cobre Ácido
    ('SULFATO DE COBRE', 75.00, 'kg'),
    ('ÁCIDO SULFÚRICO 98%', 18.00, 'L'),
    ('BRILHANTE COBRE ÁCIDO', 120.00, 'L'),
    ('NIVELADOR COBRE', 150.00, 'L'),
    ('CLORETO DE SÓDIO', 5.00, 'kg'),

    -- Anodos
    ('ANODO DE COBRE FOSFOROSO', 55.00, 'kg'),

    -- Produtos de Ativação
    ('ATIVADOR ÁCIDO', 30.00, 'L')
) AS produto(name, price, unit)
WHERE pl.id = 'SEU_LINE_ID_AQUI'  -- ← COLE O ID DA LINHA COBRE ÁCIDO
  AND NOT EXISTS (
    SELECT 1 FROM chemical_products cp
    WHERE cp.production_line_id = pl.id
      AND cp.name = produto.name
  );

-- =====================================================
-- EXEMPLO: LINHA "NÍQUEL BRILHANTE"
-- =====================================================
-- Substitua 'SEU_LINE_ID_AQUI' pelo ID da linha Níquel Brilhante

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
    -- Produtos de Desengraxe
    ('SODA CÁUSTICA', 10.00, 'kg'),
    ('DESENGRAXANTE ALCALINO', 12.00, 'kg'),

    -- Produtos de Decapagem
    ('ÁCIDO CLORÍDRICO 30%', 8.00, 'L'),
    ('ÁCIDO SULFÚRICO 50%', 15.00, 'L'),

    -- Produtos do Banho de Níquel
    ('SULFATO DE NÍQUEL', 95.00, 'kg'),
    ('CLORETO DE NÍQUEL', 85.00, 'kg'),
    ('ÁCIDO BÓRICO', 20.00, 'kg'),
    ('BRILHANTE NÍQUEL PRIMÁRIO', 180.00, 'L'),
    ('BRILHANTE NÍQUEL SECUNDÁRIO', 200.00, 'L'),
    ('NIVELADOR NÍQUEL', 220.00, 'L'),
    ('UMECTANTE NÍQUEL', 45.00, 'L'),

    -- Anodos
    ('ANODO DE NÍQUEL', 120.00, 'kg'),

    -- Produtos de Ativação
    ('ATIVADOR ÁCIDO', 30.00, 'L')
) AS produto(name, price, unit)
WHERE pl.id = 'SEU_LINE_ID_AQUI'  -- ← COLE O ID DA LINHA NÍQUEL BRILHANTE
  AND NOT EXISTS (
    SELECT 1 FROM chemical_products cp
    WHERE cp.production_line_id = pl.id
      AND cp.name = produto.name
  );

-- =====================================================
-- EXEMPLO: LINHA "CROMAÇÃO"
-- =====================================================
-- Substitua 'SEU_LINE_ID_AQUI' pelo ID da linha Cromação

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
    -- Produtos de Desengraxe
    ('SODA CÁUSTICA', 10.00, 'kg'),
    ('DESENGRAXANTE ALCALINO', 12.00, 'kg'),

    -- Produtos de Decapagem
    ('ÁCIDO CLORÍDRICO 30%', 8.00, 'L'),

    -- Produtos do Banho de Cromo
    ('ÁCIDO CRÔMICO', 180.00, 'kg'),
    ('ÁCIDO SULFÚRICO 98%', 18.00, 'L'),
    ('CATALISADOR CROMO', 250.00, 'L'),

    -- Produtos de Ativação
    ('ATIVADOR ÁCIDO', 30.00, 'L')
) AS produto(name, price, unit)
WHERE pl.id = 'SEU_LINE_ID_AQUI'  -- ← COLE O ID DA LINHA CROMAÇÃO
  AND NOT EXISTS (
    SELECT 1 FROM chemical_products cp
    WHERE cp.production_line_id = pl.id
      AND cp.name = produto.name
  );

-- =====================================================
-- VERIFICAR SE OS PRODUTOS FORAM INSERIDOS
-- =====================================================

SELECT
  pl.name as linha,
  cp.name as produto,
  cp.unit_price as preco,
  cp.unit as unidade,
  cp.active as ativo
FROM chemical_products cp
JOIN production_lines pl ON cp.production_line_id = pl.id
ORDER BY pl.name, cp.name;

-- =====================================================
-- INSTRUÇÕES DE USO
-- =====================================================
--
-- 1. Execute a query do PASSO 1 para ver suas linhas
-- 2. Copie o ID de cada linha
-- 3. Para cada linha, edite o INSERT correspondente:
--    - Cole o ID da linha no lugar de 'SEU_LINE_ID_AQUI'
--    - Ajuste os produtos e preços conforme necessário
--    - Execute o INSERT
-- 4. Execute a query de verificação final
--
-- DICA: Se quiser produtos personalizados para cada linha:
--    - Adicione/remova produtos da lista VALUES
--    - Mude os preços conforme sua realidade
--    - Mude as unidades (kg, L, unidade, etc)
--
-- =====================================================
