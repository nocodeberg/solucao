/**
 * Script de Verificação da Importação
 *
 * Este script verifica se os dados foram importados corretamente
 *
 * Uso: node scripts/verify-import.js [company_id]
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Erro: Variáveis de ambiente não configuradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// ID da empresa (pode ser passado como argumento)
const companyId = process.argv[2];

if (!companyId) {
  console.error('❌ Erro: Company ID não fornecido');
  console.error('Uso: node scripts/verify-import.js [company_id]');
  process.exit(1);
}

async function verifyImport() {
  console.log('=== VERIFICAÇÃO DA IMPORTAÇÃO ===\n');
  console.log(`Company ID: ${companyId}\n`);

  try {
    // 1. Verificar linhas de produção
    console.log('📊 LINHAS DE PRODUÇÃO\n');
    const { data: lines, error: linesError } = await supabase
      .from('production_lines')
      .select('id, name, line_type, active')
      .eq('company_id', companyId)
      .order('name');

    if (linesError) throw linesError;

    console.log(`Total de linhas: ${lines.length}\n`);

    const linesByType = {
      GALVANOPLASTIA: [],
      VERNIZ: []
    };

    lines.forEach((line, idx) => {
      console.log(`${idx + 1}. ${line.name}`);
      console.log(`   Tipo: ${line.line_type}`);
      console.log(`   Status: ${line.active ? 'Ativa' : 'Inativa'}`);
      console.log('');

      linesByType[line.line_type].push(line);
    });

    console.log(`\n📈 Distribuição por tipo:`);
    console.log(`   GALVANOPLASTIA: ${linesByType.GALVANOPLASTIA.length} linhas`);
    console.log(`   VERNIZ: ${linesByType.VERNIZ.length} linhas`);

    // 2. Verificar produtos por linha
    console.log('\n\n📦 PRODUTOS POR LINHA\n');

    let totalProducts = 0;
    const productsByLine = [];

    for (const line of lines) {
      const { data: products, error: productsError } = await supabase
        .from('chemical_products')
        .select('id, name, unit_price')
        .eq('company_id', companyId)
        .eq('production_line_id', line.id)
        .eq('active', true)
        .order('name');

      if (productsError) throw productsError;

      totalProducts += products.length;
      productsByLine.push({
        line: line.name,
        count: products.length,
        products: products
      });

      console.log(`${line.name}: ${products.length} produtos`);
    }

    console.log(`\n📊 Total de produtos: ${totalProducts}`);

    // 3. Verificar lançamentos
    console.log('\n\n📅 LANÇAMENTOS\n');

    const { data: launches, error: launchesError } = await supabase
      .from('chemical_product_launches')
      .select('id, mes, ano, custo_total')
      .eq('company_id', companyId)
      .order('mes');

    if (launchesError) throw launchesError;

    console.log(`Total de lançamentos: ${launches.length}`);

    if (launches.length > 0) {
      const launchesByMonth = {};
      let totalCost = 0;

      launches.forEach(launch => {
        const key = `${launch.mes}/${launch.ano}`;
        if (!launchesByMonth[key]) {
          launchesByMonth[key] = {
            count: 0,
            total: 0
          };
        }
        launchesByMonth[key].count++;
        launchesByMonth[key].total += launch.custo_total || 0;
        totalCost += launch.custo_total || 0;
      });

      console.log('\nLançamentos por mês:');
      Object.entries(launchesByMonth).forEach(([month, data]) => {
        console.log(`  ${month}: ${data.count} lançamentos - R$ ${data.total.toFixed(2)}`);
      });

      console.log(`\nCusto total: R$ ${totalCost.toFixed(2)}`);
    }

    // 4. Top 10 produtos mais caros
    console.log('\n\n💰 TOP 10 PRODUTOS MAIS CAROS\n');

    const { data: topProducts, error: topError } = await supabase
      .from('chemical_products')
      .select('name, unit_price, production_line_id')
      .eq('company_id', companyId)
      .eq('active', true)
      .order('unit_price', { ascending: false })
      .limit(10);

    if (topError) throw topError;

    topProducts.forEach((product, idx) => {
      const line = lines.find(l => l.id === product.production_line_id);
      console.log(`${idx + 1}. ${product.name}`);
      console.log(`   Linha: ${line?.name || 'N/A'}`);
      console.log(`   Preço: R$ ${product.unit_price.toFixed(2)}/Kg`);
      console.log('');
    });

    // 5. Resumo final
    console.log('\n=== RESUMO FINAL ===\n');
    console.log(`✓ Linhas de produção: ${lines.length}`);
    console.log(`  - GALVANOPLASTIA: ${linesByType.GALVANOPLASTIA.length}`);
    console.log(`  - VERNIZ: ${linesByType.VERNIZ.length}`);
    console.log(`✓ Produtos químicos: ${totalProducts}`);
    console.log(`✓ Lançamentos: ${launches.length}`);
    console.log('\n✅ Verificação concluída!');

  } catch (error) {
    console.error('❌ Erro durante verificação:', error.message);
    process.exit(1);
  }
}

verifyImport()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Erro fatal:', error);
    process.exit(1);
  });
