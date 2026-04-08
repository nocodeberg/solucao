-- =====================================================
-- SEED: Lançamento M.O - Ano 2026 (Jan-Dez)
-- Usa funcionários e linhas JÁ existentes no banco
-- Distribui automaticamente MOD e MOI
-- Company ID: 610563e2-d9ce-4ccc-8aa4-17a6e210cdf9
-- =====================================================

DO $$
DECLARE
  v_company UUID := '610563e2-d9ce-4ccc-8aa4-17a6e210cdf9';
  v_mes INTEGER;
  v_lines UUID[];
  v_line_count INTEGER;
  v_emp RECORD;
  v_emp_index INTEGER := 0;
  v_assigned_line UUID;
  v_tipo lancamento_tipo;
  v_custo DECIMAL(10,2);
  v_horas DECIMAL(10,2);
  v_variacao DECIMAL;
  -- Percentuais CLT para cálculo do custo empresa
  v_pct_fgts DECIMAL := 0.08;
  v_pct_ferias DECIMAL := 0.0833;
  v_pct_terco DECIMAL := 0.0278;
  v_pct_13 DECIMAL := 0.0833;
  v_total_inserted INTEGER := 0;
BEGIN

-- Buscar linhas de produção ativas
SELECT array_agg(id ORDER BY name) INTO v_lines
FROM production_lines
WHERE company_id = v_company AND active = true;

v_line_count := array_length(v_lines, 1);

IF v_line_count IS NULL OR v_line_count = 0 THEN
  RAISE EXCEPTION 'Nenhuma linha de produção encontrada para esta empresa.';
END IF;

RAISE NOTICE 'Linhas encontradas: %', v_line_count;

-- Loop por cada funcionário ativo
FOR v_emp IN 
  SELECT id, full_name, salary 
  FROM employees 
  WHERE company_id = v_company AND active = true 
  ORDER BY salary DESC
LOOP
  v_emp_index := v_emp_index + 1;
  
  -- Distribuir entre linhas (round-robin)
  v_assigned_line := v_lines[((v_emp_index - 1) % v_line_count) + 1];
  
  -- Salários >= 3500 = MOI (supervisor/manutenção), senão MOD (operador)
  IF v_emp.salary >= 3500 THEN
    v_tipo := 'MOI';
  ELSE
    v_tipo := 'MOD';
  END IF;
  
  -- Custo empresa = salário + FGTS + Férias + 1/3 Férias + 13°
  v_custo := v_emp.salary * (1 + v_pct_fgts + v_pct_ferias + v_pct_terco + v_pct_13);
  v_custo := ROUND(v_custo, 2);
  
  -- Inserir 12 meses com variação mensal
  FOR v_mes IN 1..12 LOOP
    -- Variação de -3% a +5% no custo mensal (horas extras, faltas, etc.)
    v_variacao := 1 + (-0.03 + random() * 0.08);
    -- Horas variam entre 198 e 232 (faltas, feriados, extras)
    v_horas := 198 + (random() * 34)::int;
    -- Recalcula custo com variação
    v_custo := ROUND(v_emp.salary * (1 + v_pct_fgts + v_pct_ferias + v_pct_terco + v_pct_13) * v_variacao, 2);

    INSERT INTO lancamento_mo (
      company_id, employee_id, production_line_id, tipo,
      mes, ano, data_lancamento, horas_trabalhadas,
      salario_base, custo_mensal, total_encargos
    ) VALUES (
      v_company, v_emp.id, v_assigned_line, v_tipo,
      v_mes, 2026, ('2026-' || LPAD(v_mes::text, 2, '0') || '-01')::date, v_horas,
      v_emp.salary, v_custo,
      ROUND(v_emp.salary * (v_pct_fgts + v_pct_ferias + v_pct_terco + v_pct_13) * v_variacao, 2)
    );
    v_total_inserted := v_total_inserted + 1;
  END LOOP;
  
  RAISE NOTICE '% - % (R$ %) → % - Custo: R$ %', 
    v_tipo, v_emp.full_name, v_emp.salary, 
    CASE WHEN v_tipo = 'MOI' THEN 'Indireto' ELSE 'Direto' END,
    v_custo;
    
END LOOP;

RAISE NOTICE '========================================';
RAISE NOTICE 'LANÇAMENTO M.O 2026 COMPLETO';
RAISE NOTICE 'Funcionários: %', v_emp_index;
RAISE NOTICE 'Registros inseridos: % (% func x 12 meses)', v_total_inserted, v_emp_index;
RAISE NOTICE '========================================';

END $$;
