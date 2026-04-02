# 🔧 CORRIGIR ERROS MANUALMENTE

## 📋 **POR QUE ESTÁ DANDO ERRO?**

O PowerShell não aceita caminhos com espaços usando `&&`. O caminho "Clayton Malta\solucao-industrial" tem espaços.

## 🎯 **SOLUÇÃO MANUAL - PASSO A PASSO**

### **PASSO 1: LIMPAR CACHES**
Abra o terminal e execute um por um:

```bash
cd "c:\Users\bergn\OneDrive\Documentos\projetos\Clayton Malta\solucao-industrial"
rmdir /s /q .next
rmdir /s /q node_modules
rmdir /s /q server\node_modules
npm cache clean --force
```

### **PASSO 2: REINSTALAR DEPENDÊNCIAS**
```bash
npm install
cd server
npm install
cd ..
```

### **PASSO 3: VERIFICAR .ENV.LOCAL**
Se não existir, crie:
```bash
copy .env.example .env.local
```

Edite `.env.local` com suas credenciais:
```env
NEXT_PUBLIC_SUPABASE_URL=https://SEU_PROJETO.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=SUA_CHAVE_ANON
SUPABASE_SERVICE_ROLE_KEY=SUA_CHAVE_SERVICE
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

### **PASSO 4: CORRIGIR ERROS ESPECÍFICOS**

#### **ERRO 1: LOGIN**
O problema pode ser no AuthContext. Adicione este código:

```typescript
// Em contexts/AuthContext.tsx
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
```

#### **ERRO 2: GRUPOS**
Adicione logs no backend:

```javascript
// Em server/routes/groups.js
router.get('/', async (req, res) => {
  try {
    console.log('🔍 Buscando grupos...');
    const { company_id } = req.profile;
    
    if (!company_id) {
      console.error('❌ company_id não encontrado');
      return res.status(400).json({ error: 'company_id não encontrado' });
    }
    
    const { data, error } = await supabase.from('groups')
      .select('*')
      .eq('company_id', company_id)
      .order('name');
    
    if (error) {
      console.error('❌ Erro Supabase:', error);
      return res.status(500).json({ error: 'Erro ao buscar grupos', details: error });
    }
    
    console.log('✅ Grupos encontrados:', data?.length || 0);
    res.json(data || []);
  } catch (error) {
    console.error('❌ Erro geral:', error);
    res.status(500).json({ error: 'Erro ao buscar grupos' });
  }
});
```

### **PASSO 5: INICIAR SERVIDORES**
Em terminais separados:

**Terminal 1 (Frontend):**
```bash
cd "c:\Users\bergn\OneDrive\Documentos\projetos\Clayton Malta\solucao-industrial"
npm run dev
```

**Terminal 2 (Backend):**
```bash
cd "c:\Users\bergn\OneDrive\Documentos\projetos\Clayton Malta\solucao-industrial\server"
npm run dev
```

### **PASSO 6: TESTAR**
1. Acesse: http://localhost:3000
2. Tente fazer login
3. Acesse: http://localhost:3000/gestao-areas/grupos
4. Verifique se carrega

## 🚨 **SE AINDA DER ERRO:**

### **VERIFICAR CONSOLE:**
1. Aperte F12 no navegador
2. Vá para aba "Console"
3. Anote os erros exatos

### **VERIFICAR TERMINAL:**
1. Olhe os logs dos dois terminais
2. Anote qualquer mensagem de erro

### **TESTAR API DIRETAMENTE:**
No navegador, acesse:
```
http://localhost:3001/api/groups
```

## 🎯 **SOLUÇÃO RÁPIDA:**

Se quiser pular tudo isso, execute:

1. **Abra o PowerShell como Administrador**
2. **Navegue até a pasta:**
   ```bash
   cd "c:\Users\bergn\OneDrive\Documentos\projetos\Clayton Malta\solucao-industrial"
   ```
3. **Execute um por um:**
   ```bash
   rmdir /s /q .next
   npm install
   npm run build
   npm start
   ```

## 📞 **PRÓXIMO PASSO:**

Execute estes passos manuais e me diga:
1. **Qual erro específico aparece**
2. **Em qual etapa deu problema**
3. **Mensagem exata do erro**

**Assim posso corrigir de forma mais precisa!** 🔧
