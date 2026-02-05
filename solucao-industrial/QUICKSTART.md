# 🚀 Início Rápido - Solução Industrial

## ⚡ 5 Passos para Começar

### 1. Instalar dependências
```bash
cd solucao-industrial
npm install
```

### 2. Configurar Supabase
1. Crie uma conta em [supabase.com](https://supabase.com)
2. Crie um novo projeto
3. No SQL Editor, execute todo o conteúdo de `supabase/schema.sql`

### 3. Configurar variáveis de ambiente
```bash
cp .env.example .env.local
```

Edite `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_anon
SUPABASE_SERVICE_ROLE_KEY=sua_chave_service
```

### 4. Criar empresa e usuário

**No SQL Editor do Supabase:**

```sql
-- 1. Criar empresa
INSERT INTO companies (name, cnpj, email, active)
VALUES ('Minha Empresa', '00.000.000/0000-00', 'contato@empresa.com', true);

-- 2. Copiar o ID da empresa
SELECT id FROM companies ORDER BY created_at DESC LIMIT 1;
```

**No painel Authentication > Users:**
- Clique em "Add user"
- Email: `admin@empresa.com`
- Password: `Admin@123456` (troque depois!)
- Metadata:
```json
{
  "full_name": "Administrador"
}
```

**Volte ao SQL Editor:**
```sql
-- 3. Vincular usuário à empresa
UPDATE profiles
SET
  company_id = 'COLE_O_ID_DA_EMPRESA_AQUI',
  role = 'ADMIN'
WHERE email = 'admin@empresa.com';
```

### 5. Iniciar o projeto
```bash
npm run dev
```

Acesse: [http://localhost:3000](http://localhost:3000)

**Login:**
- Email: `admin@empresa.com`
- Senha: `Admin@123456`

## 📱 Próximos Passos

### Cadastrar Encargos
Os encargos são inseridos automaticamente ao criar uma empresa, mas você pode editá-los em:
**Configurações > Encargos**

### Cadastrar Cargos
Vá em **RH > Cadastro Cargos** e adicione:
- Operador
- Líder
- Supervisor
- Técnico Químico
- etc.

### Cadastrar Linhas de Produção
Vá em **Gestão Áreas > Cadastro Processo** e adicione:
- Pré-Tratamento
- Cobre Alcalino
- Cobre Ácido
- etc.

### Cadastrar Grupos
Vá em **Gestão Áreas > Cadastro Grupos** e adicione:
- Cromo
- Níquel Strike
- Verniz Cataforético
- etc.

### Cadastrar Funcionários
Vá em **Gestão Colaboradores > Funcionários** e comece a adicionar sua equipe.

### Fazer Lançamentos
Vá em **Gestão Colaboradores > Lançamento M.O** para registrar custos de mão de obra.

## 🎯 Estrutura Recomendada

1. ✅ Criar empresa e usuário admin
2. ✅ Configurar encargos trabalhistas
3. ✅ Cadastrar cargos
4. ✅ Cadastrar linhas de produção
5. ✅ Cadastrar grupos de acabamento
6. ✅ Cadastrar funcionários
7. ✅ Fazer lançamentos de mão de obra
8. ✅ Registrar manutenções
9. ✅ Registrar consumo de água
10. ✅ Visualizar dashboard e gerar relatórios

## 🆘 Problemas Comuns

### "Invalid API Key"
- Verifique se copiou corretamente as chaves do Supabase
- Certifique-se de que está usando `.env.local` e não `.env`
- Reinicie o servidor: `Ctrl+C` e depois `npm run dev`

### "User não tem permissão"
- Verifique se o usuário tem `company_id` definido
- Confirme que a role está como 'ADMIN'
- Execute no SQL:
```sql
SELECT * FROM profiles WHERE email = 'seu@email.com';
```

### Dashboard vazio
- Isso é normal em um sistema novo
- Comece cadastrando funcionários e fazendo lançamentos

### Página em branco
- Abra o console do navegador (F12)
- Verifique se há erros
- Confirme que o schema SQL foi executado completamente

## 📚 Documentação Completa

Para mais detalhes, consulte o [README.md](./README.md)

## 💬 Suporte

Precisa de ajuda? Entre em contato através do repositório.

---

**Boa sorte! 🚀**
