-- =====================================================
-- MIGRATION: Permitir múltiplos grupos por peça
-- Adiciona coluna group_ids UUID[] na tabela pieces
-- =====================================================

ALTER TABLE pieces
ADD COLUMN IF NOT EXISTS group_ids UUID[] DEFAULT '{}';

-- Migrar dados existentes: copiar group_id para group_ids
UPDATE pieces 
SET group_ids = ARRAY[group_id] 
WHERE group_id IS NOT NULL AND (group_ids IS NULL OR group_ids = '{}');

COMMENT ON COLUMN pieces.group_ids IS 'Array de IDs dos grupos associados à peça';
