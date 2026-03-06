-- =====================================================
-- ATUALIZAR EMPRESA BOGNAR - FINAL
-- ID: 610563e2-d9ce-4ccc-8aa4-17a6e210cdf9
-- =====================================================

-- 1. Verificar dados atuais
SELECT 
  'DADOS ATUAIS - ANTES DA ATUALIZAÇÃO' as info,
  id,
  name,
  logo_url,
  created_at
FROM companies 
WHERE id = '610563e2-d9ce-4ccc-8aa4-17a6e210cdf9';

-- 2. ATUALIZAR COM DADOS FINAIS
UPDATE companies 
SET 
  name = 'Bognar',
  logo_url = 'https://62a6378ae71b59a7cac189b50eeb8dbe.cdn.bubble.io/f1772462278760x495221363535935040/Captura%20de%20ecr%C3%A3%202026-02-13%20114630.png?_gl=1*rslsfn*_gcl_au*MTY0MjU4MDczNS4xNzcyNDYxMjc1*_ga*MTA0OTkzNjQ0Mi4xNzIxNzQ2MDAy*_ga_BFPVR2DEE2*czE3NzI0NjExOTUkbzE5MyRnMSR0MTc3MjQ2MjI4OSRqNTgkbDAkaDA.',
  updated_at = NOW()
WHERE id = '610563e2-d9ce-4ccc-8aa4-17a6e210cdf9';

-- 3. Verificar se atualizou corretamente
SELECT 
  'DADOS ATUALIZADOS - SUCESSO!' as info,
  id,
  name,
  logo_url,
  updated_at
FROM companies 
WHERE id = '610563e2-d9ce-4ccc-8aa4-17a6e210cdf9';

-- 4. Verificar todas as empresas
SELECT 
  'TODAS AS EMPRESAS - PARA COMPARAÇÃO' as info,
  id,
  name,
  logo_url,
  created_at
FROM companies 
ORDER BY created_at;

-- 5. Instruções finais
SELECT 
  'PRÓXIMOS PASSOS' as info,
  '1. Execute este SQL completo' as passo1,
  '2. Faça logout do sistema' as passo2,
  '3. Faça login novamente' as passo3,
  '4. O logo Bognar deve aparecer no menu lateral' as passo4;
