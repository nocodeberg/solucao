const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Erro: Variáveis de ambiente não encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function criarProdutoTeste() {
  console.log('🧪 Criando produto de teste "teste 003" para linha Cobre Ácido\n');

  // 1. Buscar empresa
  console.log('1️⃣ Buscando empresa...');
  const { data: companies, error: companyError } = await supabase
    .from('companies')
    .select('*')
    .limit(1);

  if (companyError || !companies || companies.length === 0) {
    console.error('❌ Erro ao buscar empresa:', companyError);
    return;
  }

  const company = companies[0];
  console.log(`✅ Empresa encontrada: ${company.name} (ID: ${company.id})`);

  // 2. Buscar linha Cobre Ácido
  console.log('\n2️⃣ Buscando linha "Cobre Ácido"...');
  const { data: linhas, error: linhasError } = await supabase
    .from('production_lines')
    .select('*')
    .eq('company_id', company.id)
    .ilike('name', '%cobre%ácid%');

  if (linhasError) {
    console.error('❌ Erro ao buscar linhas:', linhasError);
    return;
  }

  if (!linhas || linhas.length === 0) {
    // Tentar sem acento
    const { data: linhas2 } = await supabase
      .from('production_lines')
      .select('*')
      .eq('company_id', company.id)
      .ilike('name', '%cobre%acid%');

    if (!linhas2 || linhas2.length === 0) {
      console.error('❌ Linha "Cobre Ácido" não encontrada');
      return;
    }

    linhas.push(...linhas2);
  }

  const cobreAcido = linhas[0];
  console.log(`✅ Linha encontrada: ${cobreAcido.name} (ID: ${cobreAcido.id})`);

  // 3. Verificar se já existe o produto
  console.log('\n3️⃣ Verificando se produto já existe...');
  const { data: existingProduct } = await supabase
    .from('chemical_products')
    .select('*')
    .eq('company_id', company.id)
    .ilike('name', '%teste 003%');

  if (existingProduct && existingProduct.length > 0) {
    console.log('⚠️ Produto "teste 003" já existe!');
    console.log('   ID:', existingProduct[0].id);
    console.log('   Linha ID:', existingProduct[0].production_line_id);
    console.log('   Nome:', existingProduct[0].name);

    // Atualizar a linha
    console.log('\n4️⃣ Atualizando linha do produto...');
    const { error: updateError } = await supabase
      .from('chemical_products')
      .update({ production_line_id: cobreAcido.id })
      .eq('id', existingProduct[0].id);

    if (updateError) {
      console.error('❌ Erro ao atualizar produto:', updateError);
      return;
    }

    console.log('✅ Produto atualizado com sucesso!');
  } else {
    // Criar novo produto
    console.log('\n4️⃣ Criando produto "teste 003"...');
    const { data: newProduct, error: createError } = await supabase
      .from('chemical_products')
      .insert({
        company_id: company.id,
        production_line_id: cobreAcido.id,
        name: 'teste 003',
        unit_price: 10.50,
        unit: 'kg',
        active: true,
      })
      .select()
      .single();

    if (createError) {
      console.error('❌ Erro ao criar produto:', createError);
      return;
    }

    console.log('✅ Produto criado com sucesso!');
    console.log('   ID:', newProduct.id);
    console.log('   Nome:', newProduct.name);
    console.log('   Linha ID:', newProduct.production_line_id);
    console.log('   Preço:', newProduct.unit_price);
  }

  // 5. Verificar o produto criado
  console.log('\n5️⃣ Verificando produto criado...');
  const { data: verification, error: verifyError } = await supabase
    .from('chemical_products')
    .select('*')
    .eq('company_id', company.id)
    .eq('production_line_id', cobreAcido.id)
    .ilike('name', '%teste 003%');

  if (verifyError) {
    console.error('❌ Erro na verificação:', verifyError);
    return;
  }

  if (verification && verification.length > 0) {
    console.log('✅ SUCESSO! Produto vinculado à linha Cobre Ácido:');
    verification.forEach(p => {
      console.log(`   - ${p.name} (ID: ${p.id})`);
      console.log(`     Linha ID: ${p.production_line_id}`);
      console.log(`     Preço: R$ ${p.unit_price}`);
    });
  } else {
    console.log('⚠️ Produto não encontrado na verificação');
  }
}

criarProdutoTeste()
  .then(() => {
    console.log('\n✅ Script concluído!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Erro:', error);
    process.exit(1);
  });
