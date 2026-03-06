-- =====================================================
-- ATUALIZAR COM IMAGEM DA PÁGINA ATUAL
-- Usar a imagem que está na página como logo
-- =====================================================

-- 1. Verificar empresas atuais
SELECT 
  'EMPRESAS ATUAIS - ANTES' as info,
  id,
  name,
  logo_url
FROM companies 
ORDER BY created_at;

-- 2. ATUALIZAR COM IMAGEM DA PÁGINA
-- ATENÇÃO: Substitua 'URL_DA_IMAGEM_DA_PAGINA' pela URL real
UPDATE companies 
SET 
  logo_url = 'URL_DA_IMAGEM_DA_PAGINA',
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

-- 4. Instruções
SELECT 
  'INSTRUÇÕES' as info,
  '1. Substitua URL_DA_IMAGEM_DA_PAGINA' as passo1,
  '2. Execute o UPDATE' as passo2,
  '3. Faça logout/login' as passo3,
  '4. A imagem da página aparecerá no menu' as passo4;
