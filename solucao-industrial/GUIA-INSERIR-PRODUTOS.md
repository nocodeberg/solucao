# Guia para Inserir Produtos Químicos por Linha

## 📋 Passo a Passo

### 1. Acesse o Supabase SQL Editor
- Vá em: https://supabase.com/dashboard
- Selecione seu projeto
- Clique em: **SQL Editor** (menu lateral)

---

### 2. Execute a Primeira Query (Listar Linhas)

Cole e execute este SQL:

```sql
SELECT
  id,
  name,
  line_type,
  company_id
FROM production_lines
WHERE active = true
ORDER BY name;
```

**Resultado esperado:**
```
id                                    | name              | line_type
--------------------------------------|-------------------|----------------
a1b2c3d4-e5f6-7890-abcd-ef1234567890 | Cobre Ácido       | GALVANOPLASTIA
b2c3d4e5-f6a7-8901-bcde-f12345678901 | Níquel Brilhante  | GALVANOPLASTIA
```

**✅ Copie o ID da linha que você quer** (ex: `a1b2c3d4-e5f6-7890-abcd-ef1234567890`)

---

### 3. Prepare a Lista de Produtos REAIS

Abra um editor de texto e liste os produtos químicos **que você realmente usa** nessa linha.

**Exemplo para linha de Cobre Ácido:**

```
Produto                      | Preço Real | Unidade
-----------------------------|------------|----------
SODA CÁUSTICA               | 10.50      | kg
DESENGRAXANTE ALCALINO      | 12.00      | kg
ÁCIDO CLORÍDRICO 30%        | 8.50       | L
ÁCIDO SULFÚRICO 50%         | 15.00      | L
SULFATO DE COBRE            | 75.00      | kg
ÁCIDO SULFÚRICO 98%         | 18.00      | L
BRILHANTE COBRE ÁCIDO       | 120.00     | L
NIVELADOR COBRE             | 150.00     | L
ANODO DE COBRE              | 50.00      | kg
ATIVADOR                    | 25.00      | L
SELANTE                     | 30.00      | L
```

---

### 4. Monte o Script de Inserção

```sql
INSERT INTO chemical_products (company_id, production_line_id, name, unit_price, unit, active)
SELECT
  pl.company_id,
  pl.id,
  produto.name,
  produto.price,
  produto.unit,
  true
FROM production_lines pl
CROSS JOIN (
  VALUES
    -- COLE SEUS PRODUTOS AQUI, NO FORMATO:
    -- ('NOME DO PRODUTO', PREÇO, 'UNIDADE'),

    ('SODA CÁUSTICA', 10.50, 'kg'),
    ('DESENGRAXANTE ALCALINO', 12.00, 'kg'),
    ('ÁCIDO CLORÍDRICO 30%', 8.50, 'L'),
    ('ÁCIDO SULFÚRICO 50%', 15.00, 'L'),
    ('SULFATO DE COBRE', 75.00, 'kg'),
    ('ÁCIDO SULFÚRICO 98%', 18.00, 'L'),
    ('BRILHANTE COBRE ÁCIDO', 120.00, 'L'),
    ('NIVELADOR COBRE', 150.00, 'L'),
    ('ANODO DE COBRE', 50.00, 'kg'),
    ('ATIVADOR', 25.00, 'L'),
    ('SELANTE', 30.00, 'L')
) AS produto(name, price, unit)
WHERE pl.id = 'COLE_O_ID_DA_LINHA_AQUI'  -- ← IMPORTANTE: Substitua pelo ID copiado no passo 2
  AND NOT EXISTS (
    SELECT 1 FROM chemical_products cp
    WHERE cp.production_line_id = pl.id
      AND cp.name = produto.name
  );
```

**⚠️ ATENÇÃO:**
- Substitua `'COLE_O_ID_DA_LINHA_AQUI'` pelo ID que você copiou no passo 2
- Edite os produtos com os nomes, preços e unidades REAIS
- A última linha não deve ter vírgula no final

---

### 5. Execute o Script de Inserção

- Cole o script no SQL Editor
- Clique em **Run**
- Aguarde a confirmação

---

### 6. Verifique se Funcionou

Execute esta query:

```sql
SELECT
  pl.name as linha,
  cp.name as produto,
  cp.unit_price as preco,
  cp.unit as unidade,
  cp.active as ativo
FROM chemical_products cp
JOIN production_lines pl ON cp.production_line_id = pl.id
ORDER BY pl.name, cp.name;
```

**Resultado esperado:**
```
linha         | produto                    | preco  | unidade | ativo
--------------|----------------------------|--------|---------|------
Cobre Ácido   | ATIVADOR                   | 25.00  | L       | true
Cobre Ácido   | ÁCIDO CLORÍDRICO 30%       | 8.50   | L       | true
Cobre Ácido   | ÁCIDO SULFÚRICO 50%        | 15.00  | L       | true
...
```

---

### 7. Teste na Aplicação

1. Recarregue a aplicação (F5)
2. Vá em **Gestão de Áreas > Linhas**
3. Clique em **Lançamento** na linha que você configurou
4. Os produtos devem aparecer! ✅

---

## 🔄 Para Adicionar Produtos em Outras Linhas

Repita os passos 2-6, usando o ID da outra linha.

---

## ❓ Dúvidas Comuns

### Os produtos não aparecem na aplicação?
- Limpe o cache do navegador (Ctrl+Shift+Delete)
- Faça logout e login novamente
- Verifique se executou o script `fix-rls-policies.sql` antes

### Quero adicionar mais produtos depois?
- Execute novamente o INSERT com os novos produtos
- O script não duplica produtos existentes

### Quero mudar o preço de um produto?
Execute:
```sql
UPDATE chemical_products
SET unit_price = 99.99
WHERE name = 'NOME DO PRODUTO'
  AND production_line_id = 'ID_DA_LINHA';
```

### Quero remover um produto?
Execute:
```sql
UPDATE chemical_products
SET active = false
WHERE name = 'NOME DO PRODUTO'
  AND production_line_id = 'ID_DA_LINHA';
```

---

## 📝 Notas Importantes

- **Sempre use preços reais** - Esses valores serão usados nos cálculos de custo
- **Use unidades corretas** - 'kg', 'L', 'unidade', 'g', 'mL', etc
- **Nomes claros** - Use nomes que você reconheça facilmente
- **Mantenha atualizado** - Quando os preços mudarem, atualize no banco

---

## 🎯 Exemplo Completo

```sql
-- 1. Ver linhas
SELECT id, name FROM production_lines WHERE active = true;

-- 2. Inserir produtos (substitua o ID)
INSERT INTO chemical_products (company_id, production_line_id, name, unit_price, unit, active)
SELECT
  pl.company_id,
  pl.id,
  produto.name,
  produto.price,
  produto.unit,
  true
FROM production_lines pl
CROSS JOIN (
  VALUES
    ('SODA CÁUSTICA', 10.50, 'kg'),
    ('SULFATO DE COBRE', 75.00, 'kg'),
    ('ÁCIDO SULFÚRICO', 15.00, 'L')
) AS produto(name, price, unit)
WHERE pl.id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'
  AND NOT EXISTS (
    SELECT 1 FROM chemical_products cp
    WHERE cp.production_line_id = pl.id
      AND cp.name = produto.name
  );

-- 3. Verificar
SELECT pl.name, cp.name, cp.unit_price, cp.unit
FROM chemical_products cp
JOIN production_lines pl ON cp.production_line_id = pl.id;
```
