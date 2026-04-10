-- =====================================================
-- MIGRATION: Adicionar tipo_mo na tabela employees
-- MOD = Mão de Obra Direta, MOI = Mão de Obra Indireta
-- =====================================================

ALTER TABLE employees ADD COLUMN IF NOT EXISTS tipo_mo VARCHAR(3) DEFAULT 'MOD' CHECK (tipo_mo IN ('MOD', 'MOI'));
