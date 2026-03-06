-- =====================================================
-- DIAGNÓSTICO - VERIFICAR ATUALIZAÇÃO DA EMPRESA
-- =====================================================

-- 1. Verificar se a empresa existe
SELECT 
  'EMPRESA EXISTE?' as info,
  id,
  name,
  logo_url,
  created_at,
  updated_at
FROM companies 
WHERE id = '610563e2-d9ce-4ccc-8aa4-17a6e210cdf9';

-- 2. Verificar todas as empresas
SELECT 
  'TODAS AS EMPRESAS' as info,
  id,
  name,
  logo_url,
  created_at,
  updated_at
FROM companies 
ORDER BY updated_at DESC;

-- 3. Verificar se há algum usuário vinculado a esta empresa
SELECT 
  'USUÁRIOS VINCULADOS A ESTA EMPRESA' as info,
  id,
  full_name,
  email,
  company_id,
  role,
  created_at
FROM profiles 
WHERE company_id = '610563e2-d9ce-4ccc-8aa4-17a6e210cdf9'
ORDER BY created_at DESC;

-- 4. Testar UPDATE manual
-- ATENÇÃO: Este UPDATE vai forçar a atualização
UPDATE companies 
SET 
  name = 'BOGNAR TESTE',
  logo_url = 'https://62a6378ae71b59a7cac189b50eeb8dbe.cdn.bubble.io/f1772462278760x495221363535935040/Captura%20de%20ecr%C3%A3%202026-02-13%20114630.png?_gl=1*rslsfn*_gcl_au*MTY0MjU4MDczNS4xNzcyNDYxMjc1*_ga*MTA0OTkzNjQ0Mi4xNzIxNzQ2MDAy*_ga_BFPVR2DEE2*czE3NzI0NjExOTUkbzE5MyRnMSR0MTc3MjQ2MjI4OSRqNTgkbDAkaDA.',
  updated_at = NOW()
WHERE id = '610563e2-d9ce-4ccc-8aa4-17a6e210cdf9';

-- 5. Verificar resultado do UPDATE
SELECT 
  'RESULTADO APÓS UPDATE FORÇADO' as info,
  id,
  name,
  logo_url,
  updated_at
FROM companies 
WHERE id = '610563e2-d9ce-4ccc-8aa4-17a6e210cdf9';
