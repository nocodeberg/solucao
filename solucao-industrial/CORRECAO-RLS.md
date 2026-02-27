# Correção do Erro de Recursão Infinita nas Políticas RLS

## Problema

Erro: `infinite recursion detected in policy for relation "profiles"`

Este erro ocorre ao tentar carregar produtos químicos ou outros dados porque as políticas RLS (Row Level Security) do Supabase fazem subqueries recursivas na tabela `profiles`.

## Causa

As políticas RLS estavam fazendo consultas recursivas:

```sql
-- ❌ ERRADO - Causa recursão infinita
CREATE POLICY "Users can view profiles in their company"
  ON profiles FOR SELECT
  USING (
    company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
  );
```

Quando você consulta a tabela `profiles`, a policy executa uma subquery em `profiles`, que por sua vez aciona a mesma policy novamente, criando um loop infinito.

## Solução

A solução é criar uma função helper que não aciona as policies RLS:

```sql
-- ✅ CORRETO - Função helper evita recursão
CREATE OR REPLACE FUNCTION public.user_company_id()
RETURNS UUID
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
  SELECT company_id FROM public.profiles WHERE id = auth.uid() LIMIT 1;
$$;

-- ✅ CORRETO - Policy usa a função
CREATE POLICY "Users can view profiles in their company"
  ON profiles FOR SELECT
  USING (company_id = public.user_company_id());
```

**Nota**: A função é criada no schema `public` ao invés de `auth` porque o Supabase não permite criar funções no schema `auth` via SQL Editor.

## Como Aplicar a Correção

### Passo 1: Acessar o Supabase SQL Editor

1. Acesse o [Supabase Dashboard](https://supabase.com/dashboard)
2. Selecione seu projeto
3. No menu lateral, clique em **SQL Editor**

### Passo 2: Executar o Script de Correção

1. Abra o arquivo `fix-rls-policies.sql` deste projeto
2. Copie todo o conteúdo do arquivo
3. Cole no SQL Editor do Supabase
4. Clique em **Run** (ou pressione Ctrl+Enter)

### Passo 3: Verificar se a Correção Foi Aplicada

Ao final da execução, você deve ver:

```
status
Policies corrigidas com sucesso!
```

E uma lista de todas as políticas criadas por tabela.

## O Que o Script Faz

1. **Cria função helper**: `auth.user_company_id()` que retorna o company_id do usuário sem causar recursão

2. **Remove políticas antigas**: Drop de todas as políticas problemáticas

3. **Cria novas políticas**: Recria todas as políticas usando a função helper

## Tabelas Corrigidas

O script corrige as políticas RLS das seguintes tabelas:

- ✅ `profiles`
- ✅ `production_lines`
- ✅ `products`
- ✅ `groups`
- ✅ `pieces`
- ✅ `employees`
- ✅ `cargos`
- ✅ `encargos`
- ✅ `lancamento_mo`
- ✅ `manutencao`
- ✅ `consumo_agua`
- ✅ `chemical_products` (Produtos Químicos)
- ✅ `chemical_product_launches` (Lançamentos de Produtos Químicos)

## Testando Após a Correção

Depois de executar o script:

1. Recarregue a aplicação (F5)
2. Tente acessar a página de **Gestão de Áreas > Linhas**
3. Clique no botão **Lançamento** de uma linha de pré-tratamento
4. Os produtos químicos devem carregar sem erros

## Troubleshooting

### Erro: "function auth.user_company_id() already exists"

Se você já executou parte do script anteriormente, pode ignorar este erro. O `CREATE OR REPLACE` vai atualizar a função.

### Erro: "policy does not exist"

Isso é normal se algumas políticas já foram removidas anteriormente. O `DROP POLICY IF EXISTS` vai ignorar políticas que não existem.

### Os dados ainda não carregam

1. Verifique se você está logado na aplicação
2. Limpe o cache do navegador (Ctrl+Shift+Delete)
3. Faça logout e login novamente
4. Verifique o console do navegador (F12) para outros erros

## Prevenção

Para evitar este problema no futuro:

- Nunca crie policies que fazem subqueries na mesma tabela que estão protegendo
- Sempre use funções helper como `auth.user_company_id()` para acessar dados do usuário atual
- Teste as policies com `EXPLAIN` antes de aplicar em produção

## Suporte

Se o problema persistir após aplicar a correção:

1. Verifique os logs do Supabase
2. Confirme que todas as políticas foram criadas corretamente
3. Entre em contato com o desenvolvedor do sistema
