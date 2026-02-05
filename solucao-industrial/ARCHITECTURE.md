# 🏗️ Arquitetura - Solução Industrial

## 📋 Visão Geral

Sistema web full-stack para gestão industrial usando Next.js 14 (App Router) e Supabase.

### Stack Tecnológico

```
Frontend:
├── Next.js 14 (App Router, React 18, Server Components)
├── TypeScript (Type Safety)
├── Tailwind CSS (Styling)
└── Recharts (Data Visualization)

Backend:
├── Supabase Auth (Authentication)
├── Supabase Postgres (Database)
├── Supabase Storage (File Storage)
└── Row Level Security (RLS)

Tools:
├── Date-fns (Date manipulation)
├── XLSX (Excel export)
└── Lucide React (Icons)
```

---

## 📁 Estrutura de Diretórios

```
solucao-industrial/
│
├── app/                          # Next.js App Router
│   ├── layout.tsx               # Root layout (AuthProvider)
│   ├── page.tsx                 # Home page (redirect)
│   ├── globals.css              # Global styles
│   │
│   ├── login/
│   │   └── page.tsx             # Login page
│   │
│   ├── dashboard/
│   │   └── page.tsx             # Dashboard with charts
│   │
│   ├── gestao-areas/
│   │   ├── linhas/page.tsx      # Production lines
│   │   ├── pecas/page.tsx       # Pieces
│   │   └── grupos/page.tsx      # Groups
│   │
│   ├── manutencao/
│   │   └── page.tsx             # Maintenance
│   │
│   ├── consumo-agua/
│   │   └── page.tsx             # Water consumption
│   │
│   ├── rh/
│   │   ├── funcionarios/        # Employees
│   │   └── lancamento-mo/       # Labor cost entries
│   │
│   └── configuracoes/
│       ├── encargos/            # Labor charges
│       └── cargos/              # Job positions
│
├── components/
│   ├── layout/
│   │   ├── Sidebar.tsx          # Navigation sidebar
│   │   ├── Header.tsx           # Page header
│   │   └── MainLayout.tsx       # Main layout wrapper
│   │
│   └── ui/
│       ├── Button.tsx           # Button component
│       ├── Input.tsx            # Input component
│       ├── Card.tsx             # Card components
│       └── Toggle.tsx           # Toggle switch
│
├── contexts/
│   └── AuthContext.tsx          # Auth & RBAC context
│
├── lib/
│   ├── supabase/
│   │   ├── client.ts            # Client-side Supabase
│   │   └── server.ts            # Server-side Supabase
│   │
│   └── utils.ts                 # Utilities (masks, format, validation)
│
├── types/
│   └── database.types.ts        # TypeScript types for database
│
├── supabase/
│   ├── schema.sql               # Database schema
│   └── queries-uteis.sql        # Useful SQL queries
│
└── public/                      # Static assets
```

---

## 🗄️ Database Schema

### Entidades Principais

```
companies (Multi-tenant root)
├── profiles (Users)
├── production_lines (Production lines)
│   └── products (Products/Materials)
├── groups (Product groups)
├── pieces (Parts)
├── cargos (Job positions)
├── employees (Employees)
│   └── lancamento_mo (Labor entries)
├── encargos (Labor charges)
├── manutencao (Maintenance)
└── consumo_agua (Water consumption)
```

### Relacionamentos

```sql
companies (1) ──< (N) profiles
companies (1) ──< (N) production_lines
companies (1) ──< (N) employees

production_lines (1) ──< (N) products
production_lines (1) ──< (N) lancamento_mo

groups (1) ──< (N) pieces

employees (1) ──< (N) lancamento_mo
cargos (1) ──< (N) employees
```

---

## 🔐 Autenticação e RBAC

### Fluxo de Autenticação

```typescript
User Login
    ↓
Supabase Auth (JWT)
    ↓
Get Profile (company_id, role)
    ↓
AuthContext provides:
  - user: User
  - profile: Profile
  - hasPermission(roles)
  - canCreate, canEdit, canDelete
    ↓
Components use useAuth()
    ↓
Check permissions before render
```

### Roles e Permissões

