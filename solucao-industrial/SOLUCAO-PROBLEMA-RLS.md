# 🚨 PROBLEMA: RLS POLICIES BLOQUEANDO

## 🔍 DIAGNÓSTICO

Você testou:
- ✅ SQL correto
- ✅ Dados corretos
- ✅ Modo anônimo
- ❌ **Ainda não funciona**

## 🎯 CAUSA PROVÁVEL: RLS (Row Level Security)

As RLS policies do Supabase podem estar bloqueando a leitura dos produtos, mesmo com os filtros corretos.

## 🛠️ SOLUÇÃO COMPLETA

### Passo 1: VERIFICAR RLS POLICIES
Execute este SQL para verificar as políticas:
```sql
-- Copie de: supabase/VERIFICAR-RLS-POLICIES.sql
```

### Passo 2: DESABILITAR RLS TEMPORARIAMENTE
Se houver políticas bloqueando, desabilite temporariamente:
```sql
-- Desabilitar RLS para teste
ALTER TABLE chemical_products DISABLE ROW LEVEL SECURITY;

-- Verificar se funciona agora
SELECT cp.id, cp.name, cp.production_line_id, pl.name as linha
FROM chemical_products cp
INNER JOIN production_lines pl ON cp.production_line_id = pl.id
WHERE cp.active = true;
```

### Passo 3: REABILITAR RLS COM POLÍTICA CORRETA
```sql
-- Reabilitar RLS
ALTER TABLE chemical_products ENABLE ROW LEVEL SECURITY;

-- Criar política correta se necessário
CREATE POLICY "Users can view their company products" ON chemical_products
FOR SELECT USING (company_id = current_setting('app.company_id'));

-- Ou remover política problemática
DROP POLICY IF EXISTS "nome_da_politica_problematica" ON chemical_products;
```

## 📋 TESTE FINAL

1. Execute o SQL de verificação de RLS
2. Se houver políticas, desabilite RLS temporariamente
3. Teste o sistema
4. Se funcionar, crie políticas corretas
5. Reabilite RLS

## 🔧 SINTOMAS DE RLS PROBLEMÁTICA

- Queries funcionam no SQL direto
- Mesmas queries não funcionam no app
- Erros de permissão no console
- Dados não aparecem apesar de corretos

## 🚀 AÇÃO IMEDIATA

Execute o SQL de verificação de RLS policies para identificar o problema.

As RLS são a causa mais provável quando:
- SQL direto funciona
- Código está correto
- Dados estão corretos
- Modo anônimo não resolve

**Verifique as RLS policies agora!** 🔍
