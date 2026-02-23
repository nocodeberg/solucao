const { createClient } = require('@supabase/supabase-js');
const path = require('path');

// Tentar carregar dotenv
try {
  require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });
} catch (e) {
  console.log('⚠️ dotenv não encontrado');
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Erro: Variáveis de ambiente não configuradas!');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkLogo() {
  try {
    console.log('🔍 Verificando logo da empresa...\n');

    // Buscar empresa
    const { data: companies, error } = await supabase
      .from('companies')
      .select('*');

    if (error) throw error;

    console.log('📊 Empresas encontradas:', companies.length);
    console.log('');

    companies.forEach((company, index) => {
      console.log(`${index + 1}. ${company.name}`);
      console.log(`   ID: ${company.id}`);
      console.log(`   Logo URL: ${company.logo_url || 'Não definido'}`);
      console.log('');
    });

    // Tentar acessar o logo
    if (companies[0]?.logo_url) {
      console.log('🔗 Testando acesso ao logo...');
      console.log(`   URL: ${companies[0].logo_url}`);
      console.log('');
      console.log('💡 Abra esta URL no navegador para verificar se o logo está acessível.');
    }

  } catch (error) {
    console.error('❌ Erro:', error);
  }
}

checkLogo();
