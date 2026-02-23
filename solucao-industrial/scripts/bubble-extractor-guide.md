# 📋 Guia: Extrair Dados do Bubble.io

## 🎯 Objetivo
Exportar dados do Bubble.io (versão live) para copiar no script de importação.

---

## 📊 Tabelas para Exportar

### 1. **Cargos**
**Acesse:** https://bubble.io/page?id=solucaoindustrial&tab=Data&type_id=cargos&version=live

**Campos para copiar:**
- `name` (nome do cargo)
- `description` (descrição)

**Formato esperado:**
```javascript
cargos: [
  { nome: 'Gerente de Produção', descricao: 'Responsável pela gestão da produção' },
  { nome: 'Operador', descricao: 'Opera máquinas' },
  // ... adicione todos os cargos
]
```

---

### 2. **Encargos**
**Acesse:** https://bubble.io/page?id=solucaoindustrial&tab=Data&type_id=encargos&version=live

**Campos para copiar:**
- `name` (nome do encargo, ex: INSS, FGTS)
- `percentual` (valor em percentual, ex: 20 para 20%)
- `description` (descrição)

**Formato esperado:**
```javascript
encargos: [
  { nome: 'INSS', percentual: 20, descricao: 'INSS Patronal' },
  { nome: 'FGTS', percentual: 8, descricao: 'Fundo de Garantia' },
  // ... adicione todos os encargos
]
```

---

### 3. **Production Lines (Linhas de Produção)**
**Acesse:** https://bubble.io/page?id=solucaoindustrial&tab=Data&type_id=production_lines&version=live

**Campos para copiar:**
- `name` (nome da linha)
- `description` (descrição)
- `line_type` (tipo: 'GALVANOPLASTIA' ou 'VERNIZ')
- `active` (true/false)

**Formato esperado:**
```javascript
production_lines: [
  { name: 'Linha 1 - Galvanoplastia', description: 'Linha principal', line_type: 'GALVANOPLASTIA', active: true },
  { name: 'Linha 2 - Verniz', description: 'Linha de verniz', line_type: 'VERNIZ', active: true },
  // ... adicione todas as linhas
]
```

---

### 4. **Products (Produtos/Matéria-Prima)**
**Acesse:** https://bubble.io/page?id=solucaoindustrial&tab=Data&type_id=products&version=live

**Campos para copiar:**
- `name` (nome do produto)
- `price` (preço em decimal, ex: 150.00)
- `production_line_name` (nome da linha - será mapeado depois)
- `published` (true/false)

**Formato esperado:**
```javascript
products: [
  { name: 'Sulfato de Cobre', price: 150.00, linha_nome: 'Linha 1 - Galvanoplastia', published: true },
  { name: 'Verniz Base', price: 250.00, linha_nome: 'Linha 2 - Verniz', published: true },
  // ... adicione todos os produtos
]
```

---

### 5. **Groups (Grupos de Acabamento)**
**Acesse:** https://bubble.io/page?id=solucaoindustrial&tab=Data&type_id=groups&version=live

**Campos para copiar:**
- `name` (nome do grupo)
- `description` (descrição)

**Formato esperado:**
```javascript
groups: [
  { name: 'Grupo A', description: 'Peças cromadas' },
  { name: 'Grupo B', description: 'Peças niqueladas' },
  // ... adicione todos os grupos
]
```

---

### 6. **Pieces (Peças)**
**Acesse:** https://bubble.io/page?id=solucaoindustrial&tab=Data&type_id=pieces&version=live

**Campos para copiar:**
- `name` (nome da peça)
- `area_dm2` (área em dm², ex: 10.5)
- `weight_kg` (peso em kg, ex: 2.3)
- `group_name` (nome do grupo - opcional)
- `production_type` (tipo de produção - opcional)

**Formato esperado:**
```javascript
pieces: [
  { name: 'Peça X1', area_dm2: 10.5, weight_kg: 2.3, grupo_nome: 'Grupo A', production_type: 'Série' },
  { name: 'Peça Y2', area_dm2: 15.2, weight_kg: 3.1, grupo_nome: 'Grupo B', production_type: 'Unitário' },
  // ... adicione todas as peças
]
```

---

### 7. **Employees (Funcionários)**
**Acesse:** https://bubble.io/page?id=solucaoindustrial&tab=Data&type_id=employees&version=live

**Campos para copiar:**
- `nome` (nome completo)
- `cpf` (CPF - opcional)
- `email` (email - opcional)
- `telefone` (telefone - opcional)
- `salario_base` (salário base em decimal, ex: 3000.00)
- `cargo_nome` (nome do cargo - opcional)
- `data_admissao` (data de admissão - opcional, formato: 'YYYY-MM-DD')
- `active` (true/false)

**Formato esperado:**
```javascript
employees: [
  {
    nome: 'João Silva',
    cpf: '12345678900',
    email: 'joao@email.com',
    telefone: '11999999999',
    salario_base: 3000.00,
    cargo_nome: 'Operador',
    data_admissao: '2023-01-15',
    active: true
  },
  // ... adicione todos os funcionários
]
```

---

## 🔍 Como Exportar do Bubble

### Opção 1: Exportação Manual (Recomendada)

1. Abra cada página de dados no Bubble
2. Para cada registro, copie os valores dos campos
3. Cole no formato JavaScript acima

### Opção 2: Exportação via Console do Navegador

1. Abra o Bubble no navegador
2. Pressione F12 para abrir Developer Tools
3. Vá na aba "Console"
4. Cole este código para exportar uma tabela (exemplo para cargos):

```javascript
// Para exportar CARGOS
var cargos = [];
document.querySelectorAll('[data-item-type="cargos"]').forEach(item => {
  cargos.push({
    nome: item.querySelector('.nome')?.textContent,
    descricao: item.querySelector('.descricao')?.textContent
  });
});
console.log(JSON.stringify(cargos, null, 2));
```

Depois copie o resultado do console.

---

## 📝 Depois de Coletar os Dados

1. Abra o arquivo: `scripts/import-bubble-data.js`
2. Cole todos os dados coletados no objeto `bubbleData`
3. Execute: `node scripts/import-bubble-data.js`

---

## ⚠️ Notas Importantes

- **IDs de Relacionamento:** Os produtos precisam saber a qual linha pertencem. Por isso, primeiro importamos as linhas, pegamos os IDs, e depois importamos os produtos.
- **Nomes Temporários:** Para produtos, peças e funcionários, use o nome da linha/grupo/cargo temporariamente. O script vai mapear automaticamente.
- **Campos Opcionais:** Se não tiver algum campo, deixe vazio ou não inclua.

---

## 🆘 Precisa de Ajuda?

Cole aqui os dados que você conseguiu extrair e eu formato para você!