```typescript
type UserRole = 'ADMIN' | 'GESTOR' | 'RH' | 'OPERADOR' | 'LEITOR';

const permissions = {
  ADMIN: ['*'],  // All permissions
  GESTOR: [
    'dashboard:read',
    'areas:*',
    'lancamentos:*',
    'reports:*'
  ],
  RH: [
    'dashboard:read',
    'employees:*',
    'lancamento_mo:*',
    'cargos:*'
  ],
  OPERADOR: [
    'dashboard:read',
    'lancamento_mo:create',
    'manutencao:create',
    'consumo_agua:create'
  ],
  LEITOR: [
    'dashboard:read',
    '*:read'  // Read only
  ]
};
```

### RLS (Row Level Security)

Todas as tabelas possuem policies que:
1. Verificam se o usuário está autenticado
2. Checam se o `company_id` corresponde ao do usuário
3. Validam a role para operações sensíveis

Exemplo:
```sql
CREATE POLICY "Users can view employees in their company"
ON employees FOR SELECT
USING (
  company_id IN (
    SELECT company_id FROM profiles WHERE id = auth.uid()
  )
);
```

---

## 🎨 Design System

### Paleta de Cores

```css
/* Primary (Blue/Indigo) */
--primary-50: #f0f4ff
--primary-500: #6366f1
--primary-600: #4f46e5 /* Main */
--primary-700: #4338ca

/* Secondary (Purple) */
--secondary-500: #a855f7
--secondary-600: #9333ea /* Main */

/* Dark (Sidebar) */
--dark-700: #343a40
--dark-800: #212529
--dark-900: #1a1d23 /* Main */
```

### Componentes UI

#### Button
```typescript
<Button
  variant="primary|secondary|danger|outline|ghost"
  size="sm|md|lg"
  icon={<Icon />}
>
  Text
</Button>
```

#### Input
```typescript
<Input
  label="Label"
  type="text|email|password|date"
  placeholder="..."
  error="Error message"
  icon={<Icon />}
/>
```

#### Card
```typescript
<Card
  title="Title"
  subtitle="Subtitle"
  headerAction={<Button />}
>
  Content
</Card>

<StatsCard
  title="Metric"
  value="R$ 1.000,00"
  icon={<Icon />}
  color="blue|purple|orange|green"
/>
```

---

## 📊 Data Flow

### Client → Supabase → Client

```typescript
// 1. Component mounts
useEffect(() => {
  loadData();
}, []);

// 2. Fetch data from Supabase
const loadData = async () => {
  const supabase = createSupabaseClient();

  const { data, error } = await supabase
    .from('employees')
    .select('*, cargo:cargos(name)')  // Join with cargos
    .eq('company_id', profile.company_id)  // Filter by company
    .eq('active', true)  // Only active
    .order('full_name');  // Sort

  if (error) {
    console.error(error);
    return;
  }

  setEmployees(data);
};

// 3. Update state
// 4. Re-render
```

### CRUD Operations

#### Create
```typescript
const handleCreate = async (newData) => {
  const { error } = await supabase
    .from('employees')
    .insert({
      ...newData,
      company_id: profile.company_id,  // Always add company_id
    });

  if (!error) {
    loadData();  // Refresh
  }
};
```

#### Update
```typescript
const handleUpdate = async (id, updates) => {
  const { error } = await supabase
    .from('employees')
    .update(updates)
    .eq('id', id)
    .eq('company_id', profile.company_id);  // Security check

  if (!error) {
    loadData();
  }
};
```

#### Delete
```typescript
const handleDelete = async (id) => {
  // Soft delete (recommended)
  const { error } = await supabase
    .from('employees')
    .update({ active: false })
    .eq('id', id);

  // Or hard delete
  // await supabase.from('employees').delete().eq('id', id);
};
```

---

## 🔄 State Management

### Local State (useState)
Para estado de componente individual:
```typescript
const [loading, setLoading] = useState(false);
const [data, setData] = useState([]);
const [error, setError] = useState('');
```

### Context API (AuthContext)
Para estado global (auth, user, permissions):
```typescript
const { user, profile, hasPermission, signOut } = useAuth();
```

### Server State (Supabase)
Supabase é a source of truth para dados:
- Não mantemos cópias desnecessárias
- Recarregamos após mutations
- Usamos Supabase Realtime para updates em tempo real (opcional)

---

## 📈 Performance Optimization

