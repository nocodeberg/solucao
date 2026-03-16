require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function checkTable() {
  console.log('🔍 Verificando tabela product_launches...\n');

  try {
    const { data, error } = await supabase
      .from('product_launches')
      .select('*')
      .limit(1);

    if (error) {
      if (error.code === '42P01' || error.message.includes('does not exist')) {
        console.log('❌ Tabela product_launches NÃO EXISTE no Supabase');
        console.log('\n📋 AÇÃO NECESSÁRIA:');
        console.log('Você precisa executar o SQL para criar a tabela.\n');
        console.log('Passos:');
        console.log('1. Acesse: https://supabase.com/dashboard');
        console.log('2. Abra o SQL Editor');
        console.log('3. Copie o conteúdo de: supabase/add-product-launches.sql');
        console.log('4. Cole e execute no SQL Editor');
        console.log('5. Rode este script novamente para confirmar\n');
      } else {
        console.log('❌ Erro ao verificar tabela:', error);
      }
      process.exit(1);
    }

    console.log('✅ Tabela product_launches EXISTE!');
    console.log(`📊 Registros encontrados: ${data?.length || 0}\n');

    if (data && data.length > 0) {
      console.log('Exemplo de registro:');
      console.log(JSON.stringify(data[0], null, 2));
    }

    process.exit(0);
  } catch (err) {
    console.error('❌ Erro:', err);
    process.exit(1);
  }
}

checkTable();
