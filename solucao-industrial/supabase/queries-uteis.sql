-- =====================================================
-- QUERIES ÚTEIS - SOLUÇÃO INDUSTRIAL
-- =====================================================

-- =====================================================
-- 1. CONFIGURAÇÃO INICIAL
-- =====================================================

-- Criar primeira empresa
INSERT INTO companies (name, cnpj, email, phone, active)
VALUES ('Minha Empresa', '00.000.000/0000-00', 'contato@empresa.com', '(00) 0000-0000', true)
RETURNING id;

-- Listar empresas
SELECT * FROM companies;

-- =====================================================
-- 2. USUÁRIOS E PROFILES
-- =====================================================

-- Listar todos os usuários e seus profiles
SELECT
  p.id,
  p.full_name,
  p.email,
  p.role,
  p.active,
  c.name as company_name
FROM profiles p
LEFT JOIN companies c ON c.id = p.company_id;

-- Atualizar role de um usuário
UPDATE profiles
SET role = 'ADMIN'
WHERE email = 'usuario@email.com';

-- Vincular usuário a uma empresa
UPDATE profiles
SET company_id = 'UUID_DA_EMPRESA'
WHERE email = 'usuario@email.com';

-- Tornar usuário admin
UPDATE profiles
SET role = 'ADMIN', company_id = 'UUID_DA_EMPRESA'
WHERE email = 'admin@empresa.com';

-- =====================================================
-- 3. LINHAS DE PRODUÇÃO
-- =====================================================

-- Criar linhas de produção padrão
INSERT INTO production_lines (company_id, name, description, active)
VALUES
  ('UUID_DA_EMPRESA', 'Pré-Tratamento', 'Linha de pré-tratamento de peças', true),
  ('UUID_DA_EMPRESA', 'Cobre Alcalino', 'Banho de cobre alcalino', true),
  ('UUID_DA_EMPRESA', 'Cobre Ácido', 'Banho de cobre ácido', true),
  ('UUID_DA_EMPRESA', 'Níquel', 'Banho de níquel', true),
  ('UUID_DA_EMPRESA', 'Cromo', 'Banho de cromo', true);

-- Listar linhas de produção
SELECT * FROM production_lines WHERE company_id = 'UUID_DA_EMPRESA';

-- =====================================================
-- 4. GRUPOS
-- =====================================================

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

-- Listar grupos
SELECT * FROM groups WHERE company_id = 'UUID_DA_EMPRESA';

-- =====================================================
-- 5. CARGOS
-- =====================================================

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

-- Listar cargos
SELECT * FROM cargos WHERE company_id = 'UUID_DA_EMPRESA';

-- =====================================================
-- 6. ENCARGOS
-- =====================================================

-- Verificar encargos existentes
SELECT * FROM encargos WHERE company_id = 'UUID_DA_EMPRESA';

-- Atualizar valores de encargos
UPDATE encargos
SET value = 10.00
WHERE company_id = 'UUID_DA_EMPRESA' AND name = 'INSS';

UPDATE encargos
SET value = 8.00
WHERE company_id = 'UUID_DA_EMPRESA' AND name = 'FGTS';

-- =====================================================
-- 7. FUNCIONÁRIOS
-- =====================================================

-- Listar funcionários com cargo
SELECT
  e.id,
  e.full_name,
  e.email,
  e.salary,
  e.active,
  c.name as cargo_name,
  e.admission_date
FROM employees e
LEFT JOIN cargos c ON c.id = e.cargo_id
WHERE e.company_id = 'UUID_DA_EMPRESA'
ORDER BY e.full_name;

-- Funcionários ativos
SELECT COUNT(*) as total_ativos
FROM employees
WHERE company_id = 'UUID_DA_EMPRESA' AND active = true;

-- =====================================================
-- 8. LANÇAMENTOS DE MÃO DE OBRA
-- =====================================================

-- Lançamentos por mês/ano
SELECT
  e.full_name,
  pl.name as linha,
  lmo.tipo,
  lmo.mes,
  lmo.ano,
  lmo.salario_base,
  lmo.custo_mensal
FROM lancamento_mo lmo
JOIN employees e ON e.id = lmo.employee_id
JOIN production_lines pl ON pl.id = lmo.production_line_id
WHERE lmo.company_id = 'UUID_DA_EMPRESA'
  AND lmo.ano = 2026
  AND lmo.mes = 1
