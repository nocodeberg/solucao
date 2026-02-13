# Instruções para Executar Migration: Add Line Type

## Como Executar

### Opção 1: Via Supabase SQL Editor (Recomendado)

1. Acesse o Supabase Dashboard:
   ```
   https://supabase.com/dashboard/project/csvhywnaiqfofudhwwgf/sql
   ```

2. Clique em "New Query"

3. Cole o conteúdo completo do arquivo `add-line-type.sql`

4. Clique em "Run" para executar a migration

### Opção 2: Via Cliente Supabase

Se você tiver `psql` instalado:

```bash
psql "postgresql://postgres:[PASSWORD]@db.csvhywnaiqfofudhwwgf.supabase.co:5432/postgres" < add-line-type.sql
```

## O que essa Migration Faz

1. ✅ Cria o ENUM `line_type` com valores: `GALVANOPLASTIA` e `VERNIZ`
2. ✅ Adiciona a coluna `line_type` à tabela `production_lines`
3. ✅ Define `GALVANOPLASTIA` como valor padrão
4. ✅ Cria índice para melhorar performance
5. ✅ Atualiza linhas existentes baseado no nome (identifica automaticamente)
6. ✅ Adiciona comentário de documentação

## Verificação Pós-Migration

Execute no SQL Editor para verificar:

```sql
-- Ver estrutura da tabela
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'production_lines'
ORDER BY ordinal_position;

-- Ver linhas existentes com o novo campo
SELECT id, name, line_type
FROM production_lines;

-- Contar por tipo
SELECT line_type, COUNT(*) as total
FROM production_lines
GROUP BY line_type;
```

## Rollback (Se Necessário)

Para reverter a migration:

```sql
ALTER TABLE production_lines DROP COLUMN line_type;
DROP TYPE line_type;
DROP INDEX IF EXISTS idx_production_lines_type;
```

## Mudanças no Código

Já foram aplicadas as seguintes alterações no código:

- ✅ Tipos TypeScript atualizados (`LineType`)
- ✅ Interface `ProductionLine` atualizada
- ✅ Formulário frontend com seleção de tipo
- ✅ Badge visual na listagem
- ✅ Validações e formulários

Após executar a migration, reinicie os servidores com `npm run dev`.
