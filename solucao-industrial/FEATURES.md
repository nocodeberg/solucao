# ✨ Funcionalidades - Solução Industrial

## 📋 Visão Geral

Sistema completo de gestão industrial com controle de custos, mão de obra, produção e relatórios.

---

## 🔐 1. Autenticação e Segurança

### Login
- ✅ Autenticação via email/senha
- ✅ Sessão persistente (lembrar-me)
- ✅ Recuperação de senha
- ✅ Proteção de rotas
- ✅ JWT tokens seguros

### RBAC (Controle de Acesso)
- ✅ 5 níveis de permissão:
  - **ADMIN**: Acesso total ao sistema
  - **GESTOR**: Gestão de áreas e relatórios
  - **RH**: Gestão de pessoas e custos de MO
  - **OPERADOR**: Lançamentos operacionais
  - **LEITOR**: Apenas visualização

### Multi-tenant
- ✅ Isolamento completo entre empresas
- ✅ Dados protegidos por RLS (Row Level Security)
- ✅ Um usuário = uma empresa

---

## 📊 2. Dashboard Analítico

### Filtros Inteligentes
- ✅ Seleção de meses (Jan/2026, Fev/2026, etc.)
- ✅ Seleção de ano
- ✅ Botão "Total" para visualizar todo o ano
- ✅ Filtros persistem na navegação

### Cards de Métricas
```
┌─────────────────┬─────────────────┬─────────────────┬─────────────────┐
│ Funcionários    │ Custo M.O.D     │ Custo M.O.I     │ Matéria Prima   │
│ 25 ativos       │ R$ 87.290,45    │ R$ 12.500,00    │ R$ 5.000,00     │
└─────────────────┴─────────────────┴─────────────────┴─────────────────┘

┌─────────────────┬─────────────────┬─────────────────┬─────────────────┐
│ Consumo Água    │ Manutenção      │ Total Operação  │ Total Geral     │
│ R$ 1.900,00     │ R$ 8.500,00     │ R$ 104.790,45   │ R$ 113.290,45   │
└─────────────────┴─────────────────┴─────────────────┴─────────────────┘
```

### Gráficos Interativos
- ✅ Gráfico de linha mensal (Recharts)
- ✅ Abas para visualizar diferentes métricas:
  - Custo M.O.D
  - Custo M.O.I
  - Manutenção
  - Matéria Prima
- ✅ Total grande à direita do gráfico
- ✅ Tooltip com valores formatados

### Exportação de Relatórios
- ✅ Botão "Gerar Relatório"
- ✅ Exporta arquivo Excel (.xlsx)
- ✅ Múltiplas abas:
  - Dashboard (totais)
  - Mão de Obra (detalhamento)
  - Manutenção
  - Consumo de Água
  - Matéria Prima

---

## 🏭 3. Gestão de Áreas

### 3.1. Linhas de Produção

#### Funcionalidades
- ✅ Cadastro de linhas (Pré-Tratamento, Cobre Alcalino, etc.)
- ✅ Ativar/desativar linhas (toggle)
- ✅ Descrição e observações
- ✅ Lançamento de custos por linha

#### Produtos por Linha
- ✅ Cada linha tem seus produtos/matéria-prima
- ✅ Preço por produto
- ✅ Toggle "Publicar" para ativar/desativar produto
- ✅ Ações: Editar, Deletar

**Exemplo de Linha:**
```
┌─────────────────────────────────────────────────────────┐
│ 🔧 Cobre Alcalino                      [Ativo] [Editar] │
│ [Realizar lançamento de Linha]      [+ Novo produto]    │
├─────────────────────────────────────────────────────────┤
│ Produto             │ Valor        │ Publicar │ Ações   │
├─────────────────────┼──────────────┼──────────┼─────────┤
│ SULFATO DE COBRE    │ R$ 75,00     │ ●        │ ✏️ 🗑️  │
│ ÁCIDO SULFÚRICO     │ R$ 15,00     │ ●        │ ✏️ 🗑️  │
│ ÂNODO DE COBRE      │ R$ 0,00      │ ●        │ ✏️ 🗑️  │
└─────────────────────┴──────────────┴──────────┴─────────┘
```

### 3.2. Grupos de Acabamento

