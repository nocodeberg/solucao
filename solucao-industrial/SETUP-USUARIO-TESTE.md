# 🔐 Configuração do Usuário de Teste

## Passo 1: Executar o Schema SQL no Supabase

1. Acesse o painel do Supabase: https://supabase.com/dashboard
2. Selecione seu projeto: `csvhywnaiqfofudhwwgf`
3. Vá em **SQL Editor** (ícone de código no menu lateral)
4. Clique em **New Query**
5. Copie TODO o conteúdo do arquivo `supabase/schema.sql`
6. Cole no editor SQL
7. Clique em **Run** (ou pressione Ctrl+Enter)

**Aguarde a execução completa!** Deve criar todas as 12 tabelas.

---

## Passo 2: Criar Empresa de Teste

No **SQL Editor**, execute o seguinte comando:

```sql
-- Criar empresa de teste
INSERT INTO companies (name, cnpj, address, city, state, phone)
VALUES (
  'Indústria Teste LTDA',
  '12.345.678/0001-90',
  'Rua das Indústrias, 123',
  'São Paulo',
  'SP',
  '(11) 98765-4321'
) RETURNING *;
```

**Copie o `id` da empresa retornado** (algo como `550e8400-e29b-41d4-a716-446655440000`).

---

## Passo 3: Criar Usuário Admin de Teste

### 3.1. Criar usuário no Supabase Auth

1. No painel do Supabase, vá em **Authentication** → **Users**
2. Clique em **Add user** → **Create new user**
3. Preencha:
   - **Email**: `admin@teste.com`
   - **Password**: `Admin@123`
   - Marque **Auto Confirm User** (para não precisar confirmar email)
4. Clique em **Create user**
5. **Copie o `User UID`** que aparece (algo como `a1b2c3d4-...`)

### 3.2. Criar perfil no banco de dados

No **SQL Editor**, execute (substitua os valores):

```sql
-- Criar perfil de administrador
-- SUBSTITUA:
--   'USER_UID_AQUI' pelo User UID copiado
--   'COMPANY_ID_AQUI' pelo ID da empresa copiado

INSERT INTO profiles (id, company_id, full_name, role)
VALUES (
  'USER_UID_AQUI',
  'COMPANY_ID_AQUI',
  'Administrador Teste',
  'ADMIN'
) RETURNING *;
```

---

## Passo 4: Reiniciar o Backend

O backend já está configurado com as credenciais corretas!

Se precisar reiniciar:

```bash
# Pressione Ctrl+C no terminal
# Depois execute:
npm run dev
```

---

## 📝 Credenciais de Login

Acesse: **http://localhost:3000/login**

- **Email**: `admin@teste.com`
- **Senha**: `Admin@123`

---

## ✅ Verificação

Após o login, você deve:

1. Ver o nome "Administrador Teste" no header
2. Ter acesso completo (role ADMIN)
3. Ver os dados da empresa "Indústria Teste LTDA"

---

## 🚨 Troubleshooting

### Erro: "Email not confirmed"

Execute no SQL Editor:

```sql
UPDATE auth.users
SET email_confirmed_at = NOW()
WHERE email = 'admin@teste.com';
```

### Erro: "Invalid login credentials"

Verifique se:
- O email está correto
- A senha está correta (case-sensitive)
- O usuário foi criado no Supabase Auth

### Erro: "Profile not found"

Execute:

```sql
SELECT * FROM profiles WHERE id = 'SEU_USER_UID';
```

Se retornar vazio, recrie o perfil com o comando do Passo 3.2.

---

## 🔒 Segurança

**IMPORTANTE**: Estas são credenciais de TESTE.

Em **produção**:
- Troque `JWT_SECRET` e `API_KEY` no `server/.env`
- Use senhas fortes
- Ative autenticação de 2 fatores
- Configure políticas RLS no Supabase

---

**Backend configurado e pronto!** 🚀
