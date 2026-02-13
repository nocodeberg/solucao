const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Ler variáveis do .env.local manualmente
const envPath = path.join(__dirname, '..', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const envVars = {};

envContent.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    const key = match[1].trim();
    const value = match[2].trim();
    envVars[key] = value;
  }
});

const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = envVars.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const companyId = 'b3d594a0-2925-41d6-b1b5-b2aec57c4f3b'; // Solução Global
const adminEmail = 'bergnocode@gmail.com';

async function vincularAdmin() {
  console.log('🔐 Vinculando usuário como ADMIN da Solução Global...\n');
  console.log(`   Email: ${adminEmail}`);
  console.log(`   Empresa ID: ${companyId}\n`);

  try {
    // 1. Verificar se o perfil existe
    console.log('📝 Buscando perfil do usuário...');
    const { data: profile, error: searchError } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', adminEmail)
      .single();

    if (searchError || !profile) {
      console.error('❌ Usuário não encontrado!');
      console.log('\n⚠️  O usuário precisa estar registrado no sistema primeiro.');
      console.log('   Para registrar:');
      console.log('   1. Acesse http://localhost:3000');
      console.log('   2. Clique em "Criar conta"');
      console.log(`   3. Use o email: ${adminEmail}`);
      console.log('   4. Execute este script novamente\n');
      return;
    }

    console.log('✅ Perfil encontrado!');
    console.log(`   ID: ${profile.id}`);
    console.log(`   Nome: ${profile.full_name}`);
    console.log(`   Role atual: ${profile.role}`);
    console.log(`   Empresa atual: ${profile.company_id || 'Nenhuma'}\n`);

    // 2. Atualizar perfil
    console.log('📝 Atualizando perfil...');
    const { data: updated, error: updateError } = await supabase
      .from('profiles')
      .update({
        company_id: companyId,
        role: 'ADMIN'
      })
      .eq('id', profile.id)
      .select()
      .single();

    if (updateError) {
      console.error('❌ Erro ao atualizar perfil:', updateError);
      return;
    }

    console.log('✅ Perfil atualizado com sucesso!\n');

    // 3. Buscar informações da empresa
    const { data: company } = await supabase
      .from('companies')
      .select('*')
      .eq('id', companyId)
      .single();

    console.log('═══════════════════════════════════════════════');
    console.log('✅ ADMIN VINCULADO COM SUCESSO!');
    console.log('═══════════════════════════════════════════════');
    console.log('\n👤 Usuário:');
    console.log(`   Nome: ${updated.full_name}`);
    console.log(`   Email: ${updated.email}`);
    console.log(`   Role: ${updated.role}`);
    console.log('\n🏢 Empresa:');
    console.log(`   Nome: ${company.name}`);
    console.log(`   CNPJ: ${company.cnpj}`);
    console.log(`   Email: ${company.email}`);
    console.log('\n🎉 Agora você pode fazer login com este usuário e acessar a empresa Solução Global!\n');

  } catch (error) {
    console.error('❌ Erro inesperado:', error);
  }
}

vincularAdmin();
