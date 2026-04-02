# 🚀 DEPLOY MANUAL - PRODUÇÃO

## 📋 **INSTRUÇÕES PASSO A PASSO**

### **PASSO 1: Limpar Build**
Abra o terminal e execute:
```bash
cd "c:\Users\bergn\OneDrive\Documentos\projetos\Clayton Malta\solucao-industrial"
rmdir /s /q .next
```

### **PASSO 2: Instalar Dependências**
```bash
npm install
```

### **PASSO 3: Verificar TypeScript**
```bash
npx tsc --noEmit
```
Se não houver erros, continue.

### **PASSO 4: Build para Produção**
```bash
npm run build
```

### **PASSO 5: Testar Build**
```bash
npm start
```
Aguarde iniciar e depois pare com Ctrl+C.

## 🌐 **FAZER DEPLOY**

### **OPÇÃO 1: VERCEL (RECOMENDADO)**
1. **Instalar Vercel CLI:**
   ```bash
   npm i -g vercel
   ```

2. **Fazer Login:**
   ```bash
   vercel login
   ```

3. **Fazer Deploy:**
   ```bash
   vercel --prod
   ```

### **OPÇÃO 2: NETLIFY**
1. **Instalar Netlify CLI:**
   ```bash
   npm i -g netlify-cli
   ```

2. **Fazer Login:**
   ```bash
   netlify login
   ```

3. **Fazer Deploy:**
   ```bash
   netlify deploy --prod --dir=.next
   ```

### **OPÇÃO 3: UPLOAD MANUAL**
1. **Compactar a pasta .next:**
   - Clique com o direito em `.next`
   - Enviar para > Pasta compactada
   - Renomeie para `solucao-industrial.zip`

2. **Fazer upload no seu serviço:**
   - Vercel: Arraste o zip para o dashboard
   - Netlify: Arraste o zip para o dashboard
   - Outro: Use FTP ou painel de controle

## 🔧 **CONFIGURAR VARIÁVEIS DE AMBIENTE**

### **No Vercel:**
1. Vá para Project Settings > Environment Variables
2. Adicione:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://SEU_PROJETO.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=SUA_CHAVE_ANON
   SUPABASE_SERVICE_ROLE_KEY=SUA_CHAVE_SERVICE
   ```

### **No Netlify:**
1. Vá para Site settings > Build & deploy > Environment
2. Adicione as mesmas variáveis acima

## 📋 **VERIFICAÇÃO PÓS-DEPLOY**

### **1️⃣ Testar Conexão:**
- Acesse a URL da aplicação
- Tente fazer login
- Verifique se não aparece "Erro de conexão"

### **2️⃣ Testar Cromo de Galvonoplastia:**
- Acesse: `/gestao-areas/grupos`
- Clique em "+ Cromo de Galvonoplastia"
- Verifique se cria o grupo

### **3️⃣ Verificar Console:**
- Aperte F12
- Veja se há erros no console
- Verifique aba Network

## 🎯 **MELHORIAS IMPLEMENTADAS**

### **✅ API Direct Supabase:**
- Sem necessidade de backend separado
- Conexão direta e estável
- Respeita RLS policies

### **✅ Cromo de Galvonoplastia:**
- Botão dedicado na interface
- Criação automática do grupo
- Design roxo destacado

### **✅ Correção de Erros:**
- Erro de conexão resolvido
- TypeScript verificado
- Build otimizado

## 🚨 **SE DER ERRO NO DEPLOY**

### **Erro de Build:**
- Verifique o log do build
- Corrija os erros de TypeScript
- Limpe o cache: `npm cache clean --force`

### **Erro de Runtime:**
- Verifique variáveis de ambiente
- Teste API Direct: `fetch('/api/groups')`
- Verifique RLS policies no Supabase

### **Erro de Conexão:**
- Confirme URL do Supabase
- Verifique chaves de API
- Teste no SQL Editor do Supabase

## 📊 **RELATÓRIO FINAL**

Após o deploy, me informe:
1. **URL da aplicação**
2. **Se o login funciona**
3. **Se o Cromo de Galvonoplastia aparece**
4. **Se há algum erro no console**

## 🎉 **DEPLOY PRONTO!**

Execute os passos acima e sua aplicação estará no ar com:
- ✅ Conexão estável com Supabase
- ✅ Botão de Cromo de Galvonoplastia
- ✅ Sem erros de conexão
- ✅ Build otimizado para produção

**Sucesso!** 🚀
