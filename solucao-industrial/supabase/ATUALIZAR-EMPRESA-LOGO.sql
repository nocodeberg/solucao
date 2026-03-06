-- =====================================================
-- ATUALIZAR DADOS DA EMPRESA
-- Muda nome e adiciona logo da empresa
-- =====================================================

-- 1. Verificar empresas atuais
SELECT 
  'EMPRESAS ATUAIS' as info,
  id,
  name,
  logo_url,
  created_at
FROM companies 
ORDER BY created_at;

-- 2. Atualizar nome e logo da empresa (substitua o ID correto)
-- ATENÇÃO: Troque 'ID_DA_EMPRESA' pelo ID real da empresa que quer atualizar
UPDATE companies 
SET 
  name = 'NOME_DA_EMPRESA_AQUI',
  logo_url = 'URL_DO_LOGO_AQUI',
  updated_at = NOW()
WHERE id = 'ID_DA_EMPRESA';

-- 3. Verificar se atualizou corretamente
SELECT 
  'EMPRESA ATUALIZADA' as info,
  id,
  name,
  logo_url,
  updated_at
FROM companies 
WHERE id = 'ID_DA_EMPRESA';

-- 4. Instruções
SELECT 
  'INSTRUÇÕES' as info,
  '1. Veja o ID da empresa no primeiro SELECT' as passo1,
  '2. Substitua ID_DA_EMPRESA no UPDATE' as passo2,
  '3. Substitua NOME_DA_EMPRESA_AQUI' as passo3,
  '4. Substitua URL_DO_LOGO_AQUI' as passo4,
  '5. Execute o UPDATE' as passo5;
