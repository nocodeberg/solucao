# ⚡ EXECUTAR MIGRATION - TIPO DE LINHA

## 🚀 Passo a Passo RÁPIDO (2 minutos)

### 1️⃣ Abra o Supabase SQL Editor
**Cole este link no navegador e aperte Enter:**
```
https://supabase.com/dashboard/project/csvhywnaiqfofudhwwgf/sql
```

### 2️⃣ Clique em "New Query"

### 3️⃣ Cole Este SQL (COPIE TUDO):

```sql
CREATE TYPE line_type AS ENUM ('GALVANOPLASTIA', 'VERNIZ');

ALTER TABLE production_lines
ADD COLUMN line_type line_type DEFAULT 'GALVANOPLASTIA';

CREATE INDEX idx_production_lines_type ON production_lines(line_type);

UPDATE production_lines
SET line_type = 'VERNIZ'
WHERE LOWER(name) LIKE '%verniz%' OR LOWER(description) LIKE '%verniz%';

COMMENT ON COLUMN production_lines.line_type IS 'Tipo de linha: GALVANOPLASTIA ou VERNIZ';
```

### 4️⃣ Clique em "RUN" (ou Ctrl+Enter)

### 5️⃣ Verifique se Funcionou

Cole e execute:
```sql
SELECT name, line_type FROM production_lines LIMIT 5;
```

Se aparecer a coluna `line_type`, **ESTÁ PRONTO!** ✅

---

## ✅ DEPOIS DA MIGRATION

Recarregue a página no navegador (F5) e:

1. Vá em **Gestão Áreas → Cadastro Processo**
2. Clique em **"+ Nova Linha"**
3. Você verá os botões:
   ```
   [ Galvanoplastia ] [ Verniz ]
   ```
4. Selecione o tipo e crie/edite suas linhas!

---

## 🎨 O QUE FOI ADICIONADO

✅ **Botões de seleção** no formulário (Galvanoplastia/Verniz)
✅ **Badge colorida** na listagem:
   - Azul para Galvanoplastia
   - Roxo para Verniz
✅ **Tipos TypeScript** atualizados
✅ **Interface completa** funcional

---

## ⚠️ SE DER ERRO

Se aparecer erro tipo "type already exists":
```sql
DROP TYPE IF EXISTS line_type CASCADE;
```

E execute a migration novamente.

---

## 🎉 PRONTO!

Após executar, o sistema estará 100% funcional com seleção de tipo!
