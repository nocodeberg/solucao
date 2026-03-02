-- =====================================================
-- VERIFICAR PRODUTOS POR LINHA
-- Execute este SQL no Supabase SQL Editor
-- =====================================================

-- =====================================================
-- VER TODAS AS LINHAS E SEUS PRODUTOS
-- =====================================================

SELECT
  pl.id as linha_id,
  pl.name as linha_nome,
  COUNT(cp.id) as total_produtos,
  STRING_AGG(cp.name, ', ' ORDER BY cp.name) as lista_produtos
FROM production_lines pl
LEFT JOIN chemical_products cp ON cp.production_line_id = pl.id AND cp.active = true
WHERE pl.active = true
GROUP BY pl.id, pl.name
ORDER BY pl.name;

-- =====================================================
-- DETALHAMENTO: PRODUTOS DE CADA LINHA
-- =====================================================

SELECT
  pl.name as linha,
  cp.id as produto_id,
  cp.name as produto,
  cp.unit_price as preco,
  cp.unit as unidade
FROM production_lines pl
LEFT JOIN chemical_products cp ON cp.production_line_id = pl.id
WHERE pl.active = true
  AND (cp.active = true OR cp.id IS NULL)
ORDER BY pl.name, cp.name;

-- =====================================================
-- VERIFICAR SE HÁ PRODUTOS DUPLICADOS (MESMO PRODUTO EM VÁRIAS LINHAS)
-- =====================================================

SELECT
  cp.name as produto,
  COUNT(DISTINCT pl.id) as qtd_linhas,
  STRING_AGG(DISTINCT pl.name, ', ' ORDER BY pl.name) as linhas
FROM chemical_products cp
JOIN production_lines pl ON cp.production_line_id = pl.id
WHERE cp.active = true AND pl.active = true
GROUP BY cp.name
ORDER BY qtd_linhas DESC, produto;

-- =====================================================
-- ANÁLISE DO PROBLEMA
-- =====================================================

-- Se o resultado mostrar:
-- 1. Mesma quantidade de produtos para todas as linhas → PROBLEMA!
--    Solução: Execute INSERIR-PRODUTOS-AUTOMATICO-V2.sql
--
-- 2. Produtos duplicados (aparecem em várias linhas) → Pode estar OK
--    Exemplo: "SODA CÁUSTICA" é usado em várias linhas
--
-- 3. Zero produtos em alguma linha → PROBLEMA!
--    Solução: Execute INSERIR-PRODUTOS-AUTOMATICO-V2.sql

-- =====================================================
-- LIMPAR PRODUTOS EXISTENTES (SE NECESSÁRIO)
-- =====================================================
-- ATENÇÃO: Descomente apenas se quiser DELETAR TODOS os produtos
-- e começar do zero

-- DELETE FROM chemical_product_launches;  -- Deletar lançamentos primeiro
-- DELETE FROM chemical_products;          -- Depois deletar produtos

-- Após deletar, execute: INSERIR-PRODUTOS-AUTOMATICO-V2.sql
