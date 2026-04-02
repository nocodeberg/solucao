# Importação de Produtos Químicos - Guia Rápido

## 🚀 Início Rápido

### 1️⃣ Extrair dados da planilha
```bash
node scripts/extract-product-data.js
```

### 2️⃣ Obter ID da empresa
```bash
node scripts/get-company-id.js
```

### 3️⃣ Importar para o banco de dados
```bash
node scripts/import-chemical-products.js <COMPANY_ID>
```

Substitua `<COMPANY_ID>` pelo ID obtido no passo 2.

## 📊 Dados que serão importados

- **85 produtos químicos** distribuídos em **14 linhas de produção**
- Dados de consumo e custos do **mês de março/2024**
- Produtos classificados por tipo: **GALVANOPLASTIA** ou **VERNIZ**

## 📁 Arquivos criados

| Arquivo | Descrição |
|---------|-----------|
| `data/produtos-quimicos-extraidos.json` | Dados extraídos da planilha |
| `docs/ANALISE-DADOS-PLANILHA.md` | Análise detalhada dos dados |
| `docs/GUIA-IMPORTACAO-PRODUTOS.md` | Guia completo passo a passo |

## ⚙️ Pré-requisitos

✅ Node.js instalado
✅ Dependências instaladas (`npm install`)
✅ Arquivo `.env.local` configurado com:
```env
NEXT_PUBLIC_SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
```

## 🔍 Verificação

Após a importação, acesse o sistema e navegue até:
- **Linhas de Produção** → Verifique as 14 linhas criadas
- **Produtos Químicos** → Confira os 85 produtos importados
- **Lançamentos** → Revise os dados de março/2024

## 📚 Documentação Completa

Para informações detalhadas, consulte:
- **Guia Completo**: `docs/GUIA-IMPORTACAO-PRODUTOS.md`
- **Análise dos Dados**: `docs/ANALISE-DADOS-PLANILHA.md`

## ❓ Problemas Comuns

### Erro de variáveis de ambiente
Verifique se o arquivo `.env.local` está configurado corretamente.

### Erro de permissão no Supabase
Confirme que a `SUPABASE_SERVICE_ROLE_KEY` é válida e tem permissões de admin.

### Dados já existentes
O script é idempotente - não duplicará dados existentes.

---

**Última atualização**: Março 2024
