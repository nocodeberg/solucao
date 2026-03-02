-- =====================================================
-- INSERIR PRODUTOS QUÍMICOS PARA LINHA ESPECÍFICA
-- Execute este SQL no Supabase SQL Editor
-- =====================================================

-- =====================================================
-- PASSO 1: Verificar suas linhas de produção
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
-- PASSO 2: Copie o ID da linha que você quer e cole abaixo
-- =====================================================

-- INSTRUÇÕES:
-- 1. Execute o SELECT acima primeiro
-- 2. Copie o ID da linha "Cobre Ácido" (ou outra linha)
-- 3. Substitua 'SEU_LINE_ID_AQUI' pelo ID copiado
-- 4. Edite os produtos abaixo com os dados REAIS da sua linha
-- 5. Execute o INSERT

-- EXEMPLO DE PRODUTOS PARA LINHA DE COBRE ÁCIDO:
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
    -- Produtos de Pré-Tratamento
    ('SODA CÁUSTICA', 10.00, 'kg'),
    ('DESENGRAXANTE ALCALINO', 12.00, 'kg'),
    ('ÁCIDO CLORÍDRICO', 8.00, 'L'),
    ('ÁCIDO SULFÚRICO', 15.00, 'L'),

    -- Produtos de Cobre Ácido
    ('SULFATO DE COBRE', 75.00, 'kg'),
    ('ÁCIDO SULFÚRICO 98%', 18.00, 'L'),
    ('BRILHANTE COBRE ÁCIDO', 120.00, 'L'),
    ('NIVELADOR COBRE', 150.00, 'L'),
    ('ANODO DE COBRE', 50.00, 'kg'),

    -- Produtos de Acabamento
    ('ATIVADOR', 25.00, 'L'),
    ('SELANTE', 30.00, 'L')
) AS produto(name, price, unit)
WHERE pl.id = 'SEU_LINE_ID_AQUI'  -- ← COLE O ID DA LINHA AQUI
  AND NOT EXISTS (
    SELECT 1 FROM chemical_products cp
    WHERE cp.production_line_id = pl.id
      AND cp.name = produto.name
  );

-- =====================================================
-- PASSO 3: Verificar se os produtos foram inseridos
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
-- RESULTADO ESPERADO
-- =====================================================
-- Você deve ver:
-- linha          | produto                    | preco  | unidade | ativo
-- --------------|----------------------------|--------|---------|------
-- Cobre Ácido   | ÁCIDO CLORÍDRICO           | 8.00   | L       | true
-- Cobre Ácido   | ÁCIDO SULFÚRICO            | 15.00  | L       | true
-- Cobre Ácido   | ÁCIDO SULFÚRICO 98%        | 18.00  | L       | true
-- Cobre Ácido   | ATIVADOR                   | 25.00  | L       | true
-- ...

-- =====================================================
-- IMPORTANTE: EDITE OS PRODUTOS ACIMA!
-- =====================================================
-- Os produtos e preços acima são apenas EXEMPLOS.
-- Você deve:
-- 1. Adicionar os produtos químicos REAIS que você usa
-- 2. Colocar os preços REAIS (custo/kg ou custo/litro)
-- 3. Definir a unidade correta ('kg', 'L', 'unidade', etc)
-- 4. Remover produtos que não usa
-- 5. Adicionar produtos que faltam
