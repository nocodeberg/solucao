-- =====================================================
-- PRODUTOS QUÍMICOS ESPECÍFICOS POR LINHA
-- Execute este SQL no Supabase SQL Editor
-- =====================================================
-- Cada linha terá produtos completamente diferentes
-- com nomes e valores únicos
-- =====================================================

-- =====================================================
-- OPCIONAL: LIMPAR PRODUTOS EXISTENTES
-- =====================================================
-- Descomente as linhas abaixo apenas se quiser recomeçar do zero

-- DELETE FROM chemical_product_launches WHERE TRUE;
-- DELETE FROM chemical_products WHERE TRUE;

-- =====================================================
-- LINHA: COBRE ÁCIDO
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
    -- Desengraxe Cobre Ácido
    ('SODA LÍQUIDA 50% - DESENGRAXE COBRE', 8.50, 'L'),
    ('DESENGRAXANTE NEUTRO COBRE TECH', 15.20, 'kg'),
    ('SURFACTANTE COPPER CLEAN', 22.80, 'L'),

    -- Decapagem Cobre Ácido
    ('ÁCIDO SULFÚRICO TÉCNICO 93%', 12.40, 'L'),
    ('ÁCIDO CLORÍDRICO FUMANTE 37%', 9.80, 'L'),
    ('INIBIDOR COPPER GUARD 200', 28.50, 'L'),
    ('ANTI-ESPUMANTE COBRE AC-45', 32.00, 'kg'),

    -- Banho de Cobre Ácido
    ('SULFATO DE COBRE PENTAHIDRATADO', 68.90, 'kg'),
    ('ÁCIDO SULFÚRICO ELETRÔNICO 98%', 16.70, 'L'),
    ('BRILHANTE PRIMÁRIO COPPER SHINE A', 145.00, 'L'),
    ('BRILHANTE SECUNDÁRIO COPPER SHINE B', 165.00, 'L'),
    ('NIVELADOR MASTER COPPER PLUS', 185.50, 'L'),
    ('UMECTANTE COPPER WETTING AGENT', 42.30, 'L'),
    ('CLORETO DE SÓDIO PURIFICADO', 4.80, 'kg'),

    -- Anodos e Aditivos
    ('ANODO COBRE FOSFOROSO 0,04%', 58.20, 'kg'),
    ('ATIVADOR ÁCIDO COPPER PRE-TREAT', 34.50, 'L'),
    ('SEQUESTRANTE COPPER STABILIZER', 56.00, 'kg')
) AS produto(name, price, unit)
WHERE pl.active = true
  AND UPPER(pl.name) LIKE '%COBRE%ÁCIDO%'
  AND NOT EXISTS (
    SELECT 1 FROM chemical_products cp
    WHERE cp.production_line_id = pl.id AND cp.name = produto.name
  );

-- =====================================================
-- LINHA: COBRE ALCALINO (se houver)
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
    -- Desengraxe Cobre Alcalino
    ('SODA CÁUSTICA ESCAMAS 98%', 7.20, 'kg'),
    ('DESENGRAXANTE ALCALINO FORTE DA-500', 18.90, 'kg'),

    -- Banho Cobre Alcalino
    ('SULFATO DE COBRE CRISTALIZADO', 72.50, 'kg'),
    ('CARBONATO DE SÓDIO ANIDRO', 6.30, 'kg'),
    ('HIDRÓXIDO DE SÓDIO LÍQUIDO 50%', 5.80, 'L'),
    ('BRILHANTE ALCALINO COPPER BRIGHT', 138.00, 'L'),
    ('ESTABILIZADOR ALKALINE COPPER STB', 95.00, 'L'),
    ('QUELANTE COPPER CHELATOR X-100', 78.50, 'kg'),

    -- Anodos
    ('ANODO COBRE ELETROLÍTICO 99,9%', 52.00, 'kg')
) AS produto(name, price, unit)
WHERE pl.active = true
  AND UPPER(pl.name) LIKE '%COBRE%'
  AND UPPER(pl.name) LIKE '%ALCALIN%'
  AND NOT EXISTS (
    SELECT 1 FROM chemical_products cp
    WHERE cp.production_line_id = pl.id AND cp.name = produto.name
  );

