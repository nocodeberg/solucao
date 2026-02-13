-- =====================================================
-- MIGRATION: Add line_type to production_lines
-- Adiciona campo para diferenciar Verniz e Galvanoplastia
-- =====================================================

-- 1. Criar ENUM para tipos de linha
CREATE TYPE line_type AS ENUM ('GALVANOPLASTIA', 'VERNIZ');

-- 2. Adicionar coluna line_type à tabela production_lines
ALTER TABLE production_lines
ADD COLUMN line_type line_type DEFAULT 'GALVANOPLASTIA';

-- 3. Tornar o campo obrigatório (remover default depois de popular dados existentes)
-- Se você quiser que seja obrigatório no futuro:
-- ALTER TABLE production_lines ALTER COLUMN line_type SET NOT NULL;

-- 4. Criar índice para melhorar performance de queries por tipo
CREATE INDEX idx_production_lines_type ON production_lines(line_type);

-- 5. Atualizar linhas existentes baseado no nome (opcional)
-- Verniz
UPDATE production_lines
SET line_type = 'VERNIZ'
WHERE LOWER(name) LIKE '%verniz%' OR LOWER(description) LIKE '%verniz%';

-- Galvanoplastia (já é o padrão, mas garantindo)
UPDATE production_lines
SET line_type = 'GALVANOPLASTIA'
WHERE line_type IS NULL
   OR (LOWER(name) LIKE '%galvan%'
   OR LOWER(name) LIKE '%cobre%'
   OR LOWER(name) LIKE '%níquel%'
   OR LOWER(name) LIKE '%niquel%'
   OR LOWER(name) LIKE '%cromo%');

-- 6. Comentários para documentação
COMMENT ON COLUMN production_lines.line_type IS 'Tipo de linha de produção: GALVANOPLASTIA ou VERNIZ';
