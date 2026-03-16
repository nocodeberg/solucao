require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function checkProducts() {
  console.log('🔍 Verificando produtos químicos...\n');

  const { data, error } = await supabase
    .from('chemical_products')
    .select('id, name, production_line_id, active')
    .eq('active', true)
    .order('name');

  if (error) {
    console.error('❌ Erro:', error);
    process.exit(1);
  }

  console.log(`📊 Total de produtos ativos: ${data.length}\n`);

  const semLinha = data.filter(p => !p.production_line_id);
  const comLinha = data.filter(p => p.production_line_id);

  console.log(`🚨 Produtos SEM linha associada: ${semLinha.length}`);
  semLinha.forEach(p => {
    console.log(`  - ${p.name} (ID: ${p.id})`);
  });

  console.log(`\n✅ Produtos COM linha associada: ${comLinha.length}`);

  // Agrupar por linha
  const porLinha = {};
  comLinha.forEach(p => {
    if (!porLinha[p.production_line_id]) {
      porLinha[p.production_line_id] = [];
    }
    porLinha[p.production_line_id].push(p);
  });

  for (const [linhaId, produtos] of Object.entries(porLinha)) {
    console.log(`\n  Linha ${linhaId}:`);
    produtos.forEach(p => {
      console.log(`    - ${p.name}`);
    });
  }

  // Buscar informações das linhas
  console.log('\n📋 Buscando informações das linhas...');
  const { data: linhas } = await supabase
    .from('production_lines')
    .select('id, name, line_type')
    .order('name');

  console.log('\n🏭 Linhas de produção cadastradas:');
  linhas?.forEach(linha => {
    const qtd = porLinha[linha.id]?.length || 0;
    console.log(`  - ${linha.name} (${linha.line_type}) - ${qtd} produtos`);
  });

  process.exit(0);
}

checkProducts();
