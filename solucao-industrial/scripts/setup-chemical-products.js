const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Erro: Variáveis de ambiente do Supabase não encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setupChemicalProducts() {
  console.log('🚀 Iniciando configuração de produtos químicos...\n');

  try {
    // 1. Buscar todas as empresas
    const { data: companies, error: companiesError } = await supabase
      .from('companies')
      .select('id, name');

    if (companiesError) {
      throw companiesError;
    }

    if (!companies || companies.length === 0) {
      console.log('❌ Nenhuma empresa encontrada');
      return;
    }

    console.log(`✅ Encontradas ${companies.length} empresa(s)\n`);

    // 2. Produtos químicos padrão (conforme a imagem)
    const defaultProducts = [
      { name: 'SODA', unit_price: 10.00, unit: 'kg' },
      { name: 'ACTIVE ZMC', unit_price: 10.00, unit: 'kg' },
      { name: 'COMPOSTO C-10', unit_price: 10.00, unit: 'kg' },
      { name: 'METAL CLEAN FE 05', unit_price: 10.00, unit: 'kg' },
      { name: 'METAL CLEAN 7E_F', unit_price: 10.00, unit: 'kg' },
    ];

    // 3. Inserir produtos para cada empresa
    for (const company of companies) {
      console.log(`📦 Configurando produtos para empresa: ${company.name}`);

      // Buscar linhas de produção da empresa
      const { data: productionLines } = await supabase
        .from('production_lines')
        .select('id, name')
        .eq('company_id', company.id)
        .limit(1);

      const productionLineId = productionLines && productionLines.length > 0
        ? productionLines[0].id
        : null;

      for (const product of defaultProducts) {
        // Verificar se o produto já existe
        const { data: existing } = await supabase
          .from('chemical_products')
          .select('id')
          .eq('company_id', company.id)
          .eq('name', product.name)
          .single();

        if (existing) {
          console.log(`  ⏭️  Produto "${product.name}" já existe`);
          continue;
        }

        // Inserir produto
        const { error: insertError } = await supabase
          .from('chemical_products')
          .insert({
            company_id: company.id,
            production_line_id: productionLineId,
            name: product.name,
            unit_price: product.unit_price,
            unit: product.unit,
            active: true,
          });

        if (insertError) {
          console.error(`  ❌ Erro ao inserir "${product.name}":`, insertError.message);
        } else {
          console.log(`  ✅ Produto "${product.name}" inserido com sucesso`);
        }
      }

      console.log('');
    }

    console.log('🎉 Configuração concluída!');
  } catch (error) {
    console.error('❌ Erro:', error.message);
    process.exit(1);
  }
}

setupChemicalProducts();