### 1. Server Components
```typescript
// Use Server Components when possible (no interactivity)
// app/dashboard/layout.tsx
export default function DashboardLayout({ children }) {
  return <div>{children}</div>;
}
```

### 2. Client Components Only When Needed
```typescript
'use client';  // Only when using hooks, events, etc.
```

### 3. Database Queries
```typescript
// ❌ Bad: N+1 queries
employees.forEach(emp => {
  const cargo = await supabase.from('cargos').select().eq('id', emp.cargo_id);
});

// ✅ Good: Join
const { data } = await supabase
  .from('employees')
  .select('*, cargo:cargos(name)');
```

### 4. Indexes
Schema já inclui índices em:
- Foreign keys
- Campos de filtro comuns (company_id, mes, ano, data)
- Campos de ordenação (created_at)

### 5. Pagination
```typescript
const { data, count } = await supabase
  .from('employees')
  .select('*', { count: 'exact' })
  .range(page * pageSize, (page + 1) * pageSize - 1);
```

---

## 🧪 Testing Strategy

### Testes Recomendados

1. **Unit Tests**: Funções em `lib/utils.ts`
```typescript
import { formatCurrency, maskCPF } from '@/lib/utils';

test('formatCurrency formats correctly', () => {
  expect(formatCurrency(1000)).toBe('R$ 1.000,00');
});
```

2. **Integration Tests**: Components com Supabase
```typescript
// Mock Supabase client
jest.mock('@/lib/supabase/client');
```

3. **E2E Tests**: Fluxos críticos (Cypress/Playwright)
```typescript
// Login → Dashboard → Lançar MO → Verificar no relatório
```

---

## 🚀 Deployment

### Vercel (Recommended)

```bash
# 1. Push to GitHub
git add .
git commit -m "Initial commit"
git push origin main

# 2. Import to Vercel
# vercel.com → New Project → Import from GitHub

# 3. Add environment variables:
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...

# 4. Deploy!
```

### Environment Variables
Sempre use `NEXT_PUBLIC_` para variáveis acessíveis no client.

---

## 📝 Convenções de Código

### Naming
- **Files**: PascalCase para componentes (`Button.tsx`)
- **Functions**: camelCase (`loadData`)
- **Constants**: UPPER_SNAKE_CASE (`MAX_ITEMS`)
- **Types**: PascalCase (`UserRole`)

### Imports
```typescript
// 1. External libraries
import React from 'react';
import { useRouter } from 'next/navigation';

// 2. Internal absolute imports
import Button from '@/components/ui/Button';
import { formatCurrency } from '@/lib/utils';

// 3. Relative imports (avoid when possible)
import { helper } from './helper';
```

### TypeScript
- Use tipos explícitos em props e retornos de função
- Evite `any`, use `unknown` se necessário
- Use interfaces para objetos, types para unions/aliases

---

## 🔧 Extending the System

### Adicionar Nova Tabela

1. **Criar migração SQL**
```sql
CREATE TABLE nova_tabela (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id),
  nome VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW()
);

-- RLS
ALTER TABLE nova_tabela ENABLE ROW LEVEL SECURITY;

CREATE POLICY "company_policy" ON nova_tabela
USING (company_id IN (
  SELECT company_id FROM profiles WHERE id = auth.uid()
));
```

2. **Adicionar tipo TypeScript**
```typescript
// types/database.types.ts
export interface NovaTabela {
  id: string;
  company_id: string;
  nome: string;
  created_at: string;
}
```

3. **Criar página**
```typescript
// app/nova-funcionalidade/page.tsx
'use client';

export default function NovaFuncionalidadePage() {
  const { profile } = useAuth();
  const supabase = createSupabaseClient();

  // CRUD operations...

  return <MainLayout>...</MainLayout>;
}
```

4. **Adicionar ao menu**
```typescript
// components/layout/Sidebar.tsx
const menuItems = [
  // ...
  {
    id: 'nova-funcionalidade',
    label: 'Nova Funcionalidade',
    icon: <Icon />,
    href: '/nova-funcionalidade',
  },
];
```

---

## 📚 Resources

- [Next.js Docs](https://nextjs.org/docs)
- [Supabase Docs](https://supabase.com/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Recharts](https://recharts.org/en-US/api)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)

---

**Arquitetura projetada para escalabilidade, segurança e manutenibilidade** 🚀
