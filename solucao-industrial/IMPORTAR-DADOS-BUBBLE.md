# 📊 Guia: Importar Dados do Bubble.io para Supabase

## 🎯 Objetivo
Migrar todos os dados da versão live do Bubble.io para o novo sistema Supabase.

---

## 📋 Passo a Passo

### 1️⃣ Obter o ID da Empresa no Supabase

Primeiro, precisamos saber qual empresa usar no Supabase:

```bash
node scripts/criar-empresa-solucao-global.js
```

Ou consulte diretamente no Supabase:
1. Acesse: https://supabase.com/dashboard/project/csvhywnaiqfofudhwwgf/editor
2. Abra a tabela `companies`
3. Copie o `id` da empresa que quer usar

---

### 2️⃣ Exportar Dados do Bubble.io

#### Opção A: Exportação Manual via Interface

1. **Acesse o Bubble.io:**
   - https://bubble.io/page?id=solucaoindustrial&tab=Data

2. **Para cada tabela, faça:**

   **Cargos:**
   - Vá em: Data → App Data → cargos
   - Clique em cada cargo e anote:
     ```json
     { "nome": "Nome do Cargo", "descricao": "Descrição" }
     ```

   **Encargos:**
   - Vá em: Data → App Data → encargos
   - Anote:
     ```json
     { "nome": "INSS", "percentual": 20, "descricao": "INSS Patronal" }
     ```

   **Linhas de Produção:**
   - Vá em: Data → App Data → production_lines
   - Anote:
     ```json
     {
       "name": "Linha 1",
       "description": "Descrição",
       "line_type": "GALVANOPLASTIA",
       "active": true
     }
     ```

   **Produtos:**
   - Vá em: Data → App Data → products
   - Anote (você vai precisar relacionar com a linha depois):
     ```json
     {
       "name": "Sulfato de Cobre",
       "price": 150.00,
       "linha": "nome da linha",
       "published": true
     }
     ```

   **Grupos:**
   - Vá em: Data → App Data → groups
   - Anote:
     ```json
     { "name": "Grupo A", "description": "Descrição" }
     ```

   **Peças:**
   - Vá em: Data → App Data → pieces
   - Anote:
     ```json
     {
       "name": "Peça 1",
       "area_dm2": 10.5,
       "weight_kg": 2.3,
       "grupo": "nome do grupo"
     }
     ```

   **Funcionários:**
   - Vá em: Data → App Data → employees
   - Anote:
     ```json
     {
       "nome": "João Silva",
       "cpf": "12345678900",
       "email": "joao@email.com",
       "salario_base": 3000,
       "cargo": "nome do cargo",
       "active": true
     }
     ```

#### Opção B: Usar API do Bubble (se tiver chave)

Se você tiver uma API Key do Bubble, pode exportar via API.

---

### 3️⃣ Editar o Script de Importação

Abra o arquivo: `scripts/import-bubble-data.js`

1. **Substitua o COMPANY_ID:**
   ```javascript
   const COMPANY_ID = 'cole-aqui-o-id-da-empresa';
   ```

2. **Cole os dados nas variáveis:**
   ```javascript
   const bubbleData = {
     cargos: [
       { nome: 'Gerente', descricao: 'Gerente de produção' },
       { nome: 'Operador', descricao: 'Operador de máquina' }
     ],

     encargos: [
       { nome: 'INSS', percentual: 20, descricao: 'INSS Patronal' },
       { nome: 'FGTS', percentual: 8, descricao: 'FGTS' }
     ],

     production_lines: [
       { name: 'Linha 1', description: 'Galvanoplastia', line_type: 'GALVANOPLASTIA', active: true }
     ],

     // ... e assim por diante
   };
   ```

---

### 4️⃣ Executar a Importação

```bash
node scripts/import-bubble-data.js
```

O script vai:
- ✅ Criar todos os cargos
- ✅ Criar todos os encargos
- ✅ Criar linhas de produção
- ✅ Criar grupos
- ✅ Criar produtos (você precisará relacionar com IDs das linhas)
- ✅ Criar peças
- ✅ Criar funcionários

---

### 5️⃣ Relacionar Produtos com Linhas

Após importar as linhas de produção, você receberá os IDs:

```
✅ 3 linhas de produção importadas
   IDs: [
     { id: 'abc-123', name: 'Linha 1' },
     { id: 'def-456', name: 'Linha 2' }
   ]
```

Use esses IDs para importar os produtos:

```javascript
products: [
  {
    name: 'Sulfato de Cobre',
    price: 150.00,
    production_line_id: 'abc-123',  // ← Use o ID da linha aqui
    published: true
  }
]
```

---

## 🔧 Importação Incremental

Se preferir importar aos poucos:

### Apenas Cargos:
```javascript
const bubbleData = {
  cargos: [
    { nome: 'Gerente', descricao: 'Gerente de produção' }
  ],
  encargos: [],
  production_lines: [],
  products: [],
  groups: [],
  pieces: [],
  employees: []
};
```

Execute: `node scripts/import-bubble-data.js`

Depois edite e adicione os próximos dados.

---

## ⚠️ Importante

1. **IDs de Relacionamentos:**
   - Produtos precisam do `production_line_id`
   - Peças podem ter `group_id` (opcional)
   - Funcionários podem ter `cargo_id` (opcional)

2. **Tipos de Linha:**
   - Só aceita: `'GALVANOPLASTIA'` ou `'VERNIZ'`

3. **Campos Obrigatórios:**
   - Cargos: `nome`
   - Encargos: `nome`, `percentual`
   - Linhas: `name`, `line_type`
   - Produtos: `name`, `price`, `production_line_id`
   - Peças: `name`, `area_dm2`, `weight_kg`
   - Funcionários: `nome`, `salario_base`

---

## 🆘 Se Tiver Problemas

1. **Erro de campo faltando:**
   - Verifique se todos os campos obrigatórios estão preenchidos

2. **Erro de foreign key:**
   - Certifique-se que os IDs de relacionamento existem
   - Importe na ordem: cargos → linhas → produtos → funcionários

3. **Erro de company_id:**
   - Verifique se o COMPANY_ID está correto no script

---

## ✅ Verificar Importação

Após importar, verifique no sistema:

1. Acesse: http://localhost:3000 (ou https://solucao-industrial.vercel.app)
2. Faça login
3. Navegue pelas páginas:
   - Configurações → Cargos
   - Configurações → Encargos
   - Gestão Áreas → Linhas de Produção
   - RH → Funcionários

---

## 📞 Precisa de Ajuda?

Se tiver dúvidas ou problemas, me avise com:
- Qual passo está tentando fazer
- Qual erro apareceu
- Print dos dados que está tentando importar
