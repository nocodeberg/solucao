# 🔧 CORRIGIR ERRO 404 (Not Found)

## 📋 **PROBLEMA IDENTIFICADO**

Erro `Failed to load resource: server responded with a status of 404 (Not Found)` significa que:

1. **Backend não está rodando** na porta correta
2. **API_URL está incorreta** no frontend
3. **Rotas não existem** no backend
4. **CORS bloqueando** requisições

## 🔍 **DIAGNÓSTICO RÁPIDO**

### **PASSO 1: Verificar se backend está rodando**
```bash
# Verifique se algo está rodando na porta 3001
netstat -an | findstr :3001

# Ou use PowerShell
Get-NetTCPConnection -LocalPort 3001 -State Listen
```

### **PASSO 2: Testar API diretamente**
Abra o navegador e acesse:
```
http://localhost:3001/api/groups
```

Se der 404, o backend não está rodando ou as rotas não existem.

### **PASSO 3: Verificar configuração do frontend**
Em `lib/api/client.ts`, linha 22:
```typescript
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
```

## 🛠️ **SOLUÇÕES**

### **SOLUÇÃO 1: Iniciar backend corretamente**
```bash
# Abra um terminal separado
cd "c:\Users\bergn\OneDrive\Documentos\projetos\Clayton Malta\solucao-industrial\server"
npm run dev
```

### **SOLUÇÃO 2: Verificar server.js**
Em `server/server.js`, verifique se tem:
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

// Rotas
app.use('/api/auth', require('./routes/auth'));
app.use('/api/groups', require('./routes/groups'));
app.use('/api/employees', require('./routes/employees'));
// ... outras rotas

// Teste
app.get('/api/test', (req, res) => {
  res.json({ message: 'API está funcionando!' });
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
});
```

### **SOLUÇÃO 3: Verificar package.json do server**
Em `server/package.json`:
```json
{
  "scripts": {
    "dev": "nodemon server.js",
    "start": "node server.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "dotenv": "^16.3.1",
    "nodemon": "^3.0.1",
    "@supabase/supabase-js": "^2.39.3"
  }
}
```

### **SOLUÇÃO 4: Verificar se rotas existem**
Verifique se estes arquivos existem:
```
server/
├── server.js
├── routes/
│   ├── auth.js
│   ├── groups.js
│   ├── employees.js
│   └── ...
├── config/
│   └── supabase.js
└── package.json
```

## 🚀 **SCRIPT DE CORREÇÃO AUTOMÁTICA**

Crie um arquivo `start-backend.bat`:
```batch
@echo off
echo 🚀 Iniciando backend...

cd "c:\Users\bergn\OneDrive\Documentos\projetos\Clayton Malta\solucao-industrial\server"

echo 📦 Verificando dependências...
if not exist node_modules (
    echo Instalando dependências...
    npm install
)

echo 🚀 Iniciando servidor...
npm run dev

pause
```

## 📊 **DIAGNÓSTICO COMPLETO**

### **1. Testar se backend responde**
```bash
curl http://localhost:3001/api/test
```

### **2. Verificar logs do backend**
Quando iniciar o backend, deve aparecer:
```
🚀 Servidor rodando na porta 3001
```

### **3. Testar rotas específicas**
```bash
# Testar autenticação
curl http://localhost:3001/api/auth/me

# Testar grupos
curl http://localhost:3001/api/groups
```

## 🎯 **AÇÃO IMEDIATA**

### **PASSO 1: Verificar arquivos do backend**
```bash
cd "c:\Users\bergn\OneDrive\Documentos\projetos\Clayton Malta\solucao-industrial\server"
dir
```

### **PASSO 2: Criar server.js se não existir**
Se `server.js` não existir, crie com o conteúdo acima.

### **PASSO 3: Iniciar backend**
```bash
cd "c:\Users\bergn\OneDrive\Documentos\projetos\Clayton Malta\solucao-industrial\server"
npm run dev
```

### **PASSO 4: Testar frontend**
Em outro terminal:
```bash
cd "c:\Users\bergn\OneDrive\Documentos\projetos\Clayton Malta\solucao-industrial"
npm run dev
```

## 📋 **CHECKLIST**

- [ ] Backend está rodando na porta 3001
- [ ] Arquivo `server.js` existe
- [ ] Rotas estão configuradas
- [ ] Dependências do backend instaladas
- [ ] CORS está configurado
- [ ] Frontend aponta para API_URL correta

## 🚨 **SE PERSISTIR O ERRO**

1. **Verifique o console do backend** - deve mostrar os logs das requisições
2. **Verifique o console do navegador** - F12 > Network
3. **Teste com Postman** - faça requisições diretas
4. **Verifique firewall** - pode estar bloqueando a porta 3001

**Execute estes passos e me informe o resultado!** 🔍