#### Funcionalidades
- ✅ Cadastro de grupos (Cromo, Níquel, Verniz, etc.)
- ✅ Descrição do grupo
- ✅ Vincular peças ao grupo
- ✅ Ações: Editar, Deletar

**Grupos Padrão:**
- Cromo, Cromo II
- Níquel Strike
- Verniz Cataforético (Cobre, Preto Fosco, Preto Brilhante, Gold, Champagne, Grafite Onix)
- Verniz Imersão C

### 3.3. Peças

#### Funcionalidades
- ✅ Cadastro de peças/produtos
- ✅ Propriedades:
  - Nome da peça
  - Área em dm² (decímetro quadrado)
  - Peso em kg
  - Grupo vinculado
- ✅ Botão "Lança Produção"
- ✅ Filtro por grupo
- ✅ Busca por nome

**Tabela de Peças:**
```
┌────┬─────────────────┬─────────────────┬────────┬─────┬────────────┐
│ Id │ Lança Produção  │ Peça            │ Área   │Peso │ Grupo      │
├────┼─────────────────┼─────────────────┼────────┼─────┼────────────┤
│1515│ [▶ Lançar]      │ Canopla         │ 10 dm² │ 0,2 │ Cromo II   │
│7077│ [▶ Lançar]      │ Volante alavanca│ 15 dm² │ 0,15│ Níquel S.  │
└────┴─────────────────┴─────────────────┴────────┴─────┴────────────┘
```

---

## 🔧 4. Manutenção

### Funcionalidades
- ✅ Registro de manutenções
- ✅ Campos:
  - Descrição (o que foi feito)
  - Valor (custo da manutenção)
  - Data
  - Área/Linha (opcional)
  - Observações
- ✅ Histórico completo
- ✅ Filtro por data
- ✅ Busca por descrição

### Interface
```
┌──────────────────────────────────────────────────────────┐
│ Manutenção                            [+ Lançar]         │
├──────────────────────────────────────────────────────────┤
│ Histórico de manutenção                                  │
├──────────────────┬──────────────┬────────────┬──────────┤
│ Descrição        │ Valor        │ Data       │ Ações    │
├──────────────────┼──────────────┼────────────┼──────────┤
│ Lançamento mensal│ R$ 0,00      │ 01/12/2025 │ ✏️ 🗑️   │
│ Reparo bomba     │ R$ 27.000,00 │ 01/06/2025 │ ✏️ 🗑️   │
└──────────────────┴──────────────┴────────────┴──────────┘
```

---

## 💧 5. Consumo de Água

### Funcionalidades
- ✅ Registro de consumo mensal
- ✅ Campos:
  - Descrição (Lançamento mensal, consumo extra, etc.)
  - Valor (custo)
  - Data
  - Observações
- ✅ Histórico completo
- ✅ Filtro por data
- ✅ Total no período

### Cálculos
- ✅ Soma automática por mês
- ✅ Média mensal
- ✅ Comparação com meses anteriores

---

## 👥 6. Gestão de Colaboradores

### 6.1. Funcionários

#### Funcionalidades
- ✅ Cadastro completo:
  - Nome completo
  - Email (opcional)
  - CPF (com máscara e validação)
  - Telefone (com máscara)
  - Salário base
  - Cargo vinculado
  - Data de admissão
  - Status: Ativo/Inativo
  - Foto (upload para Supabase Storage)
- ✅ Listagem com:
  - Nome
  - Salário
  - Custo do último mês (salário + encargos)
  - Data de inclusão
  - Status ativo
- ✅ Busca por nome
- ✅ Filtro por cargo
- ✅ Filtro por status (ativo/inativo)
- ✅ Ordenação

**Tabela de Funcionários:**
```
┌──────────────────────┬────────────┬─────────────┬────────────┬────────┐
│ Nome                 │ Salário    │ Custo Mês   │ Inclusão   │ Ativo  │
├──────────────────────┼────────────┼─────────────┼────────────┼────────┤
│ Agelica Aparecida M. │ R$ 2.088,14│ -           │ 05/06/2025 │ ●      │
│ Clayton Malta        │ R$ 4.500,00│ R$ 7.698,64 │ 02/10/2024 │ ●      │
│ Gutemberg Santos     │ R$ 2.349,16│ R$ 3.698,62 │ 03/07/2025 │ ●      │
└──────────────────────┴────────────┴─────────────┴────────────┴────────┘
```

