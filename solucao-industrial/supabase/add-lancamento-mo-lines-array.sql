-- =====================================================
-- MIGRATION: Trocar production_line_id por production_line_ids (array)
-- Permite associar múltiplas linhas a um único lançamento
-- =====================================================

-- 1. Adicionar nova coluna de array
ALTER TABLE lancamento_mo ADD COLUMN IF NOT EXISTS production_line_ids UUID[] DEFAULT '{}';

-- 2. Migrar dados existentes para o array
UPDATE lancamento_mo 
SET production_line_ids = ARRAY[production_line_id]
WHERE production_line_id IS NOT NULL AND (production_line_ids IS NULL OR production_line_ids = '{}');

-- 3. Remover FK e coluna antiga (opcional - executar depois de validar)
-- ALTER TABLE lancamento_mo DROP COLUMN production_line_id;
