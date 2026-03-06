-- =====================================================
-- ATUALIZAR COM NOVA IMAGEM
-- Usar a nova URL da imagem fornecida
-- =====================================================

-- 1. Verificar empresas atuais
SELECT 
  'EMPRESAS ATUAIS - ANTES' as info,
  id,
  name,
  logo_url,
  created_at,
  updated_at
FROM companies 
ORDER BY created_at;

-- 2. ATUALIZAR TODAS AS EMPRESAS COM A NOVA IMAGEM
UPDATE companies 
SET 
  logo_url = 'https://i.imgur.com/GZkXp9R.png',
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
  'TODAS AS EMPRESAS AGORA TEM A NOVA IMAGEM' as status
FROM companies 
WHERE logo_url = 'https://i.imgur.com/GZkXp9R.png';

-- 5. Instruções
SELECT 
  'PRÓXIMOS PASSOS' as info,
  '1. Execute este SQL completo' as passo1,
  '2. Faça logout do sistema' as passo2,
  '3. Faça login novamente' as passo3,
  '4. A nova imagem deve aparecer no menu lateral' as passo4,
  '5. Logo redondo e centralizado' as passo5;