### 6.2. Lançamento de Mão de Obra

#### Funcionalidades
- ✅ Registro de custos de MO por funcionário
- ✅ Campos:
  - Selecionar área/linha
  - Selecionar funcionário
  - Tipo: MOD (Mão de Obra Direta) ou MOI (Indireta)
  - Mês/Ano do lançamento
  - Data do lançamento
  - Horas trabalhadas (opcional)
  - Observações
- ✅ Cálculo automático:
  - Salário base
  - + Encargos configurados (INSS, FGTS, etc.)
  - = Custo mensal total
- ✅ Histórico de lançamentos
- ✅ Filtro por período, funcionário, linha

**Cálculo de Custo:**
```
Salário Base: R$ 2.500,00
+ INSS (10%): R$ 250,00
+ FGTS (8%):  R$ 200,00
+ Férias (12%): R$ 300,00
+ 1/3 Férias (3%): R$ 75,00
+ 13º (12%): R$ 300,00
+ Insalubridade (20%): R$ 500,00
─────────────────────────
= Custo Mensal: R$ 4.125,00
```

**Tabela de Lançamentos:**
```
┌──────────────┬─────────────┬──────────┬──────────┬────────────┬────────────┐
│ Nome         │ Linha       │ Salário  │ Custo    │ Mês Lanç.  │ Data Lanç. │
├──────────────┼─────────────┼──────────┼──────────┼────────────┼────────────┤
│ Gutemberg S. │ Pré-Trata.  │ 2.349,16 │ 3.698,62 │ 03/07/2025 │ 03/07/2025 │
│ Renata A. X. │ Pré-T./Ver. │ 2.500,00 │ 3.936,11 │ 25/02/2025 │ 25/02/2025 │
│ Clayton M.   │ Cobre Alc.  │ 4.500,00 │ 7.698,64 │ 20/02/2025 │ 20/02/2025 │
└──────────────┴─────────────┴──────────┴──────────┴────────────┴────────────┘
```

---

## ⚙️ 7. Configurações

### 7.1. Encargos Trabalhistas

#### Funcionalidades
- ✅ Configuração de encargos
- ✅ Tipos:
  - Percentual (%) sobre o salário
  - Valor fixo (R$)
- ✅ Encargos padrão:
  - INSS (10%)
  - FGTS (8%)
  - Férias (12% = 1/12 do salário anual)
  - 1/3 Férias (3%)
  - 13º Salário (12% = 1/12 do salário anual)
  - Insalubridade (20% ou conforme grau)
- ✅ Editar valores
- ✅ Ativar/desativar encargo
- ✅ Adicionar novos encargos

**Tabela de Encargos:**
```
┌─────────────────┬──────────┬──────────────────────────────┐
│ Nome            │ Valor    │ Ações                        │
├─────────────────┼──────────┼──────────────────────────────┤
│ INSS            │ 10%      │ [Editar] [Ativo ●]           │
│ FGTS            │ 8%       │ [Editar] [Ativo ●]           │
│ Férias          │ 12       │ [Editar] [Ativo ●]           │
│ 1/3 Férias      │ 3%       │ [Editar] [Ativo ●]           │
│ 13º Salário     │ 12       │ [Editar] [Ativo ●]           │
│ Insalubridade   │ 20%      │ [Editar] [Ativo ●]           │
└─────────────────┴──────────┴──────────────────────────────┘
```

### 7.2. Cargos

#### Funcionalidades
- ✅ Cadastro de cargos/funções
- ✅ Campos:
  - Nome do cargo
  - Descrição (atribuições)
- ✅ Vincular funcionários ao cargo
- ✅ Listar cargos
- ✅ Editar/Deletar (se não houver funcionários vinculados)

**Cargos Comuns:**
- Operador
- Líder
- Auxiliar
- Supervisor
- Técnico Químico
- Auxiliar de Inspeção
- Auxiliar de Produção
- Assistente de Inspeção
- Operador de Verniz

---

## 👤 8. Gestão de Usuários

### Funcionalidades (ADMIN apenas)
- ✅ Listar usuários da empresa
- ✅ Editar role de usuários
- ✅ Ativar/desativar usuários
- ✅ Ver último acesso
- ✅ Convidar novos usuários (via email)

