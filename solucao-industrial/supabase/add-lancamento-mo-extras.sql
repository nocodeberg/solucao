-- =====================================================
-- MIGRATION: Adicionar campos de hora extra, por fora e
-- insalubridade ao lancamento_mo
-- =====================================================

ALTER TABLE lancamento_mo
ADD COLUMN IF NOT EXISTS horas_extra_50 DECIMAL(10, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS horas_extra_100 DECIMAL(10, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS por_fora DECIMAL(10, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS insalubridade BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS valor_hora_extra DECIMAL(10, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS valor_insalubridade DECIMAL(10, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_encargos DECIMAL(10, 2) DEFAULT 0;

COMMENT ON COLUMN lancamento_mo.horas_extra_50 IS 'Quantidade de horas extras a 50%';
COMMENT ON COLUMN lancamento_mo.horas_extra_100 IS 'Quantidade de horas extras a 100%';
COMMENT ON COLUMN lancamento_mo.por_fora IS 'Valor pago por fora (não oficial)';
COMMENT ON COLUMN lancamento_mo.insalubridade IS 'Se o funcionário recebe insalubridade (20% do salário)';
COMMENT ON COLUMN lancamento_mo.valor_hora_extra IS 'Valor total calculado de horas extras';
COMMENT ON COLUMN lancamento_mo.valor_insalubridade IS 'Valor calculado de insalubridade';
COMMENT ON COLUMN lancamento_mo.total_encargos IS 'Total de encargos (INSS+FGTS+Férias+1/3Férias+13°)';
