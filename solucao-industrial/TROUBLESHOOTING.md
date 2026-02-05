# 🔧 Troubleshooting - Solução Industrial

## 🚨 Problemas Comuns e Soluções

### 1. Erro: "Invalid API Key" ou "supabaseUrl required"

**Causa**: Variáveis de ambiente não configuradas corretamente.

**Solução**:
```bash
# 1. Verifique se o arquivo .env.local existe
ls -la .env.local  # ou dir .env.local no Windows

# 2. Confirme o conteúdo
cat .env.local  # ou type .env.local no Windows

# 3. Reinicie o servidor
# Pressione Ctrl+C para parar
npm run dev
```

**Checklist**:
- ✅ Arquivo deve se chamar `.env.local` (não `.env`)
- ✅ Variáveis não podem ter espaços: `NEXT_PUBLIC_SUPABASE_URL=valor`
- ✅ URL deve terminar com `.supabase.co`
- ✅ Chaves devem começar com `eyJ...`

---

### 2. Página em branco após login

**Causa**: Schema do banco não foi executado corretamente.

**Solução**:
1. Acesse o Supabase → SQL Editor
2. Execute cada comando do `supabase/schema.sql` separadamente
3. Verifique se há erros no console

**Verificar se as tabelas existem**:
```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
```

Deve mostrar: companies, profiles, production_lines, etc.

---

### 3. Usuário não aparece após criar conta

**Causa**: Profile não foi criado ou company_id não foi vinculado.

**Solução**:
```sql
-- Verificar se o profile existe
SELECT * FROM profiles WHERE email = 'seu@email.com';

-- Se não existir, criar manualmente
INSERT INTO profiles (id, company_id, role, full_name, email, active)
VALUES (
  'UUID_DO_USUARIO',  -- Copie do Auth > Users
  'UUID_DA_EMPRESA',
  'ADMIN',
  'Nome do Usuário',
  'seu@email.com',
  true
);

-- Se existir mas não tem company_id
UPDATE profiles
SET company_id = 'UUID_DA_EMPRESA', role = 'ADMIN'
WHERE email = 'seu@email.com';
```

---

### 4. Erro: "new row violates row-level security policy"

**Causa**: RLS policies estão bloqueando a inserção.

**Solução**:
```sql
-- Verificar se o usuário está vinculado à empresa
SELECT
  p.email,
  p.company_id,
  p.role,
  c.name as empresa
FROM profiles p
LEFT JOIN companies c ON c.id = p.company_id
WHERE p.email = 'seu@email.com';

-- Se company_id estiver NULL, vincular
UPDATE profiles
SET company_id = (SELECT id FROM companies LIMIT 1)
WHERE email = 'seu@email.com';
```

---

### 5. Dashboard mostrando valores zerados

**Causa**: Não há dados lançados no período selecionado.

**Solução**:
1. Cadastre funcionários em **RH > Funcionários**
2. Faça lançamentos em **Gestão Colaboradores > Lançamento M.O**
3. Registre manutenções em **Manutenção**
4. Registre consumo em **Consumo de Água**

**Inserir dados de teste**:
```sql
-- Inserir funcionário de teste
INSERT INTO employees (company_id, full_name, salary, active)
VALUES ('UUID_DA_EMPRESA', 'João da Silva', 2500.00, true);

-- Inserir lançamento de teste
INSERT INTO lancamento_mo (
  company_id,
  employee_id,
  production_line_id,
  tipo,
  mes,
  ano,
  data_lancamento,
  salario_base,
  custo_mensal
)
VALUES (
  'UUID_DA_EMPRESA',
  (SELECT id FROM employees WHERE company_id = 'UUID_DA_EMPRESA' LIMIT 1),
  (SELECT id FROM production_lines WHERE company_id = 'UUID_DA_EMPRESA' LIMIT 1),
  'MOD',
  1,  -- Janeiro
  2026,
  CURRENT_DATE,
  2500.00,
  3500.00  -- Salário + encargos estimados
);
```

---

### 6. Erro ao fazer upload de imagens

**Causa**: Storage bucket não foi criado no Supabase.

**Solução**:
1. Acesse Supabase → Storage
2. Crie um bucket chamado `avatars`
3. Configure como público
4. Adicione policy:
```sql
-- Permitir leitura pública
CREATE POLICY "Public read access"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

-- Permitir upload para usuários autenticados
CREATE POLICY "Authenticated users can upload"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'avatars' AND auth.role() = 'authenticated');
```

---

