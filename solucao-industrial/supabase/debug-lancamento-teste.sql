-- =====================================================
-- DEBUG DO LANÇAMENTO TESTE
-- Verificar por que o produto lançado não aparece
-- =====================================================

-- 1. Verificar se o lançamento foi salvo
SELECT 
  '🔍 LANÇAMENTOS SALVOS' as info,
  id,
  chemical_product_id,
  production_line_id,
  mes,
  ano,
  quantidade,
  custo_total,
  created_at
FROM chemical_product_launches 
WHERE 1=1  -- Mostra todos os lançamentos
ORDER BY created_at DESC
LIMIT 10;

-- 2. Verificar produtos químicos atuais
SELECT 
  '📦 PRODUTOS QUÍMICOS ATUAIS' as info,
  cp.id,
  cp.name,
  cp.company_id,
  cp.production_line_id,
  cp.active,
  pl.name as linha_nome
FROM chemical_products cp
LEFT JOIN production_lines pl ON cp.production_line_id = pl.id
WHERE cp.active = true
ORDER BY cp.company_id, pl.name, cp.name;

-- 3. Verificar se há produtos sem linha (estes não aparecem no filtro)
SELECT 
  '❌ PRODUTOS SEM LINHA (NÃO APARECEM NO MODAL)' as problema,
  cp.id,
  cp.name,
  cp.company_id
FROM chemical_products cp
WHERE cp.production_line_id IS NULL 
  AND cp.active = true
ORDER BY cp.company_id, cp.name;

-- 4. Verificar lançamentos por linha
SELECT 
  '📊 LANÇAMENTOS POR LINHA' as resumo,
  pl.name as linha,
  COUNT(cpl.id) as total_lancamentos,
  SUM(cpl.quantidade) as soma_quantidade,
  SUM(cpl.custo_total) as soma_custo
FROM chemical_product_launches cpl
INNER JOIN production_lines pl ON cpl.production_line_id = pl.id
GROUP BY pl.id, pl.name
ORDER BY pl.name;

-- 5. Verificar lançamentos recentes (últimos 7 dias)
SELECT 
  '🕐 LANÇAMENTOS RECENTES (7 DIAS)' as recentes,
  cpl.id,
  cpl.mes,
  cpl.ano,
  cpl.quantidade,
  cpl.custo_total,
  cp.name as produto,
  pl.name as linha,
  cpl.created_at
FROM chemical_product_launches cpl
INNER JOIN chemical_products cp ON cpl.chemical_product_id = cp.id
INNER JOIN production_lines pl ON cpl.production_line_id = pl.id
WHERE cpl.created_at >= NOW() - INTERVAL '7 days'
ORDER BY cpl.created_at DESC;
