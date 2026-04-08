-- =====================================================
-- MIGRATION: Adicionar coluna 'codigo' na tabela pieces
-- Para armazenar o ID/código da peça definido pelo usuário
-- =====================================================

ALTER TABLE pieces
ADD COLUMN IF NOT EXISTS codigo VARCHAR(50);

-- Índice para busca rápida por código
CREATE INDEX IF NOT EXISTS idx_pieces_codigo ON pieces(codigo);

COMMENT ON COLUMN pieces.codigo IS 'Código/ID da peça definido pelo usuário';
