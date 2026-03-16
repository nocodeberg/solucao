require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function checkAllProducts() {
  console.log('🔍 DEBUG: Verificando TODOS os produtos...\n');

  // 1. Verificar tabela products (matéria-prima)
  console.log('📦 TABELA: products (Produtos de Matéria-Prima)');
  const { data: products, error: prodError } = await supabase
    .from('products')
    .select('id, name, production_line_id, published')
    .order('name');

  if (prodError) {
    console.error('❌ Erro ao buscar products:', prodError);
  } else {
    console.log(`   Total: ${products?.length || 0} produtos`);
    products?.forEach(p => {
      console.log(`   - ${p.name} | Linha: ${p.production_line_id || 'NULL'} | Publicado: ${p.published}`);
    });
  }

  // 2. Verificar tabela chemical_products
  console.log('\n🧪 TABELA: chemical_products (Produtos Químicos)');
  const { data: chemicalProducts, error: chemError } = await supabase
    .from('chemical_products')
    .select('id, name, production_line_id, active')
    .order('name');

  if (chemError) {
    console.error('❌ Erro ao buscar chemical_products:', chemError);
  } else {
    console.log(`   Total: ${chemicalProducts?.length || 0} produtos`);
    chemicalProducts?.forEach(p => {
      console.log(`   - ${p.name} | Linha: ${p.production_line_id || 'NULL'} | Ativo: ${p.active}`);
    });
  }

  // 3. Verificar linhas de produção
  console.log('\n🏭 TABELA: production_lines');
  const { data: lines, error: linesError } = await supabase
    .from('production_lines')
    .select('id, name, line_type, active')
    .order('name');

  if (linesError) {
    console.error('❌ Erro ao buscar production_lines:', linesError);
  } else {
    console.log(`   Total: ${lines?.length || 0} linhas`);
    lines?.forEach(line => {
      console.log(`\n   📍 ${line.name} (${line.line_type}) - ID: ${line.id}`);

      // Contar produtos desta linha
      const productsCount = products?.filter(p => p.production_line_id === line.id).length || 0;
      const chemicalCount = chemicalProducts?.filter(p => p.production_line_id === line.id).length || 0;

      console.log(`      └─ ${productsCount} produtos matéria-prima`);
      if (productsCount > 0) {
        products?.filter(p => p.production_line_id === line.id).forEach(p => {
          console.log(`         • ${p.name}`);
        });
      }

      console.log(`      └─ ${chemicalCount} produtos químicos`);
      if (chemicalCount > 0) {
        chemicalProducts?.filter(p => p.production_line_id === line.id).forEach(p => {
          console.log(`         • ${p.name}`);
        });
      }
    });
  }

  process.exit(0);
}

checkAllProducts();
