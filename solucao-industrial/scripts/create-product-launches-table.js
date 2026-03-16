const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Erro: Variáveis de ambiente não encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createProductLaunchesTable() {
  console.log('🚀 Criando tabela product_launches...\n');

  // Ler o arquivo SQL
  const sqlPath = path.join(__dirname, '..', 'supabase', 'add-product-launches.sql');
  const sql = fs.readFileSync(sqlPath, 'utf8');

  try {
    // Executar o SQL
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });

    if (error) {
      // Se não existe a função exec_sql, executar manualmente via API
      console.log('⚠️ Função exec_sql não encontrada, executando via client...\n');

      // Dividir em statements individuais
      const statements = sql
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'));

      for (const statement of statements) {
        console.log(`Executando: ${statement.substring(0, 50)}...`);
        const result = await supabase.rpc('exec', { query: statement });
        if (result.error) {
          console.error('❌ Erro:', result.error.message);
        }
      }

      console.log('\n⚠️ IMPORTANTE: Execute o SQL manualmente no Supabase SQL Editor:');
      console.log('\n📁 Arquivo:', sqlPath);
      console.log('\n📋 SQL a executar:');
      console.log('='.repeat(50));
      console.log(sql);
      console.log('='.repeat(50));

      return;
    }

    console.log('✅ Tabela product_launches criada com sucesso!');
    console.log('\n✅ Estrutura criada:');
    console.log('   - Tabela: product_launches');
    console.log('   - Índices criados');
    console.log('   - RLS habilitado');
    console.log('   - Policies configuradas');

  } catch (error) {
    console.error('❌ Erro ao criar tabela:', error);
    console.log('\n⚠️ Execute o SQL manualmente no Supabase SQL Editor:');
    console.log('\n📁 Arquivo:', sqlPath);
  }
}

createProductLaunchesTable()
  .then(() => {
    console.log('\n✅ Script concluído!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Erro:', error);
    process.exit(1);
  });
