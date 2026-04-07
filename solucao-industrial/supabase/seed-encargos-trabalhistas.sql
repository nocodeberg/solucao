-- =====================================================
-- SEED: Encargos Trabalhistas conforme legislação CLT
-- Valores padrão que podem ser alterados pelo RH
-- =====================================================

-- Limpa encargos existentes e insere os corretos
DELETE FROM encargos;

INSERT INTO encargos (company_id, name, value, is_percentage, description)
SELECT id, 'INSS', 10.00, true, 'Contribuição INSS empregado (simplificado - faixas reais: 7,5% a 14%)' FROM companies
UNION ALL
SELECT id, 'FGTS', 8.00, true, 'Fundo de Garantia por Tempo de Serviço (CLT Art. 15)' FROM companies
UNION ALL
SELECT id, 'Férias', 8.33, true, 'Provisão de Férias - 1/12 do salário (CLT Art. 129)' FROM companies
UNION ALL
SELECT id, '1/3 Férias', 2.78, true, '1/3 Constitucional sobre Férias (CF Art. 7°, XVII)' FROM companies
UNION ALL
SELECT id, '13º Salário', 8.33, true, 'Provisão 13° Salário - 1/12 do salário (Lei 4.090/62)' FROM companies
UNION ALL
SELECT id, 'Insalubridade', 20.00, true, 'Adicional de Insalubridade grau médio (CLT Art. 192 - Min:10% Méd:20% Máx:40%)' FROM companies;
