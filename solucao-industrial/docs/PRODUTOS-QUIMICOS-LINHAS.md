# Vinculação de Produtos Químicos a Linhas

## O que mudou?

### Antes
- Produtos químicos podiam ser cadastrados sem linha de produção
- Modal de lançamento mostrava todos os produtos da empresa
- Dificuldade em organizar produtos por linha

### Depois  
- **OBRIGATÓRIO**: Todo produto químico deve ter uma linha associada
- Modal de lançamento mostra APENAS produtos da linha selecionada
- Tela com CRUD completo de produtos químicos

## Nova Funcionalidade

### Tela: Lançamento de Pré-Tratamento

**Novos recursos:**
- ✅ Botão **Novo Produto Químico** para cadastrar produtos
- ✅ Campo **Linha de Produção** obrigatório no formulário
- ✅ Tabela mostra qual linha cada produto pertence
- ✅ Botões de Editar e Excluir funcionais

**Campos do formulário:**
1. Nome (obrigatório)
2. **Linha de Produção (obrigatório - NOVO\!)**
3. Preço Unitário (obrigatório)
4. Unidade (kg, L, un, m, m²)

## Como vincular produtos existentes?

Execute o SQL no Supabase SQL Editor:

\
Este script:
1. Lista produtos sem linha
2. Vincula à primeira linha ativa da empresa
3. Mostra resumo final

## Arquivos Alterados

- - \ (filtro já estava correto)
- \ (NOVO)
