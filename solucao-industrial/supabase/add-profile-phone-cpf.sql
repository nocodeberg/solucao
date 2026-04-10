-- =====================================================
-- MIGRATION: Adicionar phone e cpf na tabela profiles
-- =====================================================

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone VARCHAR(20);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS cpf VARCHAR(14);
