# Como Implementar Seleção de Tipo de Linha (Galvanoplastia/Verniz)

## PASSO 1: Executar Migration no Banco de Dados

### 1.1 Acesse o Supabase SQL Editor
Abra no navegador:
```
https://supabase.com/dashboard/project/csvhywnaiqfofudhwwgf/sql
```

### 1.2 Clique em "New Query"

### 1.3 Cole este SQL:

```sql
-- Criar ENUM para tipos de linha
CREATE TYPE line_type AS ENUM ('GALVANOPLASTIA', 'VERNIZ');

-- Adicionar coluna line_type
ALTER TABLE production_lines
ADD COLUMN line_type line_type DEFAULT 'GALVANOPLASTIA';

-- Criar índice
CREATE INDEX idx_production_lines_type ON production_lines(line_type);

-- Atualizar linhas existentes baseado no nome
UPDATE production_lines
SET line_type = 'VERNIZ'
WHERE LOWER(name) LIKE '%verniz%' OR LOWER(description) LIKE '%verniz%';

-- Comentário
COMMENT ON COLUMN production_lines.line_type IS 'Tipo de linha de produção: GALVANOPLASTIA ou VERNIZ';
```

### 1.4 Clique em "Run" ou pressione Ctrl+Enter

### 1.5 Verifique se funcionou:

Cole e execute este SQL para verificar:
```sql
SELECT id, name, line_type
FROM production_lines
LIMIT 5;
```

Você deve ver a coluna `line_type` com valores!

---

## PASSO 2: Após Migration Executada com Sucesso

**ME AVISE** que executou a migration e eu vou aplicar as mudanças no código automaticamente!

---

## Se Precisar Reverter (Rollback)

Caso algo dê errado:

```sql
ALTER TABLE production_lines DROP COLUMN IF EXISTS line_type;
DROP TYPE IF EXISTS line_type;
DROP INDEX IF EXISTS idx_production_lines_type;
```

---

## O Que Será Adicionado no Código

Após a migration, eu vou adicionar:

✅ Dropdown no formulário para selecionar Galvanoplastia ou Verniz
✅ Badge colorida na listagem (Azul para Galvanoplastia, Roxo para Verniz)
✅ Tipos TypeScript atualizados
✅ Validações no frontend

---

## Importante

⚠️ **NÃO** execute a migration duas vezes
⚠️ Execute APENAS se você ainda não executou antes
✅ Me avise quando terminar para eu aplicar o código
