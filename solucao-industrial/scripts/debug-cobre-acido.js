const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Erro: Variáveis de ambiente não encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function debugCobreAcido() {
  console.log('🔍 DEBUG: Produtos da linha Cobre Ácido\n');

  // 1. Encontrar a linha Cobre Ácido
  console.log('1️⃣ Buscando linha "Cobre Ácido"...');
  const { data: linhas, error: linhasError } = await supabase
    .from('production_lines')
    .select('*')
    .ilike('name', '%cobre%');

  if (linhasError) {
    console.error('❌ Erro ao buscar linhas:', linhasError);
    return;
  }

  console.log(`✅ Encontradas ${linhas.length} linhas com "cobre":`);
  linhas.forEach(l => {
    console.log(`   - ${l.name} (ID: ${l.id}, Active: ${l.active})`);
  });

  if (linhas.length === 0) {
    console.log('⚠️ Nenhuma linha encontrada!');
    return;
  }

  const cobreAcido = linhas.find(l => l.name.toLowerCase().includes('ácido') || l.name.toLowerCase().includes('acido'));

  if (!cobreAcido) {
    console.log('\n⚠️ Linha "Cobre Ácido" não encontrada especificamente');
    console.log('📋 Usando primeira linha encontrada:', linhas[0].name);
  }

  const linha = cobreAcido || linhas[0];
  console.log(`\n🎯 Linha selecionada: ${linha.name} (ID: ${linha.id})`);

  // 2. Buscar TODOS os produtos químicos
  console.log('\n2️⃣ Buscando TODOS os produtos químicos...');
  const { data: todosProdutos, error: todosError } = await supabase
    .from('chemical_products')
    .select('*')
    .order('created_at', { ascending: false });

  if (todosError) {
    console.error('❌ Erro ao buscar todos os produtos:', todosError);
    return;
  }

  console.log(`✅ Total de produtos químicos: ${todosProdutos.length}`);

  // 3. Buscar produtos da linha específica
  console.log(`\n3️⃣ Buscando produtos da linha "${linha.name}"...`);
  const { data: produtosLinha, error: produtosError } = await supabase
    .from('chemical_products')
    .select('*')
    .eq('production_line_id', linha.id)
    .eq('active', true);

  if (produtosError) {
    console.error('❌ Erro ao buscar produtos da linha:', produtosError);
    return;
  }

  console.log(`✅ Produtos da linha: ${produtosLinha.length}`);
  if (produtosLinha.length > 0) {
    console.log('\n📦 Produtos encontrados:');
    produtosLinha.forEach((p, i) => {
      console.log(`   ${i + 1}. ${p.name} (ID: ${p.id})`);
      console.log(`      - Preço: R$ ${p.unit_price}`);
      console.log(`      - Linha ID: ${p.production_line_id}`);
      console.log(`      - Company ID: ${p.company_id}`);
      console.log(`      - Active: ${p.active}`);
    });
  } else {
    console.log('⚠️ NENHUM produto encontrado para esta linha!');
  }

  // 4. Buscar produto "teste 003"
  console.log('\n4️⃣ Buscando especificamente "teste 003"...');
  const { data: teste003, error: teste003Error } = await supabase
    .from('chemical_products')
    .select('*')
    .ilike('name', '%teste%003%');

  if (teste003Error) {
    console.error('❌ Erro ao buscar teste 003:', teste003Error);
    return;
  }

  if (teste003 && teste003.length > 0) {
    console.log(`✅ Produto "teste 003" encontrado:`);
    teste003.forEach(p => {
      console.log(`   - Nome: ${p.name}`);
      console.log(`   - ID: ${p.id}`);
      console.log(`   - Linha ID: ${p.production_line_id || 'NULL'}`);
      console.log(`   - Company ID: ${p.company_id}`);
      console.log(`   - Active: ${p.active}`);
    });

    // Verificar se a linha_id está correta
    if (teste003[0].production_line_id !== linha.id) {
      console.log(`\n⚠️ PROBLEMA ENCONTRADO!`);
      console.log(`   O produto "teste 003" está vinculado à linha: ${teste003[0].production_line_id}`);
      console.log(`   Mas deveria estar vinculado à linha: ${linha.id}`);

      // Buscar o nome da linha atual
      if (teste003[0].production_line_id) {
        const { data: linhaAtual } = await supabase
          .from('production_lines')
          .select('name')
          .eq('id', teste003[0].production_line_id)
          .single();

        if (linhaAtual) {
          console.log(`   Linha atual: ${linhaAtual.name}`);
        }
      }
    } else {
      console.log('\n✅ O vínculo está correto!');
    }
  } else {
    console.log('⚠️ Produto "teste 003" NÃO encontrado!');
  }

  // 5. Produtos sem linha
  console.log('\n5️⃣ Buscando produtos SEM linha vinculada...');
  const produtosSemLinha = todosProdutos.filter(p => !p.production_line_id);
  console.log(`⚠️ Produtos sem linha: ${produtosSemLinha.length}`);
  if (produtosSemLinha.length > 0) {
    produtosSemLinha.forEach((p, i) => {
      console.log(`   ${i + 1}. ${p.name} (ID: ${p.id})`);
    });
  }
}

debugCobreAcido()
  .then(() => {
    console.log('\n✅ Debug concluído!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Erro:', error);
    process.exit(1);
  });
