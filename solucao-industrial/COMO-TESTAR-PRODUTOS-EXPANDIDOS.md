# 🔍 Como Testar - Produtos Químicos na Lista Expandida

## ⚠️ IMPORTANTE - Siga EXATAMENTE esta ordem:

### **PASSO 1: Verificar se produtos existem no banco**

1. Abra o Supabase: https://supabase.com/dashboard
2. Vá em **SQL Editor**
3. Abra o arquivo `VERIFICAR-PRODUTOS-EXISTEM.sql`
4. Cole o conteúdo e clique em **Run**

**O que você deve ver:**
```
linha               | total_produtos_quimicos
--------------------|------------------------
Cobre Ácido        | 17
Níquel Brilhante   | 13
... etc
```

**Se aparecer 0 produtos:**
- ❌ Os produtos NÃO foram inseridos
- ✅ Execute o arquivo `PRODUTOS-ESPECIFICOS-FINAIS.sql` no Supabase
- ✅ Depois volte e execute `VERIFICAR-PRODUTOS-EXISTEM.sql` novamente

---

### **PASSO 2: Verificar os logs no navegador**

1. Abra a aplicação: http://localhost:3000
2. Faça login
3. Vá em: **Gestão de Áreas** > **Linhas**
4. **ANTES de expandir qualquer linha**, abra o **Console do Navegador**:
   - Windows: Pressione **F12**
   - Mac: Pressione **Cmd + Option + I**
5. Vá na aba **Console**

**O que você deve ver:**
```
🔍 Carregando produtos químicos para company_id: [algum UUID]
✅ Produtos químicos carregados: 17
📦 Dados: [Array com produtos]
```

**Se você ver:**
```
⚠️ Nenhum company_id encontrado no profile
```
**Ou:**
```
❌ Erro ao carregar produtos químicos: [mensagem de erro]
```
➡️ **PARE AQUI** e me envie o erro exato que apareceu.

---

### **PASSO 3: Expandir uma linha e verificar**

1. No console ainda aberto, clique na **SETA** ao lado de uma linha (ex: "Cobre Ácido")
2. A linha vai expandir
3. **Observe no console:**

**O que você deve ver:**
```
🎨 Renderizando linha expandida: Cobre Ácido
📊 Produtos químicos desta linha: 17
📋 Dados dos produtos químicos: [Array com 17 produtos]
```

**E na TELA você deve ver:**

```
┌──────────────────────────────────────────────────────┐
│ Produtos Químicos (17)                   [fundo azul]│
│━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━│
│ SULFATO DE COBRE...    | R$ 68,90  | kg             │
│ BRILHANTE PRIMÁRIO...  | R$ 145,00 | L              │
│ ... (15 mais)                                        │
└──────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────┐
│ Produtos / Matéria-Prima (0)             [fundo branco]│
│━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━│
│ Nenhum produto de matéria-prima cadastrado           │
└──────────────────────────────────────────────────────┘
```

---

## 🚨 Cenários de Erro e Soluções

### **Cenário 1: Console mostra 0 produtos carregados**
```
✅ Produtos químicos carregados: 0
```
**Solução:**
- Execute `PRODUTOS-ESPECIFICOS-FINAIS.sql` no Supabase
- Recarregue a página (F5)

---

### **Cenário 2: Console mostra erro de RLS**
```
❌ Erro: infinite recursion detected
```
**Solução:**
- Execute `fix-rls-policies.sql` no Supabase
- Recarregue a página (F5)

---

### **Cenário 3: Produtos carregam mas não aparecem na tela**
```
✅ Produtos químicos carregados: 17
🎨 Renderizando linha expandida: Cobre Ácido
📊 Produtos químicos desta linha: 0
```
**Problema:** Os produtos não estão associados à linha correta

**Solução:**
Execute no Supabase:
```sql
-- Ver quais linhas existem e seus IDs
SELECT id, name FROM production_lines WHERE active = true;

-- Ver produtos e suas linhas
SELECT
  cp.name as produto,
  pl.name as linha,
  cp.production_line_id
FROM chemical_products cp
LEFT JOIN production_lines pl ON pl.id = cp.production_line_id
WHERE cp.active = true;
```

Se os `production_line_id` estiverem NULL ou errados, execute novamente:
`PRODUTOS-ESPECIFICOS-FINAIS.sql`

---

### **Cenário 4: Nada aparece no console**
**Problema:** Código antigo ainda em cache

**Solução:**
1. **Hard Reload** no navegador:
   - Windows: **Ctrl + Shift + R**
   - Mac: **Cmd + Shift + R**
2. Ou limpe o cache:
   - Windows: **Ctrl + Shift + Delete**
   - Mac: **Cmd + Shift + Delete**
3. Recarregue a página (F5)

---

## ✅ Checklist Final

Antes de me reportar que "não está aparecendo", verifique:

- [ ] Executei `VERIFICAR-PRODUTOS-EXISTEM.sql` e vi produtos no resultado
- [ ] Produtos existem no banco de dados (total > 0)
- [ ] Abri o console do navegador (F12)
- [ ] Vi a mensagem "✅ Produtos químicos carregados: X" (onde X > 0)
- [ ] Expandir a linha mostra "📊 Produtos químicos desta linha: X" (onde X > 0)
- [ ] Fiz Hard Reload (Ctrl + Shift + R)
- [ ] Tentei em navegador anônimo / privado

---

## 📸 Se ainda não funcionar, me envie:

1. **Screenshot do console** mostrando os logs
2. **Screenshot da tela** mostrando a lista expandida
3. **Resultado da query** `VERIFICAR-PRODUTOS-EXISTEM.sql`

---

## 🎯 Código foi modificado em:

- ✅ `app/gestao-areas/linhas/page.tsx` - Adicionado carregamento de produtos químicos
- ✅ Adicionados console.log para debug
- ✅ Renderização de duas seções (azul + branco)

**Agora é só seguir os passos acima!** 🚀
