-- =====================================================
-- TESTAR URL DA IMAGEM E CORRIGIR
-- Verificar se a URL está acessível
-- =====================================================

-- 1. Verificar empresas atuais e URLs
SELECT 
  'EMPRESAS ATUAIS E URLS' as info,
  id,
  name,
  logo_url,
  CASE 
    WHEN logo_url IS NULL THEN 'SEM LOGO'
    WHEN logo_url LIKE '%bubble.io%' THEN 'URL BUBBLE'
    WHEN logo_url LIKE '%imgur%' THEN 'URL IMGUR'
    ELSE 'OUTRA URL'
  END as tipo_url
FROM companies 
ORDER BY created_at;

-- 2. Testar UPDATE com URL simplificada (remover parâmetros problemáticos)
UPDATE companies 
SET 
  logo_url = 'https://62a6378ae71b59a7cac189b50eeb8dbe.cdn.bubble.io/f1772462278760x495221363535935040/Captura%20de%20ecr%C3%A3%202026-02-13%20114630.png',
  updated_at = NOW()
WHERE logo_url LIKE '%bubble.io%';

-- 3. Verificar resultado
SELECT 
  'APÓS LIMPEZA DA URL' as info,
  id,
  name,
  logo_url,
  updated_at
FROM companies 
WHERE logo_url LIKE '%bubble.io%';

-- 4. Alternativa: Usar URL de teste (logo genérico)
-- Descomente se precisar usar uma URL de teste
/*
UPDATE companies 
SET 
  logo_url = 'https://via.placeholder.com/80x80/4F46E5/FFFFFF?text=LOGO',
  updated_at = NOW();
*/

-- 5. Instruções
SELECT 
  'POSSÍVEIS PROBLEMAS' as info,
  '1. URL com parâmetros demais' as problema1,
  '2. Imagem não existe mais' as problema2,
  '3. Permissões de acesso' as problema3,
  '4. Cache do navegador' as problema4,
  'SOLUÇÃO: Testar URL simples ou usar outra imagem' as solucao;