-- =====================================================
-- LINHA: NÍQUEL BRILHANTE
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
    -- Desengraxe Níquel
    ('SODA COMERCIAL LÍQUIDA 48%', 9.10, 'L'),
    ('DESENGRAXANTE SUPER NICKEL CLEANER', 21.40, 'kg'),
    ('TENSOATIVO NICKEL SURF PRO', 38.60, 'L'),

    -- Decapagem Níquel
    ('ÁCIDO SULFÚRICO CONCENTRADO 96%', 14.20, 'L'),
    ('ÁCIDO CLORÍDRICO PURO 36%', 10.50, 'L'),
    ('INIBIDOR NICKEL PROTECT 350', 45.80, 'L'),

    -- Banho de Níquel Brilhante
    ('SULFATO DE NÍQUEL HEXAHIDRATADO', 112.00, 'kg'),
    ('CLORETO DE NÍQUEL HEXAHIDRATADO', 98.50, 'kg'),
    ('ÁCIDO BÓRICO CRISTALIZADO', 18.30, 'kg'),
    ('BRILHANTE PRIMÁRIO NICKEL BRIGHT A', 225.00, 'L'),
    ('BRILHANTE SECUNDÁRIO NICKEL BRIGHT B', 265.00, 'L'),
    ('NIVELADOR PREMIUM NICKEL LEVEL', 298.00, 'L'),
    ('UMECTANTE NICKEL WETTING PRO', 52.70, 'L'),
    ('AGENTE ANTI-PIT NICKEL SMOOTH', 88.00, 'kg'),

    -- Anodos e Aditivos
    ('ANODO NÍQUEL ELETROLÍTICO S-ROUND', 135.00, 'kg'),
    ('ATIVADOR NÍQUEL PRE-PLATE', 42.00, 'L'),
    ('ESTABILIZADOR NICKEL STABILIZER XL', 76.50, 'kg')
) AS produto(name, price, unit)
WHERE pl.active = true
  AND (UPPER(pl.name) LIKE '%NÍQUEL%' OR UPPER(pl.name) LIKE '%NIQUEL%')
  AND UPPER(pl.name) LIKE '%BRILHANTE%'
  AND NOT EXISTS (
    SELECT 1 FROM chemical_products cp
    WHERE cp.production_line_id = pl.id AND cp.name = produto.name
  );

-- =====================================================
-- LINHA: NÍQUEL SEMI-BRILHANTE
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
    -- Desengraxe
    ('SODA INDUSTRIAL 45%', 8.80, 'L'),
    ('DESENGRAXANTE NEUTRO NICKEL DG-200', 19.50, 'kg'),

    -- Banho Níquel Semi-Brilhante
    ('SULFATO DE NÍQUEL GRAU A', 108.00, 'kg'),
    ('CLORETO DE NÍQUEL PADRÃO', 94.00, 'kg'),
    ('ÁCIDO BÓRICO TÉCNICO', 16.80, 'kg'),
    ('ADITIVO SEMI-BRILHANTE NICKEL SB-1', 185.00, 'L'),
    ('SELANTE POROS NICKEL SEAL', 125.00, 'L'),

    -- Anodos
    ('ANODO NÍQUEL TIPO S REDONDO', 128.00, 'kg')
) AS produto(name, price, unit)
WHERE pl.active = true
  AND (UPPER(pl.name) LIKE '%NÍQUEL%' OR UPPER(pl.name) LIKE '%NIQUEL%')
  AND UPPER(pl.name) LIKE '%SEMI%'
  AND NOT EXISTS (
    SELECT 1 FROM chemical_products cp
    WHERE cp.production_line_id = pl.id AND cp.name = produto.name
  );

