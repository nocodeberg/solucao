require('dotenv').config({ path: '../.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Configuração do Supabase com Service Role Key
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Erro: Variáveis de ambiente não configuradas!');
  console.error('Certifique-se que NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY estão definidas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function runMigration() {
  try {
    console.log('🚀 Iniciando migration: Add line_type to production_lines\n');

    // Ler o arquivo SQL
    const migrationPath = path.join(__dirname, '../supabase/add-line-type.sql');
    const sqlContent = fs.readFileSync(migrationPath, 'utf-8');

    // Dividir o SQL em comandos individuais
    const commands = sqlContent
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 0 && !cmd.startsWith('--'));

    console.log(`📝 Executando ${commands.length} comandos SQL...\n`);

    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < commands.length; i++) {
      const command = commands[i] + ';';

      // Pular comentários
      if (command.trim().startsWith('--')) continue;

      console.log(`[${i + 1}/${commands.length}] Executando comando...`);

      try {
        const { data, error } = await supabase.rpc('exec_sql', { sql: command });

        if (error) {
          // Tentar executar diretamente se RPC falhar
          console.log('⚠️  RPC falhou, tentando execução direta via psql...');
          console.log('   Comando:', command.substring(0, 100) + '...');
          console.log('   Erro:', error.message);
          errorCount++;
        } else {
          console.log('✅ Sucesso');
          successCount++;
        }
      } catch (err) {
        console.error('❌ Erro:', err.message);
        errorCount++;
      }
    }

    console.log('\n' + '='.repeat(50));
    console.log(`✅ Comandos executados com sucesso: ${successCount}`);
    console.log(`❌ Comandos com erro: ${errorCount}`);
    console.log('='.repeat(50));

    if (errorCount > 0) {
      console.log('\n⚠️  ATENÇÃO: Alguns comandos falharam!');
      console.log('Execute a migration manualmente no Supabase SQL Editor:');
      console.log(`1. Acesse: ${supabaseUrl.replace('https://', 'https://supabase.com/dashboard/project/')}/sql`);
      console.log('2. Cole o conteúdo do arquivo: supabase/add-line-type.sql');
      console.log('3. Execute a migration');
    } else {
      console.log('\n🎉 Migration executada com sucesso!');
      console.log('O campo line_type foi adicionado à tabela production_lines');
    }

    // Verificar se a coluna foi criada
    console.log('\n🔍 Verificando estrutura da tabela...');
    const { data: columns, error: checkError } = await supabase
      .from('production_lines')
      .select('*')
      .limit(1);

    if (!checkError && columns && columns.length > 0) {
      const hasLineType = 'line_type' in columns[0];
      if (hasLineType) {
        console.log('✅ Campo line_type confirmado na tabela production_lines');
        console.log('   Tipo:', columns[0].line_type || 'GALVANOPLASTIA (padrão)');
      } else {
        console.log('❌ Campo line_type NÃO encontrado na tabela');
        console.log('   Execute a migration manualmente no Supabase SQL Editor');
      }
    }

  } catch (error) {
    console.error('\n❌ Erro fatal ao executar migration:', error.message);
    console.log('\n📝 Instruções para execução manual:');
    console.log('1. Acesse o Supabase SQL Editor');
    console.log('2. Cole o conteúdo de supabase/add-line-type.sql');
    console.log('3. Execute a migration');
    process.exit(1);
  }
}

// Executar a migration
runMigration();
