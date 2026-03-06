// Script para verificar e corrigir vínculo de produtos com linhas
// Execute no terminal: node verificar-produtos-linha.js

const { createClient } = require('@supabase/supabase-js');

// Configuração - você precisa preencher com suas credenciais
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://sua-url.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'sua-chave';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function verificarECorrigir() {
  console.log('🔍 VERIFICANDO VÍNCULO DE PRODUTOS COM LINHAS...\n');

  try {
    // 1. Verificar produtos sem linha
    console.log('=== 1. PRODUTOS SEM LINHA ===');
    const { data: produtosSemLinha, error: error1 } = await supabase
      .from('chemical_products')
      .select(`
        id,
        name,
        company_id,
        production_line_id,
        active
      `)
      .eq('active', true)
      .is('production_line_id', null);

    if (error1) {
      console.error('❌ Erro ao buscar produtos sem linha:', error1);
      return;
    }

    console.log(`📊 Produtos sem linha: ${produtosSemLinha?.length || 0}`);
    produtosSemLinha?.forEach((p, i) => {
      console.log(`  ${i + 1}. ${p.name} (Empresa: ${p.company_id})`);
    });

    // 2. Verificar linhas disponíveis
    console.log('\n=== 2. LINHAS DISPONÍVEIS ===');
    const { data: linhas, error: error2 } = await supabase
      .from('production_lines')
      .select(`
        id,
        name,
        company_id,
        active,
        created_at
      `)
      .eq('active', true)
      .order('company_id, created_at');

    if (error2) {
      console.error('❌ Erro ao buscar linhas:', error2);
      return;
    }

    console.log(`📊 Linhas ativas: ${linhas?.length || 0}`);
    linhas?.forEach((l, i) => {
      console.log(`  ${i + 1}. ${l.name} (Empresa: ${l.company_id})`);
    });

    // 3. Corrigir produtos sem linha
    if (produtosSemLinha && produtosSemLinha.length > 0 && linhas && linhas.length > 0) {
      console.log('\n=== 3. CORRIGINDO VÍNCULOS ===');
      
      for (const produto of produtosSemLinha) {
        // Encontrar a primeira linha da mesma empresa
        const linhaDaEmpresa = linhas.find(l => l.company_id === produto.company_id);
        
        if (linhaDaEmpresa) {
          console.log(`🔧 Vinculando "${produto.name}" à linha "${linhaDaEmpresa.name}"`);
          
          const { error: errorUpdate } = await supabase
            .from('chemical_products')
            .update({ production_line_id: linhaDaEmpresa.id })
            .eq('id', produto.id);

          if (errorUpdate) {
            console.error(`❌ Erro ao atualizar produto ${produto.name}:`, errorUpdate);
          } else {
            console.log(`✅ Produto "${produto.name}" vinculado com sucesso!`);
          }
        } else {
          console.log(`⚠️ Nenhuma linha encontrada para a empresa ${produto.company_id}`);
        }
      }
    }

    // 4. Verificar resultado final
    console.log('\n=== 4. RESULTADO FINAL ===');
    const { data: resultadoFinal, error: error3 } = await supabase
      .from('chemical_products')
      .select(`
        id,
        name,
        company_id,
        production_line_id,
        active,
        production_lines(name)
      `)
      .eq('active', true)
      .order('name');

    if (error3) {
      console.error('❌ Erro ao verificar resultado:', error3);
      return;
    }

    console.log(`📊 Total de produtos ativos: ${resultadoFinal?.length || 0}`);
    
    // Agrupar por linha
    const produtosPorLinha = {};
    resultadoFinal?.forEach((p) => {
      const linhaNome = p.production_lines?.name || 'SEM LINHA';
      if (!produtosPorLinha[linhaNome]) {
        produtosPorLinha[linhaNome] = [];
      }
      produtosPorLinha[linhaNome].push(p.name);
    });

    Object.entries(produtosPorLinha).forEach(([linha, produtos]) => {
      console.log(`\n📦 ${linha}:`);
      produtos.forEach((p, i) => {
        console.log(`  ${i + 1}. ${p}`);
      });
    });

    console.log('\n✅ Verificação e correção concluídas!');
    console.log('\n📝 INSTRUÇÕES:');
    console.log('1. Abra a página de lançamento de pré-tratamento');
    console.log('2. Selecione uma linha de produção');
    console.log('3. Verifique se aparecem apenas os produtos daquela linha');
    console.log('4. Clique em "Realizar lançamento de Linha" para testar');

  } catch (err) {
    console.error('❌ Erro geral:', err);
  }
}

verificarECorrigir();
