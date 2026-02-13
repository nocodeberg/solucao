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

// Criar cliente com service role para poder criar usuários
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

const companyId = 'b3d594a0-2925-41d6-b1b5-b2aec57c4f3b'; // Solução Global
const email = 'bergnocode@gmail.com';
const password = 'solucao12';
const fullName = 'Bergno Code';

async function criarUsuario() {
  console.log('👤 Criando usuário no Supabase Auth...\n');
  console.log(`   Email: ${email}`);
  console.log(`   Nome: ${fullName}`);
  console.log(`   Empresa: Solução Global\n`);

  try {
    // 1. Criar usuário no Auth
    console.log('📝 Criando usuário...');
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true, // Confirma email automaticamente
      user_metadata: {
        full_name: fullName
      }
    });

    if (authError) {
      if (authError.message.includes('already registered')) {
        console.log('⚠️  Usuário já existe! Buscando perfil existente...\n');

        // Buscar usuário existente
        const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();

        if (listError) {
          console.error('❌ Erro ao buscar usuários:', listError);
          return;
        }

        const existingUser = users.find(u => u.email === email);

        if (!existingUser) {
          console.error('❌ Não foi possível encontrar o usuário');
          return;
        }

        console.log('✅ Usuário encontrado!');
        console.log(`   ID: ${existingUser.id}\n`);

        // Atualizar perfil
        await vincularPerfil(existingUser.id);
        return;
      } else {
        console.error('❌ Erro ao criar usuário:', authError);
        return;
      }
    }

    console.log('✅ Usuário criado no Auth!');
    console.log(`   ID: ${authData.user.id}\n`);

    // 2. Aguardar trigger criar o perfil
    console.log('⏳ Aguardando criação do perfil...');
    await new Promise(resolve => setTimeout(resolve, 2000));

    // 3. Vincular perfil à empresa
    await vincularPerfil(authData.user.id);

  } catch (error) {
    console.error('❌ Erro inesperado:', error);
  }
}

async function vincularPerfil(userId) {
  console.log('📝 Vinculando perfil à empresa...');

  // Buscar perfil
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (profileError || !profile) {
    console.error('❌ Perfil não encontrado. Tentando criar manualmente...');

    // Criar perfil manualmente
    const { data: newProfile, error: createError } = await supabase
      .from('profiles')
      .insert({
        id: userId,
        email: email,
        full_name: fullName,
        company_id: companyId,
        role: 'ADMIN',
        active: true
      })
      .select()
      .single();

    if (createError) {
      console.error('❌ Erro ao criar perfil:', createError);
      return;
    }

    console.log('✅ Perfil criado manualmente!\n');
    await exibirSucesso(newProfile);
    return;
  }

  // Atualizar perfil existente
  const { data: updated, error: updateError } = await supabase
    .from('profiles')
    .update({
      company_id: companyId,
      role: 'ADMIN',
      full_name: fullName
    })
    .eq('id', userId)
    .select()
    .single();

  if (updateError) {
    console.error('❌ Erro ao atualizar perfil:', updateError);
    return;
  }

  console.log('✅ Perfil atualizado!\n');
  await exibirSucesso(updated);
}

async function exibirSucesso(profile) {
  // Buscar informações da empresa
  const { data: company } = await supabase
    .from('companies')
    .select('*')
    .eq('id', companyId)
    .single();

  console.log('═══════════════════════════════════════════════');
  console.log('✅ USUÁRIO CRIADO COM SUCESSO!');
  console.log('═══════════════════════════════════════════════');
  console.log('\n🔑 Credenciais:');
  console.log(`   Email: ${email}`);
  console.log(`   Senha: ${password}`);
  console.log('\n👤 Perfil:');
  console.log(`   Nome: ${profile.full_name}`);
  console.log(`   Role: ${profile.role}`);
  console.log('\n🏢 Empresa:');
  console.log(`   Nome: ${company.name}`);
  console.log(`   CNPJ: ${company.cnpj}`);
  console.log('\n🎉 Você já pode fazer login em: http://localhost:3000');
  console.log('\n');
}

criarUsuario();
