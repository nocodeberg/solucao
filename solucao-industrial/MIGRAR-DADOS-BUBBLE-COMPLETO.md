# 🚀 Guia Completo: Migrar Dados do Bubble.io para Supabase

## 📋 Processo em 3 Passos

### ✅ Passo 1: Extrair Dados do Bubble

1. **Abra o Bubble.io no navegador:**
   ```
   https://bubble.io/page?id=solucaoindustrial&tab=Data
   ```

2. **Abra o Console do Navegador:**
   - Pressione `F12`
   - Clique na aba **"Console"**

3. **Execute o Script Extrator:**
   - Abra o arquivo: `scripts/bubble-console-extractor.js`
   - Copie **TODO o conteúdo** do arquivo
   - Cole no Console e pressione `Enter`

4. **Copie o Resultado:**
   - O script vai gerar um JSON completo
   - Copie tudo entre `==== INÍCIO ====` e `==== FIM ====`

5. **Salve o JSON:**
   - Crie um arquivo: `scripts/bubble-data.json`
   - Cole o JSON copiado
   - Salve o arquivo

---

### ✅ Passo 2: Processar e Importar

Execute o script de importação:

```bash
node scripts/process-bubble-export.js
```

O script vai:
- ✅ Criar ou usar empresa existente
- ✅ Importar todos os cargos
- ✅ Importar todos os encargos
- ✅ Importar linhas de produção
- ✅ Importar grupos
- ✅ Importar produtos (vinculados às linhas)
- ✅ Importar peças (vinculadas aos grupos)
- ✅ Importar funcionários (vinculados aos cargos)

---

### ✅ Passo 3: Verificar

Acesse o sistema e verifique os dados:

**Local:**
```
http://localhost:3000/login
```

**Produção:**
```
https://solucao-industrial.vercel.app/login
```

**Páginas para verificar:**
- **Configurações → Cargos** (deve ter todos os cargos)
- **Configurações → Encargos** (deve ter todos os encargos)
- **Gestão Áreas → Linhas de Produção** (deve ter todas as linhas e produtos)
- **Gestão Áreas → Grupos** (deve ter todos os grupos)
- **Gestão Áreas → Peças** (deve ter todas as peças)
- **RH → Funcionários** (deve ter todos os funcionários)

---

## 🔧 Resolução de Problemas

### Erro: "Arquivo bubble-data.json não encontrado"

**Solução:**
1. Certifique-se de ter executado o Passo 1
2. Verifique se o arquivo está em: `scripts/bubble-data.json`
3. Verifique se o JSON está válido (não pode ter vírgulas extras, etc.)

---

### Erro: "Variáveis de ambiente não configuradas"

**Solução:**
1. Verifique se o arquivo `.env.local` existe na raiz do projeto
2. Deve conter:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://...
   SUPABASE_SERVICE_ROLE_KEY=...
   ```

---

### Script não encontra dados no Bubble

**Solução Alternativa - Extração Manual:**

1. Abra cada tabela no Bubble
2. Copie os dados manualmente
3. Crie o arquivo `scripts/bubble-data.json` no formato:

```json
{
  "cargos": [
    { "name": "Gerente", "description": "Gerente de Produção" }
  ],
  "encargos": [
    { "name": "INSS", "percentual": 20, "description": "INSS Patronal" }
  ],
  "production_lines": [
    {
      "name": "Linha 1",
      "description": "Galvanoplastia",
      "line_type": "GALVANOPLASTIA",
      "active": true
    }
  ],
  "products": [
    {
      "name": "Sulfato de Cobre",
      "price": 150.00,
      "production_line_id": "NOME_DA_LINHA",
      "published": true
    }
  ],
  "groups": [
    { "name": "Grupo A", "description": "Peças cromadas" }
  ],
  "pieces": [
    {
      "name": "Peça X1",
      "area_dm2": 10.5,
      "weight_kg": 2.3,
      "group_id": "NOME_DO_GRUPO"
    }
  ],
  "employees": [
    {
      "nome": "João Silva",
      "cpf": "12345678900",
      "email": "joao@email.com",
      "salario_base": 3000.00,
      "cargo": "NOME_DO_CARGO",
      "active": true
    }
  ]
}
```

---

## 📊 Mapeamento de Campos

### Bubble → Supabase

| Tabela | Campo Bubble | Campo Supabase |
|--------|-------------|----------------|
| **Cargos** | name | nome |
| | description | descricao |
| **Encargos** | name | nome |
| | percentual | percentual |
| | description | descricao |
| **Production Lines** | name | name |
| | description | description |
| | line_type | line_type |
| | active | active |
| **Products** | name | name |
| | price | price |
| | production_line_id | production_line_id |
| | published | published |
| **Groups** | name | name |
| | description | description |
| **Pieces** | name | name |
| | area_dm2 | area_dm2 |
| | weight_kg | weight_kg |
| | group_id | group_id |
| **Employees** | nome / full_name | nome |
| | cpf | cpf |
| | email | email |
| | salary / salario_base | salario_base |
| | cargo | cargo_id (mapeado) |

---

## ⚠️ Notas Importantes

1. **Relacionamentos:**
   - Produtos precisam de uma linha de produção existente
   - Peças podem ter grupo (opcional)
   - Funcionários podem ter cargo (opcional)

2. **Line Type:**
   - Só aceita: `'GALVANOPLASTIA'` ou `'VERNIZ'`
   - Se não tiver no Bubble, o padrão será `'GALVANOPLASTIA'`

3. **Campos Obrigatórios:**
   - Cargos: `nome`
   - Encargos: `nome`, `percentual`
   - Linhas: `name`, `line_type`
   - Produtos: `name`, `price`, `production_line_id`
   - Peças: `name`, `area_dm2`, `weight_kg`
   - Funcionários: `nome`, `salario_base`

4. **Company ID:**
   - O script cria automaticamente uma empresa se não existir
   - Ou usa a primeira empresa encontrada no banco

---

## 🎯 Dicas

✅ **Execute a extração quando o Bubble estiver estável** (sem atualizações em andamento)

✅ **Faça backup do Supabase antes** (caso precise reverter)

✅ **Teste primeiro em desenvolvimento** antes de importar na produção

✅ **Valide os dados após importação** navegando pelas páginas do sistema

---

## 🆘 Precisa de Ajuda?

Se tiver dificuldades:
1. Copie a mensagem de erro completa
2. Verifique qual passo falhou
3. Cole os dados que está tentando importar
4. Me avise para eu ajustar o script!

---

## ✅ Checklist Final

- [ ] Extraí os dados do Bubble (Passo 1)
- [ ] Criei o arquivo `scripts/bubble-data.json`
- [ ] Executei `node scripts/process-bubble-export.js`
- [ ] Verifiquei os dados no sistema
- [ ] Todos os dados estão corretos
- [ ] Sistema funcionando normalmente

🎉 **Pronto! Migração concluída com sucesso!**
