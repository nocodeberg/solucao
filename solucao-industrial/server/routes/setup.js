// =====================================================
// ROTA TEMPORÁRIA PARA CRIAR USUÁRIO DE TESTE
// ⚠️ REMOVER EM PRODUÇÃO!
// =====================================================

const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

// Criar usuário de teste completo
router.post('/create-test-user', async (req, res) => {
  try {
    console.log('🔧 Criando usuário de teste...');

    // 1. Criar empresa
    console.log('📦 Criando empresa...');
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .insert({
        name: 'Indústria Teste LTDA',
        cnpj: '12.345.678/0001-90',
        email: 'contato@industriateste.com.br',
        phone: '(11) 98765-4321'
      })
      .select()
      .single();

    let companyId;

    if (companyError) {
      // Se já existe, buscar
      if (companyError.code === '23505') {
        console.log('⚠️ Empresa já existe, buscando...');
        const { data: existingCompany } = await supabase
          .from('companies')
          .select('*')
          .eq('cnpj', '12.345.678/0001-90')
          .single();

        if (!existingCompany) {
          throw new Error('Erro ao buscar empresa existente');
        }

        companyId = existingCompany.id;
        console.log('✅ Empresa encontrada:', companyId);
      } else {
        throw companyError;
      }
    } else {
      companyId = company.id;
      console.log('✅ Empresa criada:', companyId);
    }

    // 2. Criar usuário no Supabase Auth
    console.log('👤 Criando usuário...');
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: 'admin@teste.com',
      password: 'Admin@123',
      email_confirm: true,
      user_metadata: {
        full_name: 'Administrador Teste'
      }
    });

    let userId;

    if (authError) {
      // Se já existe, buscar
      if (authError.message.includes('already registered')) {
        console.log('⚠️ Usuário já existe, buscando...');
        const { data: users } = await supabase.auth.admin.listUsers();
        const existingUser = users.users.find(u => u.email === 'admin@teste.com');

        if (!existingUser) {
          throw new Error('Erro ao buscar usuário existente');
        }

        userId = existingUser.id;
        console.log('✅ Usuário encontrado:', userId);
      } else {
        throw authError;
      }
    } else {
      userId = authUser.user.id;
      console.log('✅ Usuário criado:', userId);
    }

    // 3. Criar perfil
    console.log('📝 Criando perfil...');
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: userId,
        company_id: companyId,
        full_name: 'Administrador Teste',
        email: 'admin@teste.com',
        role: 'ADMIN'
      })
      .select()
      .single();

    if (profileError) {
      // Se já existe, atualizar
      if (profileError.code === '23505') {
        console.log('⚠️ Perfil já existe, atualizando...');
        const { data: updatedProfile } = await supabase
          .from('profiles')
          .update({
            company_id: companyId,
            full_name: 'Administrador Teste',
            role: 'ADMIN'
          })
          .eq('id', userId)
          .select()
          .single();

        console.log('✅ Perfil atualizado');
        return res.json({
          success: true,
          message: 'Usuário de teste atualizado com sucesso!',
          credentials: {
            email: 'admin@teste.com',
            password: 'Admin@123',
            url: 'http://localhost:3000/login'
          },
          data: {
            userId,
            companyId,
            profile: updatedProfile
          }
        });
      } else {
        throw profileError;
      }
    }

    console.log('✅ Perfil criado');

    res.json({
      success: true,
      message: 'Usuário de teste criado com sucesso!',
      credentials: {
        email: 'admin@teste.com',
        password: 'Admin@123',
        url: 'http://localhost:3000/login'
      },
      data: {
        userId,
        companyId,
        profile
      }
    });

  } catch (error) {
    console.error('❌ Erro ao criar usuário de teste:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      details: error
    });
  }
});

// Resetar senha do usuário de teste
router.post('/reset-test-password', async (req, res) => {
  try {
    // Buscar usuário
    const { data: users } = await supabase.auth.admin.listUsers();
    const user = users.users.find(u => u.email === 'admin@teste.com');

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Usuário admin@teste.com não encontrado'
      });
    }

    // Resetar senha
    const { data, error } = await supabase.auth.admin.updateUserById(
      user.id,
      { password: 'Admin@123' }
    );

    if (error) throw error;

    res.json({
      success: true,
      message: 'Senha resetada com sucesso!',
      credentials: {
        email: 'admin@teste.com',
        password: 'Admin@123'
      }
    });

  } catch (error) {
    console.error('❌ Erro ao resetar senha:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
