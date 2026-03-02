# Checklist de Correção - Lançamento de Produtos Químicos

## ✅ Passos para Fazer Funcionar Completamente

### 1. Corrigir as Policies RLS (OBRIGATÓRIO)

**Status**: ⚠️ Precisa ser executado no Supabase

**Arquivo**: `fix-rls-policies.sql`

**O que fazer**:
1. Abra: https://supabase.com/dashboard
2. Vá em: **SQL Editor**
3. Copie TODO o conteúdo do arquivo `fix-rls-policies.sql`
4. Cole no SQL Editor
5. Clique em **Run**

**Resultado esperado**:
```
status
Policies corrigidas com sucesso!
```

**Por quê?**:
- Sem isso, TODAS as queries ao Supabase falham com erro de recursão infinita
- É a causa raiz do problema

---

### 2. Inserir Produtos Químicos (OBRIGATÓRIO)

**Status**: ⚠️ Precisa ser executado no Supabase

**Arquivo**: `INSERIR-PRODUTOS-SIMPLES.sql`

**O que fazer**:
1. No mesmo **SQL Editor** do Supabase
2. Copie TODO o conteúdo do arquivo `INSERIR-PRODUTOS-SIMPLES.sql`
3. Cole no SQL Editor
4. Clique em **Run**

**Resultado esperado**:
```
linha         | produto                    | preco | unidade | ativo
--------------|----------------------------|-------|---------|------
Cobre Ácido   | ACTIVE ZMC                 | 10.00 | kg      | true
Cobre Ácido   | ANODO DE COBRE             | 50.00 | kg      | true
Cobre Ácido   | ÁCIDO SULFÚRICO            | 15.00 | L       | true
...
```

**Por quê?**:
- Sem produtos cadastrados, o modal fica vazio
- Insere 12 produtos padrão em todas as linhas de galvanoplastia

---

### 3. Verificar se Funcionou

**O que fazer**:
1. Recarregue a aplicação (F5)
2. Faça logout e login novamente (para limpar cache)
3. Vá em: **Gestão de Áreas > Linhas**
4. Clique no botão **Lançamento** de uma linha

**Resultado esperado**:
- Modal abre com o título: "Lançamento de Pré-Tratamento - [Nome da Linha]"
- Lista de meses no topo
- Tabela com produtos químicos:
  - Coluna "Produtos" com nomes
  - Coluna "Lançamento" com campos editáveis
  - Coluna "Consumo" (vazia inicialmente)
  - Coluna "Custo/kg"
  - Coluna "Custo Total"

---

## 🔍 Troubleshooting

### Problema: "Nenhum produto químico cadastrado"

**Possíveis causas**:

1. ❌ **Script de produtos não foi executado**
   - Solução: Execute `INSERIR-PRODUTOS-SIMPLES.sql`

2. ❌ **Produtos foram inseridos mas para outra empresa**
   - Solução: Verifique no SQL Editor:
   ```sql
   SELECT * FROM chemical_products;
   SELECT * FROM production_lines;
   ```

3. ❌ **Linha não é do tipo GALVANOPLASTIA**
   - Solução: O script só insere para linhas de galvanoplastia
   - Verifique o tipo da linha no banco

---

### Problema: Erro "infinite recursion detected"

**Causa**: Policies RLS não foram corrigidas

**Solução**: Execute `fix-rls-policies.sql` no Supabase

---

### Problema: Modal abre mas produtos não carregam

**Possíveis causas**:

1. ❌ **Cache do navegador**
   - Solução: Ctrl+Shift+Delete > Limpar cache

2. ❌ **Sessão antiga**
   - Solução: Faça logout e login novamente

3. ❌ **Erro de RLS**
   - Solução: Abra o Console do navegador (F12)
   - Veja se há erros relacionados a "policy" ou "permission"

---

### Problema: Produtos aparecem mas sem dados de consumo

**Isso é NORMAL!**

- A coluna "Consumo" só mostra dados quando:
  1. Você já fez lançamentos anteriormente
  2. Mudou de mês e tinha lançamentos naquele mês

- Inicialmente, a coluna "Consumo" ficará vazia (mostrando "-")

---

## 📝 Comandos SQL Úteis

### Ver todas as linhas de produção:
```sql
SELECT id, name, line_type, company_id
FROM production_lines
WHERE active = true;
```

### Ver todos os produtos químicos:
```sql
SELECT
  pl.name as linha,
  cp.name as produto,
  cp.unit_price as preco,
  cp.unit as unidade
FROM chemical_products cp
JOIN production_lines pl ON cp.production_line_id = pl.id
ORDER BY pl.name, cp.name;
```

### Adicionar um produto manualmente:
```sql
INSERT INTO chemical_products (company_id, production_line_id, name, unit_price, unit, active)
VALUES (
  'SEU_COMPANY_ID',
  'SEU_LINE_ID',
  'NOME DO PRODUTO',
  99.99,
  'kg',
  true
);
```

### Remover um produto:
```sql
UPDATE chemical_products
SET active = false
WHERE name = 'NOME DO PRODUTO'
  AND production_line_id = 'SEU_LINE_ID';
```

### Atualizar preço de um produto:
```sql
UPDATE chemical_products
SET unit_price = 123.45
WHERE name = 'NOME DO PRODUTO'
  AND production_line_id = 'SEU_LINE_ID';
```

---

## 🎯 Ordem de Execução

Execute NESTA ORDEM:

1. ✅ `fix-rls-policies.sql` (corrige recursão)
2. ✅ `INSERIR-PRODUTOS-SIMPLES.sql` (insere produtos)
3. ✅ Recarregar aplicação + logout/login
4. ✅ Testar modal de lançamento

---

## 📊 Status Atual

- [x] Código da aplicação corrigido
- [x] Script RLS criado
- [x] Script de produtos criado
- [ ] Script RLS executado no Supabase ⚠️ **VOCÊ PRECISA FAZER**
- [ ] Script de produtos executado no Supabase ⚠️ **VOCÊ PRECISA FAZER**
- [ ] Testado na aplicação

---

## ✅ Após Tudo Funcionar

Você poderá:
- ✅ Abrir modal de lançamento
- ✅ Ver produtos químicos da linha
- ✅ Inserir quantidades de lançamento
- ✅ Ver custos calculados automaticamente
- ✅ Salvar lançamentos
- ✅ Trocar de mês e ver lançamentos salvos
- ✅ Ver consumo dos produtos nos meses seguintes
