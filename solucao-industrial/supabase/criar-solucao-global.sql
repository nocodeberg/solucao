-- =====================================================
-- CRIAR EMPRESA: SOLUÇÃO GLOBAL
-- =====================================================

-- 1. Criar a empresa
INSERT INTO companies (name, cnpj, email, phone, active)
VALUES (
  'Solução Global',
  '11.222.333/0001-44',
  'contato@solucaoglobal.com',
  '(11) 98765-4321',
  true
)
RETURNING id;

-- ⚠️ COPIE O UUID RETORNADO ACIMA E SUBSTITUA 'UUID_DA_EMPRESA' NAS QUERIES ABAIXO

-- =====================================================
-- 2. CRIAR DADOS INICIAIS
-- =====================================================

-- Criar linhas de produção padrão
INSERT INTO production_lines (company_id, name, description, active)
VALUES
  ('UUID_DA_EMPRESA', 'Pré-Tratamento', 'Linha de pré-tratamento de peças', true),
  ('UUID_DA_EMPRESA', 'Cobre Alcalino', 'Banho de cobre alcalino', true),
  ('UUID_DA_EMPRESA', 'Cobre Ácido', 'Banho de cobre ácido', true),
  ('UUID_DA_EMPRESA', 'Níquel', 'Banho de níquel', true),
  ('UUID_DA_EMPRESA', 'Cromo', 'Banho de cromo', true);

-- Criar grupos padrão
INSERT INTO groups (company_id, name, description)
VALUES
  ('UUID_DA_EMPRESA', 'Cromo', 'Acabamento cromado'),
  ('UUID_DA_EMPRESA', 'Cromo II', 'Acabamento cromado tipo II'),
  ('UUID_DA_EMPRESA', 'Níquel Strike', 'Níquel de aderência'),
  ('UUID_DA_EMPRESA', 'Verniz Cataforético Cobre', 'Verniz catódico sobre cobre'),
  ('UUID_DA_EMPRESA', 'Verniz Cataforético Preto Fosco', 'Verniz preto fosco'),
  ('UUID_DA_EMPRESA', 'Verniz Cataforético Preto Brilhante', 'Verniz preto brilhante'),
  ('UUID_DA_EMPRESA', 'Verniz Cataforético Gold', 'Verniz dourado'),
  ('UUID_DA_EMPRESA', 'Verniz Cataforético Champagne', 'Verniz champagne'),
  ('UUID_DA_EMPRESA', 'Verniz Cataforético Grafite Onix', 'Verniz grafite'),
  ('UUID_DA_EMPRESA', 'Verniz Imersão C', 'Verniz por imersão tipo C');

-- Criar cargos padrão
INSERT INTO cargos (company_id, name, description)
VALUES
  ('UUID_DA_EMPRESA', 'Operador', 'Operador de produção'),
  ('UUID_DA_EMPRESA', 'Líder', 'Líder de produção'),
  ('UUID_DA_EMPRESA', 'Auxiliar', 'Auxiliar de produção'),
  ('UUID_DA_EMPRESA', 'Supervisor', 'Supervisor de produção'),
  ('UUID_DA_EMPRESA', 'Técnico Químico', 'Técnico químico analista'),
  ('UUID_DA_EMPRESA', 'Auxiliar de Inspeção', 'Auxiliar de controle de qualidade'),
  ('UUID_DA_EMPRESA', 'Auxiliar de Produção', 'Auxiliar geral'),
  ('UUID_DA_EMPRESA', 'Assistente de Inspeção', 'Assistente de qualidade'),
  ('UUID_DA_EMPRESA', 'Auxiliar de Inspeção Verniz', 'Auxiliar de verniz'),
  ('UUID_DA_EMPRESA', 'Operador de Verniz', 'Operador especializado em verniz');

-- =====================================================
-- 3. VINCULAR USUÁRIO EXISTENTE (OPCIONAL)
-- =====================================================

-- Se você quer vincular um usuário existente à nova empresa como ADMIN:
-- UPDATE profiles
-- SET company_id = 'UUID_DA_EMPRESA', role = 'ADMIN'
-- WHERE email = 'seu-email@exemplo.com';

-- =====================================================
-- 4. VERIFICAR CRIAÇÃO
-- =====================================================

-- Verificar empresa criada
SELECT * FROM companies WHERE name = 'Solução Global';

-- Verificar linhas de produção
SELECT * FROM production_lines WHERE company_id = 'UUID_DA_EMPRESA';

-- Verificar grupos
SELECT * FROM groups WHERE company_id = 'UUID_DA_EMPRESA';

-- Verificar cargos
SELECT * FROM cargos WHERE company_id = 'UUID_DA_EMPRESA';

-- Verificar encargos (criados automaticamente)
SELECT * FROM encargos WHERE company_id = 'UUID_DA_EMPRESA';
