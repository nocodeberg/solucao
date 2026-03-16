# ✅ Passo a Passo - Lançamentos de Produtos

## 📋 Alterações Realizadas

O sistema foi modificado para que o popup "Realizar lançamento de Linha" mostre os **produtos de matéria-prima** cadastrados em cada linha.

### Antes:
- Popup buscava produtos da tabela `chemical_products` (produtos químicos)
- Produtos eram cadastrados em "Lançamento de Pré-Tratamento"

### Agora:
- Popup busca produtos da tabela `products` (matéria-prima)
- Produtos são cadastrados pelo botão "+ Novo produto" na própria página de linhas
- Ao clicar em "Realizar lançamento de Linha", aparecem os produtos daquela linha

---

## 🚨 IMPORTANTE: Execute a Migration SQL

Para o sistema funcionar corretamente, você precisa criar a tabela `product_launches` no Supabase.

### Passos:

1. **Acesse o Supabase Dashboard**
   - Vá para: https://supabase.com/dashboard

2. **Abra o SQL Editor**
   - No menu lateral, clique em "SQL Editor"

3. **Copie o SQL**
   - Abra o arquivo: `C:\Users\bergn\OneDrive\Documentos\projetos\Clayton Malta\solucao-industrial\supabase\add-product-launches.sql`
   - Copie todo o conteúdo

4. **Execute o SQL**
   - Cole no SQL Editor do Supabase
   - Clique em "Run" ou pressione Ctrl+Enter

5. **Verifique**
   - Vá em "Database" > "Tables"
   - Confirme que a tabela `product_launches` foi criada

---

## 🎯 Como Usar o Sistema Agora

### 1. Cadastrar Produtos de Matéria-Prima

Na página **"Cadastro Processo"** (Gestão Áreas > Cadastro Processo):

1. Expanda a linha desejada (ex: "Cobre Ácido")
2. Clique em **"+ Novo produto"**
3. Preencha:
   - Nome: Ex: "teste 003"
   - Valor: Ex: R$ 30,00
   - Publicar: Ativado
4. Salvar

### 2. Realizar Lançamento

Na mesma página:

1. Clique em **"Realizar lançamento de Linha"** na linha desejada
2. O popup abrirá mostrando todos os produtos cadastrados naquela linha
3. Selecione o mês/ano
4. Preencha as quantidades de cada produto
5. Clique em **"Salvar Lançamentos"**

### 3. Visualizar Lançamentos

Os lançamentos são salvos na tabela `product_launches` com:
- Produto
- Linha de produção
- Mês/Ano
- Quantidade
- Custo total (quantidade × valor unitário)

---

## 📁 Arquivos Modificados

1. **`app/gestao-areas/linhas/page.tsx`**
   - Modificado para usar produtos de matéria-prima
   - Salva lançamentos em `product_launches`

2. **`types/database.types.ts`**
   - Adicionado interface `ProductLaunch`
   - Adicionada tabela no tipo `Database`

3. **`supabase/add-product-launches.sql`**
   - SQL para criar tabela `product_launches`
   - Inclui RLS e policies de segurança

4. **`scripts/create-product-launches-table.js`**
   - Script helper (não funcionou automaticamente)

---

## ⚠️ Observações

- Após executar o SQL no Supabase, remova os comentários `@ts-ignore` do código se desejar
- A tabela `chemical_products` e página "Lançamento de Pré-Tratamento" continuam funcionando normalmente
- Agora existem DOIS tipos de lançamentos:
  - **Lançamentos de Produtos** (matéria-prima) → `product_launches`
  - **Lançamentos de Produtos Químicos** → `chemical_product_launches`

---

## ✅ Teste Final

Depois de executar o SQL:

1. Acesse a página de Cadastro Processo
2. Adicione um produto em uma linha
3. Clique em "Realizar lançamento de Linha"
4. Deve aparecer o produto adicionado no popup
5. Preencha quantidade e salve
6. Deve salvar sem erros!

---

## 🆘 Problemas?

Se encontrar o erro "Internal Server Error":
- Verifique se executou o SQL no Supabase
- Verifique as permissões RLS
- Verifique o console do navegador para detalhes