### 7. Gráficos não aparecem

**Causa**: Recharts não foi instalado ou há erro no componente.

**Solução**:
```bash
# Reinstalar Recharts
npm uninstall recharts
npm install recharts@^2.12.7

# Limpar cache do Next.js
rm -rf .next  # ou rmdir /s .next no Windows
npm run dev
```

---

### 8. Erro: "Cannot read property 'map' of undefined"

**Causa**: Dados ainda não foram carregados (async).

**Solução**: Sempre verificar se os dados existem antes de mapear:
```typescript
// ❌ Errado
{data.map(item => ...)}

// ✅ Correto
{data?.map(item => ...) || []}

// ✅ Ou com loading state
{loading ? (
  <p>Carregando...</p>
) : (
  data?.map(item => ...)
)}
```

---

### 9. Formatação de moeda incorreta

**Causa**: Valor não é número ou está como string.

**Solução**:
```typescript
import { formatCurrency } from '@/lib/utils';

// Sempre converter para número primeiro
const valor = parseFloat(data.valor);
const formatado = formatCurrency(valor);

// Ou usar o helper direto
const formatado = formatCurrency(data.valor);
```

---

### 10. Build falha na Vercel

**Causas comuns**:
- Variáveis de ambiente não configuradas
- TypeScript errors
- Imports incorretos

**Solução**:
```bash
# Testar build localmente
npm run build

# Verificar erros de TypeScript
npx tsc --noEmit

# Verificar imports
# Todos os imports devem usar '@/' para paths absolutos
import Component from '@/components/...'
```

**Na Vercel**:
1. Settings → Environment Variables
2. Adicionar todas as variáveis do `.env.local`
3. Redeploy

---

## 🔍 Debugging Avançado

### Ver logs do Supabase em tempo real

No painel do Supabase:
1. Vá em "Database" → "Query Performance"
2. Ou "Logs" para ver erros

### Verificar RLS Policies

```sql
-- Ver todas as policies de uma tabela
SELECT *
FROM pg_policies
WHERE tablename = 'employees';

-- Testar se usuário tem acesso
SELECT *
FROM employees
WHERE company_id = 'UUID_DA_EMPRESA';
```

### Debug de Autenticação

```typescript
// No componente
useEffect(() => {
  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    console.log('Session:', session);
    console.log('User:', session?.user);
  };
  checkAuth();
}, []);
```

### Limpar cache do navegador

1. Abra DevTools (F12)
2. Clique com botão direito no ícone de reload
3. Selecione "Empty Cache and Hard Reload"

---

## 📊 Performance

### Dashboard lento

**Otimizações**:
1. Adicionar índices no banco:
```sql
-- Índices já estão no schema.sql, mas se precisar:
CREATE INDEX IF NOT EXISTS idx_lancamento_mo_mes_ano
ON lancamento_mo(mes, ano);
```

2. Usar paginação em tabelas grandes:
```typescript
const { data, count } = await supabase
  .from('employees')
  .select('*', { count: 'exact' })
  .range(0, 9); // Primeiros 10 registros
```

3. Fazer cache de dados que não mudam frequentemente

---

## 🆘 Ainda com problemas?

### Checklist Final:

- [ ] Node.js 18+ instalado
- [ ] Dependências instaladas (`npm install`)
- [ ] `.env.local` configurado corretamente
- [ ] Schema SQL executado no Supabase
- [ ] Empresa criada
- [ ] Usuário criado e vinculado à empresa
- [ ] RLS policies ativas
- [ ] Servidor rodando (`npm run dev`)
- [ ] Console do navegador sem erros (F12)

### Logs úteis:

```bash
# Ver logs do Next.js
npm run dev

# Ver versão do Node
node --version  # Deve ser 18+

# Ver dependências instaladas
npm list --depth=0
```

### Reset completo:

```bash
# 1. Limpar tudo
rm -rf node_modules .next

# 2. Reinstalar
npm install

# 3. Reiniciar
npm run dev
```

---

## 📞 Suporte

Se nenhuma solução funcionou:
1. Copie a mensagem de erro completa
2. Verifique o console do navegador (F12)
3. Verifique os logs do servidor
4. Abra uma issue no repositório com:
   - Erro completo
   - Passos para reproduzir
   - Versões (Node, npm, navegador)

---

**Dica**: 90% dos problemas são causados por:
1. Variáveis de ambiente incorretas (40%)
2. Schema SQL não executado (30%)
3. Usuário sem company_id (20%)
4. Cache do navegador (10%)
