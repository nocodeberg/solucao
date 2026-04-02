# 🔧 CORRIGIR ERRO: "Erro ao carregar grupos segundo"

## 📋 **DIAGNÓSTICO RÁPIDO**

### 1️⃣ **VERIFICAR SE O BACKEND ESTÁ RODANDO**
```bash
cd server
npm run dev
```
Se der erro, anote a mensagem exata.

### 2️⃣ **VERIFICAR A URL DA API**
No arquivo `lib/api/client.ts`, linha 22:
```typescript
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
```
Verifique se a porta está correta.

### 3️⃣ **TESTAR A API DIRETAMENTE**
Abra o navegador e acesse:
```
http://localhost:3001/api/groups
```
Se retornar erro, o problema está no backend.

### 4️⃣ **VERIFICAR O CONSOLE DO NAVEGADOR**
1. Abra a página de grupos
2. Aperte F12 (Developer Tools)
3. Vá para aba "Network"
4. Tente carregar a página
5. Procure pela requisição `/groups`
6. Anote o erro exato que aparece

## 🛠️ **CORREÇÕES SUGERIDAS**

### CORREÇÃO 1: Adicionar Logs Detalhados
No arquivo `server/routes/groups.js`:

```javascript
router.get('/', async (req, res) => {
  try {
    console.log('🔍 Buscando grupos para company_id:', req.profile?.company_id);
    const { company_id } = req.profile;
    
    if (!company_id) {
      console.error('❌ company_id não encontrado no profile');
      return res.status(400).json({ error: 'company_id não encontrado' });
    }
    
    console.log('🔍 Executando query na tabela groups...');
    const { data, error } = await supabase.from('groups')
      .select('*')
      .eq('company_id', company_id)
      .order('name');
    
    if (error) {
      console.error('❌ Erro do Supabase:', error);
      return res.status(500).json({ error: 'Erro ao buscar grupos', details: error });
    }
    
    console.log('✅ Grupos encontrados:', data?.length || 0);
    res.json(data || []);
  } catch (error) {
    console.error('❌ Erro geral no backend:', error);
    res.status(500).json({ error: 'Erro ao buscar grupos' });
  }
});
```

### CORREÇÃO 2: Verificar Schema da Tabela
No SQL do Supabase, verifique se a tabela `groups` existe:

```sql
-- Verificar estrutura da tabela groups
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'groups' 
ORDER BY ordinal_position;
```

### CORREÇÃO 3: Verificar RLS Policies
```sql
-- Verificar se há RLS bloqueando
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

### CORREÇÃO 4: Testar com Postman
1. Instale o Postman (ou use Thunder Client)
2. Crie uma requisição GET para `http://localhost:3001/api/groups`
3. Adicione o header `Authorization: Bearer SEU_TOKEN`
4. Teste a requisição

## 🚀 **AÇÕES IMEDIATAS**

### Passo 1: Verificar Backend
```bash
cd server
npm run dev
```

### Passo 2: Testar API
```bash
curl http://localhost:3001/api/groups
```

### Passo 3: Verificar Logs
```bash
# Ver logs do servidor
tail -f logs/app.log
```

## 📊 **INFORMAÇÕES PARA COLETAR**

Ao encontrar o erro, me informe:
1. **Mensagem exata do erro**
2. **Logs do console (navegador)**
3. **Logs do servidor (terminal)**
4. **Resultado do teste da API direta**
5. **Versão do Node.js** (`node --version`)

## 🎯 **PROVÁVEL CAUSA MAIS COMUM**

Normalmente este erro ocorre por:
1. **Backend não está rodando** na porta correta
2. **Variável de ambiente** `NEXT_PUBLIC_API_URL` apontando para lugar errado
3. **Autenticação** não está funcionando (token inválido)
4. **RLS policies** no Supabase bloqueando acesso

**Execute os testes acima e me informe o resultado!** 🔍