ORDER BY lmo.data_lancamento DESC;

-- Total de custos por tipo (MOD/MOI) em um período
SELECT
  tipo,
  SUM(custo_mensal) as total
FROM lancamento_mo
WHERE company_id = 'UUID_DA_EMPRESA'
  AND ano = 2026
  AND mes = 1
GROUP BY tipo;

-- =====================================================
-- 9. MANUTENÇÃO
-- =====================================================

-- Total de manutenção por mês
SELECT
  EXTRACT(MONTH FROM data) as mes,
  EXTRACT(YEAR FROM data) as ano,
  SUM(valor) as total_manutencao
FROM manutencao
WHERE company_id = 'UUID_DA_EMPRESA'
  AND EXTRACT(YEAR FROM data) = 2026
GROUP BY EXTRACT(MONTH FROM data), EXTRACT(YEAR FROM data)
ORDER BY mes;

-- Manutenções mais caras
SELECT
  descricao,
  valor,
  data,
  pl.name as linha
FROM manutencao m
LEFT JOIN production_lines pl ON pl.id = m.production_line_id
WHERE m.company_id = 'UUID_DA_EMPRESA'
ORDER BY valor DESC
LIMIT 10;

-- =====================================================
-- 10. CONSUMO DE ÁGUA
-- =====================================================

-- Total de consumo por mês
SELECT
  EXTRACT(MONTH FROM data) as mes,
  EXTRACT(YEAR FROM data) as ano,
  SUM(valor) as total_consumo
FROM consumo_agua
WHERE company_id = 'UUID_DA_EMPRESA'
  AND EXTRACT(YEAR FROM data) = 2026
GROUP BY EXTRACT(MONTH FROM data), EXTRACT(YEAR FROM data)
ORDER BY mes;

-- =====================================================
-- 11. RELATÓRIOS E ANÁLISES
-- =====================================================

-- Dashboard resumo mensal
SELECT
  'Funcionários Ativos' as metrica,
  COUNT(*)::text as valor
FROM employees
WHERE company_id = 'UUID_DA_EMPRESA' AND active = true

UNION ALL

SELECT
  'Custo Total M.O.D',
  'R$ ' || SUM(custo_mensal)::text
FROM lancamento_mo
WHERE company_id = 'UUID_DA_EMPRESA'
  AND ano = 2026 AND mes = 1 AND tipo = 'MOD'

UNION ALL

SELECT
  'Custo Total M.O.I',
  'R$ ' || SUM(custo_mensal)::text
FROM lancamento_mo
WHERE company_id = 'UUID_DA_EMPRESA'
  AND ano = 2026 AND mes = 1 AND tipo = 'MOI'

UNION ALL

SELECT
  'Total Manutenção',
  'R$ ' || SUM(valor)::text
FROM manutencao
WHERE company_id = 'UUID_DA_EMPRESA'
  AND data >= '2026-01-01' AND data <= '2026-01-31'

UNION ALL

SELECT
  'Total Consumo Água',
  'R$ ' || SUM(valor)::text
FROM consumo_agua
WHERE company_id = 'UUID_DA_EMPRESA'
  AND data >= '2026-01-01' AND data <= '2026-01-31';

-- =====================================================
-- 12. LIMPEZA E MANUTENÇÃO
-- =====================================================

-- Deletar todos os lançamentos de teste
-- ATENÇÃO: Use com cuidado!
-- DELETE FROM lancamento_mo WHERE company_id = 'UUID_DA_EMPRESA';
-- DELETE FROM manutencao WHERE company_id = 'UUID_DA_EMPRESA';
-- DELETE FROM consumo_agua WHERE company_id = 'UUID_DA_EMPRESA';

-- Resetar sequence de peças
-- ALTER SEQUENCE pieces_id_seq RESTART WITH 1;

-- =====================================================
-- 13. BACKUP RÁPIDO
-- =====================================================

-- Exportar dados de funcionários (copiar resultado para backup)
SELECT * FROM employees WHERE company_id = 'UUID_DA_EMPRESA';

-- Exportar lançamentos
SELECT * FROM lancamento_mo WHERE company_id = 'UUID_DA_EMPRESA';
