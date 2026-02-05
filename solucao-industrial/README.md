# 🏭 Solução Industrial - Sistema de Gestão

Sistema web responsivo para gestão industrial completo com controle de custos, mão de obra, manutenção, consumo de água e relatórios.

## 🚀 Tecnologias

- **Frontend**: React + Next.js 14 (App Router) + TypeScript
- **Styling**: Tailwind CSS
- **Backend**: Supabase (Auth + Postgres + Storage)
- **Gráficos**: Recharts
- **Exportação**: XLSX

## ✨ Funcionalidades

### 🔐 Autenticação e RBAC
- Sistema de login com Supabase Auth
- 5 níveis de acesso: ADMIN, GESTOR, RH, OPERADOR, LEITOR
- Controle de permissões por role

### 📊 Dashboard
- Filtros de período (mês/ano)
- Cards de métricas:
  - Funcionários ativos
  - Custo M.O.D (Mão de Obra Direta)
  - Custo M.O.I (Mão de Obra Indireta)
  - Matéria-prima
  - Consumo de água
  - Manutenção
  - Total operação e geral
- Gráficos de linha com evolução mensal
- Exportação de relatórios Excel

### 🏭 Gestão de Áreas
- **Linhas de Produção**: Cadastro de processos (Pré-Tratamento, Cobre Alcalino, etc.)
- **Produtos**: Gerenciamento de produtos/matéria-prima por linha
- **Grupos**: Cadastro de grupos de acabamento (Cromo, Níquel, Verniz)
- **Peças**: Controle de peças com área, peso e grupo vinculado

### 👥 Gestão de Colaboradores
- Cadastro de funcionários (nome, salário, cargo, admissão)
- Lançamento de mão de obra (MOD/MOI) por área e funcionário
- Cálculo automático de custo mensal com encargos

### 🔧 Outros Módulos
- **Manutenção**: Registro de manutenções com valor e data
- **Consumo de Água**: Controle de gastos com água
- **Cargos**: Cadastro de cargos/funções
- **Encargos**: Configuração de INSS, FGTS, Férias, 13º, etc.

## 📦 Instalação

### Pré-requisitos
- Node.js 18+ instalado
- Conta no Supabase (gratuita)

### 1. Clone o repositório
```bash
cd solucao-industrial
```

### 2. Instale as dependências
```bash
npm install
```

### 3. Configure o Supabase

#### 3.1 Crie um projeto no Supabase
1. Acesse [https://supabase.com](https://supabase.com)
2. Crie uma conta e um novo projeto
3. Anote a `URL` e a `anon key` do projeto

#### 3.2 Execute o schema do banco
1. No painel do Supabase, vá em "SQL Editor"
2. Copie todo o conteúdo do arquivo `supabase/schema.sql`
3. Cole no editor e execute

#### 3.3 Configure as variáveis de ambiente
```bash
cp .env.example .env.local
```

Edite o arquivo `.env.local` e preencha:
```env
NEXT_PUBLIC_SUPABASE_URL=sua_url_aqui
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_anon_aqui
SUPABASE_SERVICE_ROLE_KEY=sua_chave_service_role_aqui
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. Crie os dados iniciais

#### 4.1 Crie uma empresa (via SQL Editor do Supabase)
```sql
INSERT INTO companies (name, cnpj, email, phone, active)
VALUES ('Minha Empresa', '00.000.000/0000-00', 'contato@empresa.com', '(00) 0000-0000', true);
```

#### 4.2 Crie um usuário admin
1. No painel do Supabase, vá em "Authentication" > "Users"
2. Clique em "Add user" > "Create new user"
3. Preencha:
   - Email: admin@empresa.com
   - Password: sua_senha_segura
   - User Metadata:
     ```json
     {
       "full_name": "Administrador"
     }
     ```

#### 4.3 Vincule o usuário à empresa (via SQL Editor)
```sql
-- Obtenha o ID da empresa
SELECT id FROM companies LIMIT 1;

-- Obtenha o ID do usuário
SELECT id FROM auth.users WHERE email = 'admin@empresa.com';

-- Atualize o profile do usuário
UPDATE profiles
SET company_id = 'ID_DA_EMPRESA', role = 'ADMIN'
WHERE id = 'ID_DO_USUARIO';
```

### 5. Inicie o servidor de desenvolvimento
```bash
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000)

