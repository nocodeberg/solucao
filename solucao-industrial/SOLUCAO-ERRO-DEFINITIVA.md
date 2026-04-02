# 🔧 SOLUÇÃO DEFINITIVA PARA ERRO DE CONEXÃO

## 📋 **DIAGNÓSTICO DO ERRO PERSISTENTE**

O erro continua acontecendo porque:

1. **API Direct pode ter problemas de autenticação**
2. **RLS policies podem estar bloqueando**
3. **Variáveis de ambiente não configuradas**
4. **Supabase client pode estar com erro**

## 🔍 **VERIFICAÇÃO COMPLETA**

### **PASSO 1: Verificar Supabase Client**
O problema pode estar no arquivo `lib/supabase/client.ts`:

```typescript
// Verifique se está assim:
import { createClient } from '@supabase/supabase-js';

export function createSupabaseClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
```

### **PASSO 2: Verificar RLS Policies**
No Supabase SQL Editor, execute:

```sql
-- Verificar se há RLS na tabela groups
SELECT 
  schemaname,
  tablename,
  rowsecurity 
FROM pg_tables 
WHERE tablename = 'groups';

-- Verificar policies existentes
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual 
FROM pg_policies 
WHERE tablename = 'groups';
```

### **PASSO 3: Criar RLS Correto**
Se não houver policies, crie:

```sql
-- Habilitar RLS
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;

-- Policy para usuários autenticados verem grupos da própria empresa
CREATE POLICY "Users can view groups from their company"
ON groups FOR SELECT
USING (company_id IN (
  SELECT company_id FROM profiles WHERE id = auth.uid()
));

-- Policy para usuários criarem grupos
CREATE POLICY "Users can create groups for their company"
ON groups FOR INSERT
WITH CHECK (company_id IN (
  SELECT company_id FROM profiles WHERE id = auth.uid()
));

-- Policy para usuários atualizarem grupos
CREATE POLICY "Users can update groups from their company"
ON groups FOR UPDATE
USING (company_id IN (
  SELECT company_id FROM profiles WHERE id = auth.uid()
))
WITH CHECK (company_id IN (
  SELECT company_id FROM profiles WHERE id = auth.uid()
));

-- Policy para usuários excluírem grupos
CREATE POLICY "Users can delete groups from their company"
ON groups FOR DELETE
USING (company_id IN (
  SELECT company_id FROM profiles WHERE id = auth.uid()
));
```

## 🛠️ **SOLUÇÃO DEFINITIVA**

### **OPÇÃO 1: Usar Service Role (Bypass RLS)**
Modifique `lib/api/supabase-direct.ts`:

```typescript
import { createClient } from '@supabase/supabase-js';

// Cliente com service role (bypass RLS)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

// Obter usuário atual
const getCurrentUser = async () => {
  const { data: { user } } = await supabaseAdmin.auth.getUser();
  return user;
};

// Obter profile do usuário
const getCurrentProfile = async () => {
  const { data: { user } } = await supabaseAdmin.auth.getUser();
  if (!user) throw new Error('Usuário não autenticado');

  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  return profile;
};

export const groupsApi = {
  list: async (): Promise<Group[]> => {
    const profile = await getCurrentProfile();
    const { data, error } = await supabaseAdmin
      .from('groups')
      .select('*')
      .eq('company_id', profile.company_id)
      .order('name');

    if (error) {
      console.error('Erro groups.list:', error);
      throw error;
    }
    return data || [];
  },
  // ... outros métodos
};
```

### **OPÇÃO 2: API Routes no Next.js**
Crie `app/api/groups/route.ts`:

```typescript
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: Request) {
  try {
    // Obter token do header
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const { data: { user } } = await supabase.auth.getUser(token);

    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 401 });
    }

    // Obter profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: 'Profile não encontrado' }, { status: 404 });
    }

    // Buscar grupos
    const { data, error } = await supabase
      .from('groups')
      .select('*')
      .eq('company_id', profile.company_id)
      .order('name');

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data || []);
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
```

### **OPÇÃO 3: Debug Completo**
Adicione logs detalhados:

```typescript
// Em lib/api/supabase-direct.ts
export const groupsApi = {
  list: async (): Promise<Group[]> => {
    console.log('🔍 Iniciando groups.list...');
    
    try {
      console.log('🔍 Obtendo usuário...');
      const profile = await getCurrentProfile();
      console.log('✅ Profile obtido:', profile);
      
      console.log('🔍 Buscando grupos para company_id:', profile.company_id);
      const { data, error } = await supabaseAdmin
        .from('groups')
        .select('*')
        .eq('company_id', profile.company_id)
        .order('name');

      if (error) {
        console.error('❌ Erro na query:', error);
        throw error;
      }

      console.log('✅ Grupos encontrados:', data?.length || 0);
      return data || [];
    } catch (err) {
      console.error('❌ Erro geral em groups.list:', err);
      throw err;
    }
  },
};
```

## 🚀 **IMPLEMENTAÇÃO IMEDIATA**

### **PASSO 1: Testar Conexão Supabase**
No navegador console:
```javascript
// Testar conexão básica
fetch('https://SEU_PROJETO.supabase.co/rest/v1/groups', {
  headers: {
    'apikey': 'SUA_CHAVE_ANON',
    'Authorization': 'Bearer SUA_CHAVE_ANON'
  }
})
.then(res => res.json())
.then(data => console.log(data))
.catch(err => console.error(err));
```

### **PASSO 2: Verificar Variáveis**
No console da aplicação:
```javascript
console.log('SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
console.log('SUPABASE_ANON:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'OK' : 'MISSING');
console.log('SERVICE_ROLE:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'OK' : 'MISSING');
```

### **PASSO 3: Testar API Manual**
Crie arquivo `test-api.html`:
```html
<!DOCTYPE html>
<html>
<head>
    <title>Test API</title>
</head>
<body>
    <h1>Test API Supabase</h1>
    <button onclick="testAPI()">Testar</button>
    <div id="result"></div>

    <script>
        async function testAPI() {
            try {
                const response = await fetch('https://SEU_PROJETO.supabase.co/rest/v1/groups', {
                    headers: {
                        'apikey': 'SUA_CHAVE_ANON',
                        'Authorization': 'Bearer SUA_CHAVE_ANON'
                    }
                });
                const data = await response.json();
                document.getElementById('result').innerHTML = JSON.stringify(data, null, 2);
            } catch (error) {
                document.getElementById('result').innerHTML = 'Erro: ' + error.message;
            }
        }
    </script>
</body>
</html>
```

## 📋 **CHECKLIST FINAL**

- [ ] Variáveis de ambiente configuradas
- [ ] RLS policies criadas
- [ ] Supabase URL correto
- [ ] Chaves de API válidas
- [ ] Tabela groups existe
- [ ] Profile com company_id

## 🎯 **AÇÃO RECOMENDADA**

1. **Use a OPÇÃO 1 (Service Role)** - Mais simples e direta
2. **Adicione logs detalhados** para identificar o ponto exato do erro
3. **Teste a conexão básica** com o Supabase
4. **Verifique as variáveis de ambiente** no deploy

**Execute a OPÇÃO 1 e me informe o resultado!** 🔧
