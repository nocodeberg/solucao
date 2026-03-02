# Alterações - Lista de Produtos Expandida

## ✅ O que foi modificado

### **Lista expandida agora mostra DOIS tipos de produtos:**

#### 1. **Produtos Químicos** (destaque azul no topo)
- Fonte de dados: Tabela `chemical_products`
- Fundo azul claro (`bg-blue-50`)
- Colunas:
  - Produto Químico (nome)
  - Preço Unitário (R$/unidade)
  - Unidade (kg, L, etc)
- **Somente leitura** (sem ações de editar/excluir)

#### 2. **Produtos / Matéria-Prima** (abaixo)
- Fonte de dados: Tabela `products`
- Fundo branco
- Colunas:
  - Produto (nome)
  - Valor
  - Publicar (toggle)
  - Ações (editar/excluir)

---

## 📊 Como ficou a interface

### **Antes:**
```
Cobre Ácido ▼
  └─ Produtos:
     - Nenhum produto cadastrado
```

### **Agora:**
```
Cobre Ácido ▼
  ┌─ Produtos Químicos (17) [fundo azul]
  │  ├─ SULFATO DE COBRE PENTAHIDRATADO  |  R$ 68,90  |  kg
  │  ├─ BRILHANTE PRIMÁRIO COPPER SHINE A  |  R$ 145,00  |  L
  │  └─ ...
  │
  └─ Produtos / Matéria-Prima (0)
     └─ Nenhum produto de matéria-prima cadastrado
```

---

## 🎯 Código Modificado

### **Alterações no arquivo `app/gestao-areas/linhas/page.tsx`:**

1. **Novo estado adicionado:**
   ```typescript
   const [allChemicalProducts, setAllChemicalProducts] = useState<ChemicalProduct[]>([]);
   ```

2. **Carregar produtos químicos no loadData():**
   ```typescript
   const { data: chemicalData } = await supabase
     .from('chemical_products')
     .select('*')
     .eq('company_id', profile.company_id)
     .eq('active', true)
     .order('name');

   setAllChemicalProducts(chemicalData || []);
   ```

3. **Nova função helper:**
   ```typescript
   const getChemicalProductsByLine = (lineId: string) =>
     allChemicalProducts.filter((p) => p.production_line_id === lineId);
   ```

4. **Renderização com duas seções:**
   - Seção de produtos químicos (azul)
   - Seção de produtos de matéria-prima (branco)

---

## ✨ Benefícios

### **Visibilidade completa:**
- ✅ Ver todos os produtos químicos da linha de uma vez
- ✅ Ver quantos produtos químicos cada linha possui
- ✅ Comparar preços rapidamente
- ✅ Não precisa abrir o modal de lançamento para ver os produtos

### **Separação clara:**
- ✅ Produtos químicos destacados em azul
- ✅ Produtos de matéria-prima separados
- ✅ Contador de quantidade em cada seção

### **Sem afetar funcionalidades existentes:**
- ✅ Modal de lançamento continua funcionando igual
- ✅ Produtos de matéria-prima mantêm todas as ações
- ✅ Produtos químicos continuam sendo gerenciados via script SQL

---

## 📝 Próximos Passos

### **Para testar:**
1. Execute o script `PRODUTOS-ESPECIFICOS-FINAIS.sql` no Supabase
2. Recarregue a aplicação (F5)
3. Vá em: Gestão de Áreas > Linhas
4. Clique na seta para expandir uma linha
5. Você verá:
   - Seção azul com produtos químicos
   - Seção branca com produtos de matéria-prima

### **Resultado esperado:**
```
Cobre Ácido ▼ [expandido]

┌──────────────────────────────────────────────────────┐
│ Produtos Químicos (17)                   [fundo azul]│
│━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━│
│ ÁCIDO CLORÍDRICO FUMANTE 37%    R$ 9,80      L      │
│ ÁCIDO SULFÚRICO ELETRÔNICO 98%  R$ 16,70     L      │
│ ANODO COBRE FOSFOROSO 0,04%     R$ 58,20     kg     │
│ ... (14 mais produtos)                               │
└──────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────┐
│ Produtos / Matéria-Prima (0)             [fundo branco]│
│━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━│
│ Nenhum produto de matéria-prima cadastrado           │
└──────────────────────────────────────────────────────┘
```

---

## 🎨 Cores e Estilo

### **Produtos Químicos (azul):**
- Container: `bg-blue-50`
- Header tabela: `bg-blue-100`
- Bordas: `border-blue-200`
- Hover: `hover:bg-blue-100`

### **Produtos Matéria-Prima (cinza):**
- Container: fundo branco
- Header tabela: `bg-gray-50`
- Bordas: `border-gray-100`
- Hover: `hover:bg-gray-50`

---

## ✅ Status

- [x] Código modificado
- [x] Estado adicionado
- [x] Função de carregamento atualizada
- [x] Interface atualizada com duas seções
- [x] Estilos aplicados
- [ ] Testado após executar script SQL ⚠️ **VOCÊ PRECISA TESTAR**

---

**Está pronto para testar!** 🚀
