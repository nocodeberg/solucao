# 🔧 Correção Completa de Vinculação de Produtos às Linhas

## 📋 Problema Identificado

Produtos químicos podem estar vinculados a linhas de produção de **outras empresas**, causando o problema de filtragem no modal de lançamento.

O código filtra por:
1. `company_id` do usuário logado
2. `production_line_id` da linha selecionada

Se o produto estiver vinculado a uma linha de outra empresa, ele não aparece.

## ✅ Solução em 4 Passos

Execute os arquivos SQL **NA ORDEM** no Supabase SQL Editor:

### **Passo 1: Diagnóstico**
📄 Arquivo: `correcao-completa-1-diagnostico.sql`

**O que faz:** Lista todos os produtos com problemas:
- `SEM_LINHA` - Produto sem linha vinculada
- `LINHA_INVALIDA` - Produto vinculado a linha que não existe
- `EMPRESA_DIFERENTE` - Produto vinculado a linha de outra empresa

**Resultado esperado:** Lista de produtos com problemas (se houver)

---

### **Passo 2: Correção**
📄 Arquivo: `correcao-completa-2-corrigir.sql`

**O que faz:** Corrige automaticamente todos os produtos problemáticos:
1. Remove vinculações a linhas de outras empresas
2. Vincula produtos à primeira linha ativa da **mesma empresa**
3. Prioriza linhas por tipo (Pré-tratamento → Cobre → Níquel → Cromo)

**⚠️ IMPORTANTE:** Este script faz UPDATE na base de dados!

**Resultado esperado:** `UPDATE XX` (onde XX é o número de produtos corrigidos)

---

### **Passo 3: Verificação**
📄 Arquivo: `correcao-completa-3-verificar.sql`

**O que faz:** Verifica se ainda existem problemas após a correção

**Resultado esperado:**
```
status    | quantidade
----------|----------
OK        | 244
```

Se aparecer qualquer outro status (`SEM_LINHA`, `EMPRESA_DIFERENTE`), há produtos que não puderam ser corrigidos automaticamente.

---

### **Passo 4: Resumo Final**
📄 Arquivo: `correcao-completa-4-resumo.sql`

**O que faz:** Mostra resumo de produtos por empresa e linha

**Resultado esperado:** Tabela mostrando distribuição de produtos por linha

---

## 🎯 Após Executar a Correção

1. **Atualize a página** do aplicativo (F5)
2. **Vá para**: Gestão de Áreas → Linhas de Produção
3. **Clique em "Realizar lançamento"** em qualquer linha
4. **Verifique** se os produtos agora aparecem corretamente

## 🔍 Se o Problema Persistir

Abra o Console do navegador (F12) e me envie os logs que aparecem ao clicar em "Realizar lançamento".

## 📊 Diagnóstico Anterior

O arquivo `diagnostico-produtos.sql` mostrou que todos os 244 produtos têm status `COM LINHA`, mas não verificou se essas linhas pertencem à mesma empresa do produto.

Esta correção resolve esse problema específico.
