# 🔧 SOLUÇÃO COMPLETA PARA MÚLTIPLOS ERROS

## 📋 **DIAGNÓSTICO GERAL**

### 🚨 **PROBLEMAS IDENTIFICADOS:**
1. **Erro no Login** - Provavelmente autenticação Supabase
2. **Erro ao carregar grupos** - Backend/API não funcionando
3. **Possíveis erros de configuração** - Variáveis de ambiente
4. **Problemas de dependências** - Build/compilação

## 🎯 **SOLUÇÃO PASSO A PASSO**

### 📝 **PASSO 1: VERIFICAR CONFIGURAÇÃO BÁSICA**

#### 1.1 Verificar arquivo .env.local
```bash
# Verifique se o arquivo existe
ls -la .env.local

# Se não existir, copie o exemplo
cp .env.example .env.local
```

#### 1.2 Configurar variáveis de ambiente
Edite `.env.local` com:
```env
NEXT_PUBLIC_SUPABASE_URL=https://SEU_PROJETO.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=SUA_CHAVE_ANON
SUPABASE_SERVICE_ROLE_KEY=SUA_CHAVE_SERVICE
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

### 📝 **PASSO 2: LIMPAR E REINSTALAR**

#### 2.1 Limpar tudo
```bash
# Limpar builds e caches
rm -rf .next
rm -rf node_modules
rm -rf server/node_modules

# Limpar cache do npm
npm cache clean --force
```

#### 2.2 Reinstalar dependências
```bash
# Frontend
npm install

# Backend
cd server
npm install
cd ..
```

### 📝 **PASSO 3: VERIFICAR SUPABASE**

#### 3.1 Testar conexão
```sql
-- No SQL Editor do Supabase
SELECT 1 as test;
```

#### 3.2 Verificar schema
```sql
-- Verificar se tabelas existem
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

#### 3.3 Criar dados básicos
```sql
-- Criar empresa se não existir
INSERT INTO companies (name, cnpj, email, phone, active)
VALUES ('Solução Industrial', '00.000.000/0000-00', 'admin@solucao.com', '(00) 0000-0000', true)
ON CONFLICT DO NOTHING;

-- Criar usuário admin se não existir
INSERT INTO auth.users (id, email, email_confirmed_at, phone, raw_user_meta_data)
VALUES (
  gen_random_uuid(),
  'admin@solucao.com',
  NOW(),
  '(00) 0000-0000',
  '{"full_name": "Administrador"}'
)
ON CONFLICT (email) DO NOTHING;
```

### 📝 **PASSO 4: CONFIGURAR BACKEND**

#### 4.1 Verificar servidor backend
```bash
cd server
npm run dev
```

#### 4.2 Se der erro, verificar package.json
```json
{
  "scripts": {
    "dev": "nodemon server.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "@supabase/supabase-js": "^2.39.3"
  }
}
```

#### 4.3 Verificar server.js
```javascript
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middlewares
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/groups', require('./routes/groups'));
// ... outras rotas

app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
});
```

### 📝 **PASSO 5: CONFIGURAR FRONTEND**

#### 5.1 Verificar next.config.js
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['localhost', 'supabase.co', 'i.imgur.com'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
    ],
  },
}

module.exports = nextConfig
```

#### 5.2 Verificar AuthContext
```typescript
// contexts/AuthContext.tsx
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
```

### 📝 **PASSO 6: TESTAR ISOLADAMENTE**

#### 6.1 Testar apenas frontend
```bash
npm run dev
# Acessar http://localhost:3000
```

#### 6.2 Testar apenas backend
```bash
cd server
npm run dev
# Testar http://localhost:3001/api/groups
```

#### 6.3 Testar juntos
```bash
npm run dev
# (em outro terminal)
cd server && npm run dev
```

### 📝 **PASSO 7: VERIFICAR ERROS ESPECÍFICOS**

#### 7.1 Erro de Login
```typescript
// Verifique se o login está funcionando
const { signIn } = useAuth();

// Adicionar logs
const handleSubmit = async (e: React.FormEvent) => {
  console.log('🔍 Tentando login...');
  try {
    await signIn(email, password);
    console.log('✅ Login sucesso!');
  } catch (error) {
    console.error('❌ Erro no login:', error);
  }
};
```

#### 7.2 Erro de Grupos
```javascript
// Adicionar logs no backend
router.get('/', async (req, res) => {
  try {
    console.log('🔍 Buscando grupos...');
    const { data } = await supabase.from('groups').select('*');
    console.log('✅ Grupos:', data);
    res.json(data || []);
  } catch (error) {
    console.error('❌ Erro:', error);
    res.status(500).json({ error: 'Erro ao buscar grupos' });
  }
});
```

## 🚀 **SCRIPT AUTOMÁTICO DE CORREÇÃO**

Crie um arquivo `fix-errors.sh`:
```bash
#!/bin/bash

echo "🔧 Iniciando correção automática..."

# 1. Limpar caches
echo "🧹 Limpando caches..."
rm -rf .next
rm -rf node_modules
rm -rf server/node_modules
npm cache clean --force

# 2. Reinstalar
echo "📦 Reinstalando dependências..."
npm install
cd server && npm install && cd ..

# 3. Verificar ambiente
echo "🔍 Verificando configuração..."
if [ ! -f ".env.local" ]; then
  echo "⚠️ .env.local não encontrado. Copiando exemplo..."
  cp .env.example .env.local
  echo "❗ Edite .env.local com suas credenciais do Supabase!"
fi

# 4. Iniciar servidores
echo "🚀 Iniciando servidores..."
npm run dev &
cd server && npm run dev &

echo "✅ Correção concluída!"
echo "🌐 Frontend: http://localhost:3000"
echo "🔌 Backend: http://localhost:3001"
```

## 📊 **CHECKLIST DE VERIFICAÇÃO**

- [ ] `.env.local` configurado
- [ ] Supabase conectado
- [ ] Backend rodando na porta 3001
- [ ] Frontend rodando na porta 3000
- [ ] Tabelas criadas no Supabase
- [ ] Usuário admin criado
- [ ] Autenticação funcionando
- [ ] API respondendo

## 🎯 **PRÓXIMOS PASSOS**

1. **Execute o script automático** acima
2. **Verifique cada item do checklist**
3. **Teste o login e os grupos**
4. **Me informe os erros específicos** que ainda persistirem

**Execute estes passos em ordem e me diga onde está o problema!** 🔍
