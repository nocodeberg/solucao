/**
 * Script para verificar o estado atual do banco de dados
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Erro: Variáveis de ambiente não configuradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkDatabaseStatus() {
  console.log('=== VERIFICAÇÃO DO BANCO DE DADOS ===\n');

  try {
    // 1. Verificar empresas
    const { data: companies } = await supabase
      .from('companies')
      .select('id, name');

    console.log('📊 EMPRESAS CADASTRADAS\n');
    companies.forEach((company, idx) => {
      console.log(`${idx + 1}. ${company.name} (${company.id})`);
    });

    // 2. Para cada empresa, verificar linhas e produtos
    for (const company of companies) {
      console.log(`\n\n${'='.repeat(70)}`);
      console.log(`EMPRESA: ${company.name}`);
      console.log('='.repeat(70));

      // Linhas de produção
      const { data: lines } = await supabase
        .from('production_lines')
        .select('*')
        .eq('company_id', company.id)
        .order('name');

      console.log(`\n📋 LINHAS DE PRODUÇÃO: ${lines.length} linhas\n`);

      const galvano = lines.filter(l => l.line_type === 'GALVANOPLASTIA');
      const verniz = lines.filter(l => l.line_type === 'VERNIZ');

      console.log(`   GALVANOPLASTIA: ${galvano.length} linhas`);
      galvano.forEach(l => console.log(`      - ${l.name}`));

      console.log(`\n   VERNIZ: ${verniz.length} linhas`);
      verniz.forEach(l => console.log(`      - ${l.name}`));

      // Produtos químicos
      const { data: products } = await supabase
        .from('chemical_products')
        .select('id, name, production_line_id')
        .eq('company_id', company.id);

      console.log(`\n\n📦 PRODUTOS QUÍMICOS: ${products.length} produtos\n`);

      // Contar produtos por linha
      const productsByLine = {};
      products.forEach(p => {
        if (!productsByLine[p.production_line_id]) {
          productsByLine[p.production_line_id] = [];
        }
        productsByLine[p.production_line_id].push(p);
      });

      lines.forEach(line => {
        const count = productsByLine[line.id]?.length || 0;
        if (count > 0) {
          console.log(`   ${line.name}: ${count} produtos`);
          productsByLine[line.id].forEach(p => {
            console.log(`      • ${p.name}`);
          });
        }
      });

      // Lançamentos
      const { data: launches } = await supabase
        .from('chemical_product_launches')
        .select('id, mes, ano, custo_total')
        .eq('company_id', company.id);

      console.log(`\n\n📅 LANÇAMENTOS: ${launches.length} lançamentos\n`);

      if (launches.length > 0) {
        const total = launches.reduce((sum, l) => sum + (l.custo_total || 0), 0);
        console.log(`   Custo Total: R$ ${total.toFixed(2)}`);
        console.log(`   Mês/Ano: ${launches[0].mes}/${launches[0].ano}`);
      }
    }

    console.log('\n\n' + '='.repeat(70));
    console.log('RESUMO GERAL');
    console.log('='.repeat(70));

    // Totais gerais
    const { data: allLines } = await supabase.from('production_lines').select('id');
    const { data: allProducts } = await supabase.from('chemical_products').select('id');
    const { data: allLaunches } = await supabase.from('chemical_product_launches').select('custo_total');

    const totalCost = allLaunches.reduce((sum, l) => sum + (l.custo_total || 0), 0);

    console.log(`\nTotal de Linhas: ${allLines.length}`);
    console.log(`Total de Produtos: ${allProducts.length}`);
    console.log(`Total de Lançamentos: ${allLaunches.length}`);
    console.log(`Custo Total Geral: R$ ${totalCost.toFixed(2)}`);

  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

checkDatabaseStatus()
  .then(() => {
    console.log('\n\n✅ Verificação concluída!\n');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Erro fatal:', error);
    process.exit(1);
  });