## 🔑 Login Inicial

Use as credenciais do usuário admin criado:
- **Email**: admin@empresa.com
- **Senha**: (a senha que você definiu)

## 📁 Estrutura do Projeto

```
solucao-industrial/
├── app/                      # Páginas Next.js (App Router)
│   ├── dashboard/           # Dashboard principal
│   ├── gestao-areas/        # Gestão de áreas (linhas, peças, grupos)
│   ├── manutencao/          # Manutenção
│   ├── consumo-agua/        # Consumo de água
│   ├── rh/                  # RH (funcionários, lançamento MO)
│   ├── configuracoes/       # Configurações (encargos, cargos)
│   └── login/               # Página de login
├── components/              # Componentes React
│   ├── layout/             # Sidebar, Header, MainLayout
│   └── ui/                 # Button, Input, Card, Toggle
├── contexts/               # Contextos React (Auth)
├── lib/                    # Utilitários e helpers
│   ├── supabase/          # Clientes Supabase
│   └── utils.ts           # Máscaras, formatação, validações
├── types/                  # TypeScript types
└── supabase/              # Schema SQL do banco
```

## 🎨 Tema e Estilo

O sistema usa um tema azul/roxo profissional:
- **Primary**: Azul índigo (#6366f1)
- **Secondary**: Roxo (#a855f7)
- **Dark**: Tons de cinza escuro (#1a1d23)

## 🔒 Permissões por Role

| Funcionalidade | ADMIN | GESTOR | RH | OPERADOR | LEITOR |
|----------------|-------|--------|----|-----------| -------|
| Dashboard | ✅ | ✅ | ✅ | ✅ | ✅ |
| Gestão Áreas | ✅ | ✅ | ❌ | ❌ | 👁️ |
| Lançamento MO | ✅ | ✅ | ✅ | ✅ | 👁️ |
| Funcionários | ✅ | ✅ | ✅ | ❌ | 👁️ |
| Manutenção | ✅ | ✅ | ❌ | ✅ | 👁️ |
| Consumo Água | ✅ | ✅ | ❌ | ✅ | 👁️ |
| Encargos | ✅ | ❌ | ❌ | ❌ | ❌ |
| Usuários | ✅ | ❌ | ❌ | ❌ | ❌ |

_👁️ = Apenas visualização_

## 📊 Exportação Excel

O botão "Gerar Relatório" no dashboard exporta um arquivo Excel (.xlsx) com:
- Aba Dashboard: Totais do período
- Aba Mão de Obra: Detalhamento de lançamentos
- Aba Manutenção: Histórico de manutenções
- Aba Consumo Água: Histórico de consumo

## 🐛 Troubleshooting

### Erro de conexão com Supabase
- Verifique se as variáveis de ambiente estão corretas
- Confirme que o projeto Supabase está ativo

### Usuário não consegue acessar dados
- Verifique se o `company_id` está definido no profile
- Confirme que a role está correta
- Verifique as RLS policies no Supabase

### Erro ao carregar gráficos
- Instale corretamente o recharts: `npm install recharts`
- Limpe o cache: `rm -rf .next && npm run dev`

## 🚀 Deploy

### Vercel (Recomendado)
1. Faça push do código para GitHub
2. Conecte o repositório na Vercel
3. Configure as variáveis de ambiente
4. Deploy automático!

### Outras plataformas
O projeto é compatível com qualquer plataforma que suporte Next.js 14+.

## 📝 Licença

Este projeto é proprietário. Todos os direitos reservados.

## 👨‍💻 Suporte

Para dúvidas ou problemas, entre em contato através do repositório.

---

Desenvolvido com ❤️ usando Next.js e Supabase
