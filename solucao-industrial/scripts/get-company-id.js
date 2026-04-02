/**
 * Script auxiliar para obter o ID da empresa
 *
 * Este script lista todas as empresas cadastradas no sistema
 * para facilitar a identificação do company_id correto.
 *
 * Uso: node scripts/get-company-id.js
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Erro: Variáveis de ambiente NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY não configuradas');
  console.error('Configure as variáveis no arquivo .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function getCompanies() {
  console.log('=== EMPRESAS CADASTRADAS ===\n');

  try {
    const { data: companies, error } = await supabase
      .from('companies')
      .select('id, name, cnpj, active')
      .order('name');

    if (error) {
      throw error;
    }

    if (!companies || companies.length === 0) {
      console.log('⚠ Nenhuma empresa encontrada no sistema');
      return;
    }

    console.log(`Total de empresas: ${companies.length}\n`);

    companies.forEach((company, index) => {
      console.log(`${index + 1}. ${company.name}`);
      console.log(`   ID: ${company.id}`);
      console.log(`   CNPJ: ${company.cnpj || 'Não informado'}`);
      console.log(`   Status: ${company.active ? 'Ativa' : 'Inativa'}`);
      console.log('');
    });

    console.log('\n💡 Use o ID da empresa para executar a importação:');
    console.log(`   node scripts/import-chemical-products.js <COMPANY_ID>\n`);

  } catch (error) {
    console.error('❌ Erro ao buscar empresas:', error.message);
    process.exit(1);
  }
}

getCompanies()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Erro fatal:', error);
    process.exit(1);
  });
