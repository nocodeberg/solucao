# 🐛 ANÁLISE DE BUGS PARA DEPLOY

## 📋 **PROBLEMAS IDENTIFICADOS**

### 1️⃣ **BUG CRÍTICO: Logo no Sidebar**
- **Problema**: Sidebar está usando logo hardcoded `/logos/bognar-logo.png`
- **Impacto**: Logo não aparece dinamicamente do banco
- **Código**: Linha 303 em `components/layout/Sidebar.tsx`
- **Solução**: Usar `companyLogo` do estado

### 2️⃣ **BUG: Timeout em Autenticação**
- **Problema**: Timeout de 10-12 segundos em `AuthContext.tsx`
- **Impacto**: Lentidão no login e carregamento
- **Código**: Linhas 43-46 e 56 em `contexts/AuthContext.tsx`
- **Solução**: Aumentar timeout ou otimizar queries

### 3️⃣ **BUG: Tratamento de Erro Inconsistente**
- **Problema**: Alguns erros bloqueiam a aplicação, outros não
- **Impacto**: UX inconsistente
- **Código**: Linhas 70-78 em `contexts/AuthContext.tsx`
- **Solução**: Padronizar tratamento

### 4️⃣ **BUG: Next.js Images Domains**
- **Problema**: `next.config.js` não inclui Imgur e outros domínios
- **Impacto**: Imagens externas não carregam
- **Código**: Linhas 4-10 em `next.config.js`
- **Solução**: Adicionar domínios necessários

### 5️⃣ **BUG: Deploy Configuration**
- **Problema**: Scripts de deploy inconsistentes
- **Impacto**: Deploy pode falhar
- **Código**: Linhas 6-12 em `package.json`
- **Solução**: Ajustar scripts para produção

## 🔧 **CORREÇÕES NECESSÁRIAS**

### 🎯 **PRIORIDADE ALTA**

#### 1. Corrigir Logo Dinâmico
```typescript
// EM components/layout/Sidebar.tsx
// Substituir linha 303
src="/logos/bognar-logo.png" 
// POR:
src={companyLogo || "/logos/solucao-industrial-prata.png"}
```

#### 2. Aumentar Timeout de Autenticação
```typescript
// EM contexts/AuthContext.tsx
// Aumentar de 10s para 30s
setTimeout(() => reject(new Error('Session timeout')), 30000)
```

#### 3. Adicionar Domínios de Imagem
```javascript
// EM next.config.js
images: {
  domains: ['localhost', 'supabase.co', 'i.imgur.com', '62a6378ae71b59a7cac189b50eeb8dbe.cdn.bubble.io'],
  remotePatterns: [
    {
      protocol: 'https',
      hostname: '**.supabase.co',
    },
    {
      protocol: 'https',
      hostname: 'i.imgur.com',
    },
    {
      protocol: 'https',
      hostname: '**.bubble.io',
    },
  ],
},
```

### 🎯 **PRIORIDADE MÉDIA**

#### 4. Melhorar Tratamento de Erro
```typescript
// Padronizar tratamento de erros no AuthContext
catch (error) {
  console.error('Error loading profile:', error);
  if (error instanceof Error) {
    if (error.message.includes('timeout')) {
      // Tratamento específico para timeout
    } else if (error.message.includes('network')) {
      // Tratamento específico para rede
    }
  }
  setProfile(null); // Fallback consistente
}
```

#### 5. Otimizar Build para Produção
```json
// EM package.json
"scripts": {
  "build": "next build",
  "start": "next start",
  "lint:fix": "next lint --fix",
  "type-check": "tsc --noEmit"
}
```

## 🚀 **PASSOS PARA DEPLOY**

### 1️⃣ **Correções Imediatas**
- [ ] Fix logo dinâmico no Sidebar
- [ ] Adicionar domínios de imagem no Next.js
- [ ] Aumentar timeout de autenticação

### 2️⃣ **Testes**
- [ ] Testar login com timeout aumentado
- [ ] Testar exibição de logo dinâmico
- [ ] Testar carregamento de imagens externas

### 3️⃣ **Deploy**
- [ ] Build: `npm run build`
- [ ] Start: `npm start`
- [ ] Verificar logs de erro

### 4️⃣ **Validação Pós-Deploy**
- [ ] Testar fluxo completo de login
- [ ] Verificar performance
- [ ] Testar em diferentes navegadores

## 📊 **IMPACTO ESPERADO**

✅ **Logo aparece corretamente do banco**
✅ **Login mais rápido e estável**
✅ **Imagens externas carregam**
✅ **Tratamento de erros consistente**
✅ **Deploy estável em produção**

## ⚠️ **RISCOS**

- **Mudança de logo pode afetar branding**
- **Aumento de timeout pode mascarar problemas de performance**
- **Adição de domínios pode expor a security issues**

## 🎯 **RECOMENDAÇÃO**

**Fazer deploy incremental:**
1. Corrigir bugs críticos primeiro
2. Deploy em ambiente de staging
3. Testar completo
4. Deploy em produção
