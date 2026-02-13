require('dotenv').config({ path: '../.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Erro: Variáveis de ambiente não configuradas!');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkColumn() {
  try {
    console.log('🔍 Verificando se o campo line_type existe...\n');

    // Tentar buscar uma linha com o campo line_type
    const { data, error } = await supabase
      .from('production_lines')
      .select('id, name, line_type')
      .limit(1);

    if (error) {
      if (error.message.includes('column') && error.message.includes('line_type')) {
        console.log('❌ O campo line_type NÃO existe no banco de dados');
        console.log('\n📝 Você precisa executar a migration:');
        console.log('   1. Acesse: https://supabase.com/dashboard/project/csvhywnaiqfofudhwwgf/sql');
        console.log('   2. Cole o conteúdo de: supabase/add-line-type.sql');
        console.log('   3. Execute a query\n');
        return false;
      }
      throw error;
    }

    console.log('✅ O campo line_type JÁ EXISTE no banco de dados');
    if (data && data.length > 0) {
      console.log(`   Exemplo: ${data[0].name} - Tipo: ${data[0].line_type || 'NULL'}`);
    }
    console.log('\n✅ Pronto para aplicar mudanças no código!\n');
    return true;

  } catch (error) {
    console.error('❌ Erro ao verificar:', error.message);
    return false;
  }
}

checkColumn().then(exists => {
  process.exit(exists ? 0 : 1);
});
