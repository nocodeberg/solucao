const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkProducts() {
  try {
    const { data, error } = await supabase
      .from('chemical_products')
      .select(`
        id,
        name,
        company_id,
        production_line_id,
        active,
        production_lines(name)
      `)
      .eq('active', true)
      .order('name');
    
    if (error) {
      console.error('Erro:', error);
      return;
    }
    
    console.log('=== PRODUTOS QUÍMICOS CADASTRADOS ===');
    console.log('Total:', data?.length || 0);
    console.log('');
    
    data?.forEach((product, index) => {
      console.log(`${index + 1}. ${product.name}`);
      console.log(`   ID: ${product.id}`);
      console.log(`   Empresa: ${product.company_id}`);
      console.log(`   Linha: ${product.production_line_id || 'NULL'} - ${product.production_lines?.name || 'Sem linha'}`);
      console.log(`   Ativo: ${product.active}`);
      console.log('');
    });
    
  } catch (err) {
    console.error('Erro ao conectar:', err);
  }
}

checkProducts();
