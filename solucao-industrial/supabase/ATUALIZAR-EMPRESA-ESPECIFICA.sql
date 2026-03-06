-- =====================================================
-- ATUALIZAR EMPRESA ESPECÍFICA
-- ID: 610563e2-d9ce-4ccc-8aa4-17a6e210cdf9
-- =====================================================

-- 1. Verificar dados atuais da empresa
SELECT 
  'DADOS ATUAIS DA EMPRESA' as info,
  id,
  name,
  logo_url,
  created_at
FROM companies 
WHERE id = '610563e2-d9ce-4ccc-8aa4-17a6e210cdf9';

-- 2. Atualizar com o logo que você enviou
-- ATENÇÃO: Substitua 'NOME_DA_EMPRESA_AQUI' pelo nome correto
UPDATE companies 
SET 
  name = 'NOME_DA_EMPRESA_AQUI',
  logo_url = 'https://i.imgur.com/SEU_LOGO_AQUI.png', -- Substitua pela URL real
  updated_at = NOW()
WHERE id = '610563e2-d9ce-4ccc-8aa4-17a6e210cdf9';

-- 3. Verificar se atualizou corretamente
SELECT 
  'EMPRESA ATUALIZADA' as info,
  id,
  name,
  logo_url,
  updated_at
FROM companies 
WHERE id = '610563e2-d9ce-4ccc-8aa4-17a6e210cdf9';

-- 4. Instruções
SELECT 
  'PRÓXIMOS PASSOS' as info,
  '1. Substitua NOME_DA_EMPRESA_AQUI no UPDATE' as passo1,
  '2. Faça upload da imagem para obter URL' as passo2,
  '3. Substitua URL_DO_LOGO_AQUI no UPDATE' as passo3,
  '4. Execute o UPDATE' as passo4,
  '5. Faça logout e login novamente' as passo5;
