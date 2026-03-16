require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function checkAssociations() {
  console.log('🔍 Verificando associações de produtos químicos com linhas...\n');

  // Buscar todas as linhas
  const { data: lines } = await supabase
    .from('production_lines')
    .select('*')
    .order('name');

  console.log('🏭 Linhas de produção cadastradas:');
  if (lines && lines.length > 0) {
    lines.forEach(line => {
      console.log(`   ${line.name} (${line.line_type}) - ID: ${line.id}`);
    });
  } else {
    console.log('   ⚠️ Nenhuma linha encontrada');
  }

  // Buscar todos os produtos químicos ativos
  const { data: products } = await supabase
    .from('chemical_products')
    .select('*')
    .eq('active', true)
    .order('name');

  console.log(`\n🧪 Total de produtos químicos ativos: ${products?.length || 0}\n`);

  if (products && products.length > 0) {
    // Agrupar por linha
    const byLine = {};
    const withoutLine = [];

    products.forEach(p => {
      if (p.production_line_id) {
        if (!byLine[p.production_line_id]) {
          byLine[p.production_line_id] = [];
        }
        byLine[p.production_line_id].push(p);
      } else {
        withoutLine.push(p);
      }
    });

    // Mostrar produtos por linha
    console.log('📊 Produtos por linha:\n');
    for (const [lineId, prods] of Object.entries(byLine)) {
      const line = lines?.find(l => l.id === lineId);
      const lineName = line ? line.name : 'Linha desconhecida';
      console.log(`   📍 ${lineName}:`);
      prods.forEach(p => {
        console.log(`      • ${p.name}`);
      });
      console.log('');
    }

    // Mostrar produtos sem linha
    if (withoutLine.length > 0) {
      console.log('   🚨 Produtos SEM linha associada:');
      withoutLine.forEach(p => {
        console.log(`      • ${p.name}`);
      });
    }
  }

  // Verificar especificamente os produtos da imagem
  console.log('\n🔍 Verificando produtos específicos mencionados:');
  const searchProducts = ['SODA', 'ACTIVE ZMC', 'COMPOSTO C-10', 'METAL CLEAN FE 05', 'teste 003', 'teste aa02'];

  for (const productName of searchProducts) {
    const { data: found } = await supabase
      .from('chemical_products')
      .select('id, name, production_line_id, active')
      .ilike('name', `%${productName}%`);

    if (found && found.length > 0) {
      found.forEach(p => {
        const line = lines?.find(l => l.id === p.production_line_id);
        const lineInfo = line ? `${line.name} (${line.line_type})` : 'SEM LINHA';
        console.log(`   ${p.name}: ${lineInfo} | Ativo: ${p.active}`);
      });
    } else {
      console.log(`   ${productName}: NÃO ENCONTRADO`);
    }
  }

  process.exit(0);
}

checkAssociations();
