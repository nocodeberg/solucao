-- =====================================================
-- LIMPAR dados inseridos pelo seed-lancamentos-ano-completo.sql
-- Company ID: 610563e2-d9ce-4ccc-8aa4-17a6e210cdf9
-- =====================================================

DO $$
DECLARE
  v_company UUID := '610563e2-d9ce-4ccc-8aa4-17a6e210cdf9';
BEGIN

-- Apagar lançamentos do ano 2025
DELETE FROM lancamento_mo WHERE company_id = v_company AND ano = 2025;
DELETE FROM manutencao WHERE company_id = v_company AND data >= '2025-01-01' AND data <= '2025-12-31';
DELETE FROM consumo_agua WHERE company_id = v_company AND data >= '2025-01-01' AND data <= '2025-12-31';
DELETE FROM custos_variaveis WHERE company_id = v_company AND data >= '2025-01-01' AND data <= '2025-12-31';
DELETE FROM outros_custos WHERE company_id = v_company AND ano = 2025;
DELETE FROM transporte WHERE company_id = v_company AND ano = 2025;
DELETE FROM investimentos WHERE company_id = v_company;

-- Apagar funcionários criados pelo seed (os 15 nomes específicos)
DELETE FROM employees WHERE company_id = v_company AND full_name IN (
  'Carlos Silva', 'José Santos', 'Pedro Oliveira', 'Marcos Pereira',
  'Anderson Costa', 'Rafael Lima', 'Fernando Souza', 'Rodrigo Almeida',
  'Lucas Ferreira', 'Gustavo Ribeiro', 'Thiago Martins',
  'Ricardo Mendes', 'Paulo Barbosa', 'Antônio Rocha', 'Sérgio Campos'
);

-- Apagar cargos criados pelo seed
DELETE FROM cargos WHERE company_id = v_company AND name IN (
  'Operador de Galvanoplastia', 'Supervisor de Produção',
  'Auxiliar de Produção', 'Eletricista Industrial', 'Mecânico Industrial'
);

RAISE NOTICE 'Todos os dados do seed anterior foram removidos.';

END $$;

-- Listar funcionários que já existem (fora do bloco DO)
SELECT id, full_name, salary, active 
FROM employees 
WHERE company_id = '610563e2-d9ce-4ccc-8aa4-17a6e210cdf9' 
ORDER BY full_name;
