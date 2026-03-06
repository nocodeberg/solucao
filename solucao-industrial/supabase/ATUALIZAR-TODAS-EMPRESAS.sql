-- =====================================================
-- ATUALIZAR LOGO EM TODAS AS EMPRESAS
-- Coloca o mesmo logo em todas as empresas
-- =====================================================

-- 1. Verificar empresas atuais
SELECT 
  'EMPRESAS ATUAIS - ANTES DA ATUALIZAÇÃO' as info,
  id,
  name,
  logo_url,
  created_at,
  updated_at
FROM companies 
ORDER BY created_at;

-- 2. ATUALIZAR TODAS AS EMPRESAS COM O LOGO
UPDATE companies 
SET 
  logo_url = 'https://62a6378ae71b59a7cac189b50eeb8dbe.cdn.bubble.io/f1772462278760x495221363535935040/Captura%20de%20ecr%C3%A3%202026-02-13%20114630.png?_gl=1*rslsfn*_gcl_au*MTY0MjU4MDczNS4xNzcyNDYxMjc1*_ga*MTA0OTkzNjQ0Mi4xNzIxNzQ2MDAy*_ga_BFPVR2DEE2*czE3NzI0NjExOTUkbzE5MyRnMSR0MTc3MjQ2MjI4OSRqNTgkbDAkaDA.',
  updated_at = NOW();

-- 3. Verificar resultado
SELECT 
  'EMPRESAS ATUALIZADAS - SUCESSO!' as info,
  id,
  name,
  logo_url,
  updated_at
FROM companies 
ORDER BY updated_at DESC;

-- 4. Contar quantas empresas foram atualizadas
SELECT 
  'RESUMO DA ATUALIZAÇÃO' as info,
  COUNT(*) as total_empresas_atualizadas,
  'TODAS AS EMPRESAS AGORA TEM O LOGO' as status
FROM companies 
WHERE logo_url IS NOT NULL;

-- 5. Instruções
SELECT 
  'PRÓXIMOS PASSOS' as info,
  '1. Execute este SQL completo' as passo1,
  '2. Faça logout do sistema' as passo2,
  '3. Faça login novamente' as passo3,
  '4. Todas as empresas devem mostrar o logo' as passo4,
  '5. Depois podemos ajustar nomes individualmente' as passo5;
