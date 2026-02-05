# 🔌 Backend API - Solução Industrial

Servidor backend seguro com Express para o sistema Solução Industrial.

## 🔐 Segurança

### Implementações:
- ✅ **Helmet** - Proteção de headers HTTP
- ✅ **CORS** - Apenas frontend autorizado
- ✅ **Rate Limiting** - Proteção contra força bruta
- ✅ **Validação de dados** - Zod schemas
- ✅ **SQL Injection** - Queries parametrizadas (Supabase)
- ✅ **XSS Protection** - Sanitização automática
- ✅ **JWT Authentication** - Tokens seguros
- ✅ **RBAC** - Controle de acesso por role

## 📦 Instalação

```bash
cd server
npm install
```

## ⚙️ Configuração

Configure o arquivo `.env`:

```env
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

JWT_SECRET=your-jwt-secret
API_KEY=your-api-key
```

## 🚀 Execução

```bash
# Desenvolvimento (com auto-reload)
npm run dev

# Produção
npm start
```

## 📡 Endpoints

### Autenticação
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Usuário atual

### Dashboard
- `GET /api/dashboard/stats` - Estatísticas
- `GET /api/dashboard/chart-data` - Dados do gráfico

### Employees (Funcionários)
- `GET /api/employees` - Listar
- `GET /api/employees/:id` - Buscar
- `POST /api/employees` - Criar (ADMIN, RH, GESTOR)
- `PUT /api/employees/:id` - Atualizar (ADMIN, RH, GESTOR)
- `DELETE /api/employees/:id` - Deletar (ADMIN, RH, GESTOR)

### Production Lines (Linhas de Produção)
- `GET /api/production-lines`
- `POST /api/production-lines` (ADMIN, GESTOR)
- `PUT /api/production-lines/:id` (ADMIN, GESTOR)
- `DELETE /api/production-lines/:id` (ADMIN, GESTOR)

### Groups (Grupos)
- `GET /api/groups`
- `POST /api/groups` (ADMIN, GESTOR)
- `PUT /api/groups/:id` (ADMIN, GESTOR)
- `DELETE /api/groups/:id` (ADMIN, GESTOR)

### Pieces (Peças)
- `GET /api/pieces`
- `POST /api/pieces`

### Manutenção
- `GET /api/manutencao`
- `POST /api/manutencao`

### Consumo de Água
- `GET /api/consumo-agua`
- `POST /api/consumo-agua`

### Lançamento de Mão de Obra
- `GET /api/lancamento-mo`
- `POST /api/lancamento-mo`

### Encargos
- `GET /api/encargos`
- `PUT /api/encargos/:id` (ADMIN)

### Cargos
- `GET /api/cargos`
- `POST /api/cargos` (ADMIN, RH)
- `PUT /api/cargos/:id` (ADMIN, RH)
- `DELETE /api/cargos/:id` (ADMIN, RH)

## 🔒 Autenticação

Todas as rotas (exceto login) requerem token JWT no header:

```
Authorization: Bearer <token>
```

## 🛡️ Middlewares

### `authenticate`
Valida o token JWT e anexa `req.user` e `req.profile`.

### `authorize(...roles)`
Verifica se o usuário tem uma das roles permitidas.

### `canWrite`
Bloqueia usuários com role `LEITOR`.

## 📊 Rate Limits

- **Geral**: 100 requisições / 15 minutos
- **Login**: 5 tentativas / 15 minutos

## 🔍 Validações

Todos os endpoints validam:
- ✅ UUIDs válidos
- ✅ Tipos de dados corretos
- ✅ Campos obrigatórios
- ✅ Company ID (multi-tenant)
- ✅ Permissões de role

## 🚨 Tratamento de Erros

Respostas de erro sempre no formato:

```json
{
  "error": "Mensagem do erro",
  "details": [] // Opcional, para erros de validação
}
```

Códigos HTTP:
- `400` - Bad Request (dados inválidos)
- `401` - Unauthorized (não autenticado)
- `403` - Forbidden (sem permissão)
- `404` - Not Found
- `500` - Internal Server Error

## 🧪 Testando

```bash
# Health check
curl http://localhost:3001/health

# Login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@empresa.com","password":"senha"}'

# Listar funcionários (com token)
curl http://localhost:3001/api/employees \
  -H "Authorization: Bearer <token>"
```

## 📝 Logs

Em desenvolvimento, todas as requisições são logadas:

```
GET /api/employees 200 45.123 ms - 1234
POST /api/auth/login 401 12.456 ms - 56
```

## 🔧 Troubleshooting

### Erro de CORS
Verifique se `FRONTEND_URL` no `.env` está correto.

### Token inválido
O token expira após X tempo. Faça login novamente.

### Permissão negada
Verifique a role do usuário no banco de dados.

---

**Backend seguro e pronto para produção!** 🚀
