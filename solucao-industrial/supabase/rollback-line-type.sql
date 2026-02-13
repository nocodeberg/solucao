-- =====================================================
-- ROLLBACK: Remove line_type from production_lines
-- Use este script se a migration causou problemas
-- =====================================================

-- 1. Remover índice
DROP INDEX IF EXISTS idx_production_lines_type;

-- 2. Remover coluna line_type
ALTER TABLE production_lines DROP COLUMN IF EXISTS line_type;

-- 3. Remover ENUM
DROP TYPE IF EXISTS line_type;

-- 4. Verificar estrutura da tabela
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'production_lines'
ORDER BY ordinal_position;
