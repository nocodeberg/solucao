-- =====================================================
-- INSERIR PRODUTOS QUÍMICOS - VERSÃO SIMPLES
-- Execute este SQL no Supabase SQL Editor
-- =====================================================

-- IMPORTANTE: Este script insere produtos químicos para TODAS
-- as linhas de galvanoplastia da sua empresa automaticamente

-- =====================================================
-- INSERIR PRODUTOS QUÍMICOS
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
    ('SODA', 10.00, 'kg'),
    ('ACTIVE ZMC', 10.00, 'kg'),
    ('COMPOSTO C-10', 10.00, 'kg'),
    ('METAL CLEAN FE 05', 10.00, 'kg'),
    ('METAL CLEAN 7E_F', 10.00, 'kg'),
    ('ÁCIDO SULFÚRICO', 15.00, 'L'),
    ('ANODO DE COBRE', 50.00, 'kg'),
    ('SULFATO DE COBRE', 75.00, 'kg'),
    ('MC COPPER EVOLUTION M.U', 13.00, 'L'),
    ('MC COPPER EVOLUTION PARTE A', 10.00, 'L'),
    ('MC COPPER EVOLUTION PARTE B', 7.00, 'L'),
    ('MC COPPER EVOLUTION UMECTANTE', 10.00, 'L')
) AS produto(name, price, unit)
WHERE pl.line_type = 'GALVANOPLASTIA'
  AND pl.active = true
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
-- RESULTADO ESPERADO
-- =====================================================
-- Você deve ver uma lista com:
-- linha         | produto                    | preco | unidade | ativo
-- --------------|----------------------------|-------|---------|------
-- Cobre Ácido   | ACTIVE ZMC                 | 10.00 | kg      | true
-- Cobre Ácido   | ANODO DE COBRE             | 50.00 | kg      | true
-- Cobre Ácido   | ÁCIDO SULFÚRICO            | 15.00 | L       | true
-- ...
--
-- Se aparecer vazio, significa que:
-- 1. Não há linhas de galvanoplastia ativas
-- 2. Já existem produtos cadastrados (script não duplica)