-- =====================================================
-- LINHA: CROMAÇÃO / CROMO DECORATIVO
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
    -- Desengraxe Cromo
    ('SODA ESPECIAL CROMO 50%', 10.20, 'L'),
    ('DESENGRAXANTE CHROME CLEANER PRO', 24.80, 'kg'),

    -- Decapagem
    ('ÁCIDO SULFÚRICO ESPECIAL 95%', 15.60, 'L'),
    ('ÁCIDO CLORÍDRICO EXTRA PURO 38%', 11.30, 'L'),

    -- Banho de Cromo
    ('ÁCIDO CRÔMICO CRISTALIZADO', 198.00, 'kg'),
    ('ÁCIDO SULFÚRICO FUMANTE 98%', 19.50, 'L'),
    ('CATALISADOR CHROME CATALYST PRO', 285.00, 'L'),
    ('ADITIVO FLUORADO CHROME FLUOR-X', 342.00, 'L'),
    ('REGULADOR CROMO RATIO CONTROL', 156.00, 'kg'),

    -- Ativação
    ('ATIVADOR CROMO ULTRA ACTIVE', 48.50, 'L'),
    ('NEUTRALIZADOR CHROME NEUTRAL', 38.00, 'L')
) AS produto(name, price, unit)
WHERE pl.active = true
  AND UPPER(pl.name) LIKE '%CROMO%'
  AND NOT EXISTS (
    SELECT 1 FROM chemical_products cp
    WHERE cp.production_line_id = pl.id AND cp.name = produto.name
  );

-- =====================================================
-- LINHA: ZINCO ALCALINO
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
    -- Desengraxe Zinco
    ('SODA LÍQUIDA ZINCO 45%', 7.90, 'L'),
    ('DESENGRAXANTE ALCALINO ZINC CLEAN', 16.50, 'kg'),

    -- Banho de Zinco Alcalino
    ('ÓXIDO DE ZINCO ESPECIAL', 52.00, 'kg'),
    ('HIDRÓXIDO DE SÓDIO PEROLAS 99%', 9.20, 'kg'),
    ('BRILHANTE ZINCO ZINC BRIGHT A', 142.00, 'L'),
    ('BRILHANTE ZINCO ZINC BRIGHT B', 158.00, 'L'),
    ('ADITIVO NIVELADOR ZINC LEVEL', 95.00, 'L'),
    ('QUELANTE ZINC CHELATOR 400', 68.00, 'kg'),

    -- Anodos
    ('ANODO ZINCO PURO 99,99%', 38.50, 'kg'),
    ('ATIVADOR ZINCO PRE-COAT', 32.00, 'L')
) AS produto(name, price, unit)
WHERE pl.active = true
  AND UPPER(pl.name) LIKE '%ZINCO%'
  AND NOT EXISTS (
    SELECT 1 FROM chemical_products cp
    WHERE cp.production_line_id = pl.id AND cp.name = produto.name
  );

-- =====================================================
-- LINHA: ZINCAGEM ÁCIDA
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
    -- Desengraxe
    ('DESENGRAXANTE ÁCIDO ZINC ACID DG', 14.80, 'kg'),

    -- Banho Zinco Ácido
    ('CLORETO DE ZINCO ANIDRO', 48.00, 'kg'),
    ('CLORETO DE POTÁSSIO PURO', 12.50, 'kg'),
    ('ÁCIDO BÓRICO ESPECIAL ZINCO', 19.80, 'kg'),
    ('BRILHANTE ÁCIDO ZINC BRIGHT ACID', 168.00, 'L'),
    ('NIVELADOR ZINC ACID LEVEL', 195.00, 'L'),

    -- Anodos
    ('ANODO ZINCO ÁCIDO HIGH PURITY', 42.00, 'kg')
) AS produto(name, price, unit)
WHERE pl.active = true
  AND UPPER(pl.name) LIKE '%ZINCAGEM%'
  AND UPPER(pl.name) LIKE '%ÁCIDA%'
  AND NOT EXISTS (
    SELECT 1 FROM chemical_products cp
    WHERE cp.production_line_id = pl.id AND cp.name = produto.name
  );

