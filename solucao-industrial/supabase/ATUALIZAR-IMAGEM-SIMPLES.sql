-- =====================================================
-- ATUALIZAR IMAGEM - VERSÃO SIMPLES
-- Execute este SQL para atualizar o logo
-- =====================================================

-- 1. Verificar empresas atuais
SELECT 
  'EMPRESAS ATUAIS' as info,
  id,
  name,
  logo_url
FROM companies 
ORDER BY created_at;

-- 2. ATUALIZAR LOGO
UPDATE companies 
SET 
  logo_url = 'https://i.imgur.com/GZkXp9R.png',
  updated_at = NOW();

-- 3. Verificar resultado
SELECT 
  'EMPRESAS ATUALIZADAS' as info,
  id,
  name,
  logo_url,
  updated_at
FROM companies 
ORDER BY updated_at DESC;