**Tabela de Usuários:**
```
┌──────────────────────┬──────────────────────┬──────────┬─────────┐
│ Nome                 │ Email                │ Role     │ Ativo   │
├──────────────────────┼──────────────────────┼──────────┼─────────┤
│ Admin                │ admin@empresa.com    │ ADMIN    │ ●       │
│ Gutemberg Santos     │ guttemberg@gmail.com │ GESTOR   │ ●       │
│ Clayton Malta        │ clayton@gmail.com    │ OPERADOR │ ●       │
└──────────────────────┴──────────────────────┴──────────┴─────────┘
```

---

## 📄 9. Relatórios

### Exportação Excel

#### Abas do Relatório
1. **Dashboard Totais**
   - Período selecionado
   - Totais de cada métrica
   - Variação percentual vs mês anterior

2. **Mão de Obra**
   - Nome, Cargo, Linha
   - Salário base, Encargos, Custo total
   - Tipo (MOD/MOI)
   - Mês/Ano

3. **Manutenção**
   - Descrição, Valor, Data
   - Linha (se aplicável)
   - Total do período

4. **Consumo de Água**
   - Descrição, Valor, Data
   - Total do período
   - Média mensal

5. **Matéria Prima**
   - Produto, Linha, Quantidade, Valor
   - Total consumido

### Filtros de Relatório
- ✅ Por período (mês/ano ou intervalo)
- ✅ Por área/linha específica
- ✅ Por tipo de custo (MOD, MOI, Manutenção, etc.)
- ✅ Comparativo entre períodos

---

## 🎨 10. Interface e UX

### Tema
- ✅ Cores: Azul/Roxo profissional
- ✅ Sidebar escura fixa à esquerda
- ✅ Cards arredondados com sombra suave
- ✅ Ícones Lucide React
- ✅ Animações suaves (transitions)

### Responsividade
- ✅ Desktop first (otimizado para 1366px+)
- ✅ Adaptável a tablets (768px+)
- ✅ Sidebar colapsável em mobile

### Componentes Reutilizáveis
- ✅ Buttons com variants
- ✅ Inputs com validação e máscaras
- ✅ Cards e StatsCards
- ✅ Toggles animados
- ✅ Modals de confirmação
- ✅ Toasts para feedback

### Máscaras Brasileiras
- ✅ Moeda: R$ 1.234,56
- ✅ Data: DD/MM/AAAA
- ✅ CPF: 123.456.789-00
- ✅ CNPJ: 12.345.678/0001-00
- ✅ Telefone: (00) 00000-0000

### Validações
- ✅ Email válido
- ✅ CPF válido (dígitos verificadores)
- ✅ CNPJ válido
- ✅ Datas válidas
- ✅ Valores não negativos
- ✅ Campos obrigatórios

---

## 🚀 11. Performance

### Otimizações Implementadas
- ✅ Server Components (Next.js 14)
- ✅ Queries otimizadas com JOINs
- ✅ Índices no banco de dados
- ✅ Lazy loading de componentes pesados
- ✅ Debounce em buscas
- ✅ Paginação em tabelas grandes
- ✅ Cache de dados estáticos

### Métricas Alvo
- Lighthouse Score: 90+
- First Contentful Paint: < 1.5s
- Time to Interactive: < 3s
- Largest Contentful Paint: < 2.5s

---

## 🔜 Roadmap (Futuras Funcionalidades)

### Planejado
- [ ] Notificações push
- [ ] Relatórios agendados (email semanal/mensal)
- [ ] Dashboard mobile app (React Native)
- [ ] Integração com ERPs (SAP, TOTVS)
- [ ] Controle de estoque de matéria-prima
- [ ] Ordem de produção digital
- [ ] Rastreabilidade de lotes
- [ ] API pública (REST)
- [ ] Webhooks para integrações
- [ ] Multi-idioma (EN, ES)

### Em Consideração
- [ ] BI integrado (Power BI / Metabase)
- [ ] Machine Learning para previsão de custos
- [ ] Manutenção preditiva (IoT)
- [ ] Integração com sensores de linha
- [ ] Aplicativo para apontamento de horas (tablet)

---

**Sistema completo e pronto para produção!** 🎉