-- =====================================================
-- LINHA: ESTANHAGEM
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
    -- Desengraxe Estanho
    ('SODA ESTANHO CLEANER 50%', 9.50, 'L'),
    ('DESENGRAXANTE NEUTRO TIN CLEAN', 22.00, 'kg'),

    -- Banho de Estanho
    ('SULFATO ESTANOSO CRISTALIZADO', 285.00, 'kg'),
    ('ÁCIDO SULFÚRICO ESTANHO 96%', 17.80, 'L'),
    ('BRILHANTE ESTANHO TIN BRIGHT PRO', 320.00, 'L'),
    ('ANTIOXIDANTE TIN PROTECT', 145.00, 'L'),
    ('ADITIVO NIVLEADOR TIN LEVEL', 245.00, 'L'),

    -- Anodos
    ('ANODO ESTANHO PURO 99,9%', 890.00, 'kg'),
    ('ATIVADOR TIN ACTIVATOR', 55.00, 'L')
) AS produto(name, price, unit)
WHERE pl.active = true
  AND (UPPER(pl.name) LIKE '%ESTANHO%' OR UPPER(pl.name) LIKE '%ESTANHAGEM%')
  AND NOT EXISTS (
    SELECT 1 FROM chemical_products cp
    WHERE cp.production_line_id = pl.id AND cp.name = produto.name
  );

-- =====================================================
-- LINHA: DOURAÇÃO / OURO
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
    -- Desengraxe Ouro
    ('DESENGRAXANTE ESPECIAL GOLD CLEAN', 45.00, 'kg'),

    -- Banho de Ouro
    ('SOLUÇÃO OURO 1g/L GOLD SOLUTION', 2850.00, 'L'),
    ('ESTABILIZADOR OURO GOLD STABILIZER', 485.00, 'L'),
    ('BRILHANTE OURO GOLD BRIGHT', 625.00, 'L'),
    ('ADITIVO COBERTURA GOLD COVERAGE', 520.00, 'L'),

    -- Ativação
    ('ATIVADOR OURO GOLD ACTIVATOR PRO', 95.00, 'L')
) AS produto(name, price, unit)
WHERE pl.active = true
  AND (UPPER(pl.name) LIKE '%OURO%' OR UPPER(pl.name) LIKE '%DOURAÇÃO%' OR UPPER(pl.name) LIKE '%DOURAÇÃO%')
  AND NOT EXISTS (
    SELECT 1 FROM chemical_products cp
    WHERE cp.production_line_id = pl.id AND cp.name = produto.name
  );

-- =====================================================
-- LINHA: OUTRAS LINHAS (GENÉRICO)
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
    ('DESENGRAXANTE UNIVERSAL MULTI-CLEAN', 18.50, 'kg'),
    ('SODA COMERCIAL 50%', 8.00, 'L'),
    ('ÁCIDO UNIVERSAL DECAPANTE', 13.50, 'L'),
    ('ATIVADOR GERAL MULTI-ACTIVE', 28.00, 'L'),
    ('PRODUTO QUÍMICO ESPECIAL A', 35.00, 'kg'),
    ('PRODUTO QUÍMICO ESPECIAL B', 42.00, 'L')
) AS produto(name, price, unit)
WHERE pl.active = true
  AND pl.line_type = 'GALVANOPLASTIA'
  AND UPPER(pl.name) NOT LIKE '%COBRE%'
  AND UPPER(pl.name) NOT LIKE '%NÍQUEL%'
  AND UPPER(pl.name) NOT LIKE '%NIQUEL%'
  AND UPPER(pl.name) NOT LIKE '%CROMO%'
  AND UPPER(pl.name) NOT LIKE '%ZINCO%'
  AND UPPER(pl.name) NOT LIKE '%ESTANHO%'
  AND UPPER(pl.name) NOT LIKE '%OURO%'
  AND NOT EXISTS (
    SELECT 1 FROM chemical_products cp
    WHERE cp.production_line_id = pl.id AND cp.name = produto.name
  );

-- =====================================================
-- VERIFICAR RESULTADOS
-- =====================================================

-- Resumo por linha
SELECT
  pl.name as linha,
  COUNT(cp.id) as total_produtos,
  ROUND(AVG(cp.unit_price)::numeric, 2) as preco_medio
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
-- Cada linha terá produtos COMPLETAMENTE DIFERENTES:
--
-- Cobre Ácido          → 17 produtos únicos
-- Níquel Brilhante     → 17 produtos únicos
-- Cromação             → 11 produtos únicos
-- Zinco Alcalino       → 10 produtos únicos
-- Estanhagem           → 9 produtos únicos
-- Douração             → 6 produtos únicos
-- etc.
--
-- Todos com nomes e valores diferentes!
-- =====================================================
