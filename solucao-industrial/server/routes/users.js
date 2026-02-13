const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const { authenticate, authorize } = require('../middleware/auth');

// Todas as rotas de usuários requerem autenticação e role ADMIN
router.use(authenticate);
router.use(authorize('ADMIN'));

// GET /api/users - Listar todos os usuários da empresa
router.get('/', async (req, res) => {
  try {
    const { company_id } = req.profile;

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('company_id', company_id)
      .order('full_name');

    if (error) throw error;

    res.json(data);
  } catch (error) {
    console.error('Erro ao buscar usuários:', error);
    res.status(500).json({ error: 'Erro ao buscar usuários' });
  }
});

// GET /api/users/:id - Buscar usuário específico
router.get('/:id', async (req, res) => {
  try {
    const { company_id } = req.profile;
    const { id } = req.params;

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', id)
      .eq('company_id', company_id)
      .single();

    if (error || !data) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    res.json(data);
  } catch (error) {
    console.error('Erro ao buscar usuário:', error);
    res.status(500).json({ error: 'Erro ao buscar usuário' });
  }
});

// POST /api/users - Criar novo usuário
router.post('/', async (req, res) => {
  try {
    const { company_id } = req.profile;
    const { email, password, full_name, role } = req.body;

    // Validações básicas
    if (!email || !password || !full_name || !role) {
      return res.status(400).json({
        error: 'Email, senha, nome completo e role são obrigatórios'
      });
    }

    // Validar role
    const validRoles = ['ADMIN', 'GESTOR', 'RH', 'OPERADOR', 'LEITOR'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        error: `Role inválida. Valores aceitos: ${validRoles.join(', ')}`
      });
    }

    // Criar usuário no Supabase Auth usando Service Role Key
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name,
      }
    });

    if (authError) {
      console.error('Erro ao criar usuário no Auth:', authError);
      return res.status(400).json({
        error: authError.message || 'Erro ao criar usuário'
      });
    }

    // Criar/atualizar perfil do usuário
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: authData.user.id,
        company_id,
        email,
        full_name,
        role,
        active: true,
      })
      .select()
      .single();

    if (profileError) {
      console.error('Erro ao criar perfil:', profileError);
      // Se falhar ao criar perfil, tentar deletar o usuário criado no Auth
      await supabase.auth.admin.deleteUser(authData.user.id);
      return res.status(500).json({ error: 'Erro ao criar perfil do usuário' });
    }

    res.status(201).json(profileData);
  } catch (error) {
    console.error('Erro ao criar usuário:', error);
    res.status(500).json({ error: 'Erro ao criar usuário' });
  }
});

// PUT /api/users/:id - Atualizar usuário
router.put('/:id', async (req, res) => {
  try {
    const { company_id } = req.profile;
    const { id } = req.params;
    const { full_name, role, active } = req.body;

    // Não permitir que usuário desative a si mesmo
    if (req.profile.id === id && active === false) {
      return res.status(400).json({
        error: 'Você não pode desativar seu próprio usuário'
      });
    }

    // Não permitir que usuário altere sua própria role
    if (req.profile.id === id && role && role !== req.profile.role) {
      return res.status(400).json({
        error: 'Você não pode alterar sua própria role'
      });
    }

    // Validar role se fornecida
    if (role) {
      const validRoles = ['ADMIN', 'GESTOR', 'RH', 'OPERADOR', 'LEITOR'];
      if (!validRoles.includes(role)) {
        return res.status(400).json({
          error: `Role inválida. Valores aceitos: ${validRoles.join(', ')}`
        });
      }
    }

    const updateData = {};
    if (full_name !== undefined) updateData.full_name = full_name;
    if (role !== undefined) updateData.role = role;
    if (active !== undefined) updateData.active = active;

    const { data, error } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', id)
      .eq('company_id', company_id)
      .select()
      .single();

    if (error || !data) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    res.json(data);
  } catch (error) {
    console.error('Erro ao atualizar usuário:', error);
    res.status(500).json({ error: 'Erro ao atualizar usuário' });
  }
});

// DELETE /api/users/:id - Deletar usuário
router.delete('/:id', async (req, res) => {
  try {
    const { company_id } = req.profile;
    const { id } = req.params;

    // Não permitir que usuário delete a si mesmo
    if (req.profile.id === id) {
      return res.status(400).json({
        error: 'Você não pode deletar seu próprio usuário'
      });
    }

    // Buscar usuário antes de deletar
    const { data: userData, error: fetchError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', id)
      .eq('company_id', company_id)
      .single();

    if (fetchError || !userData) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    // Deletar perfil do banco
    const { error: profileError } = await supabase
      .from('profiles')
      .delete()
      .eq('id', id)
      .eq('company_id', company_id);

    if (profileError) {
      console.error('Erro ao deletar perfil:', profileError);
      return res.status(500).json({ error: 'Erro ao deletar perfil do usuário' });
    }

    // Deletar usuário do Supabase Auth
    const { error: authError } = await supabase.auth.admin.deleteUser(id);

    if (authError) {
      console.error('Erro ao deletar usuário do Auth:', authError);
      // Mesmo com erro no Auth, o perfil já foi deletado
      return res.json({
        message: 'Usuário deletado parcialmente (perfil removido, mas erro ao remover do Auth)',
        warning: authError.message
      });
    }

    res.json({ message: 'Usuário deletado com sucesso' });
  } catch (error) {
    console.error('Erro ao deletar usuário:', error);
    res.status(500).json({ error: 'Erro ao deletar usuário' });
  }
});

// PATCH /api/users/:id/reset-password - Resetar senha do usuário
router.patch('/:id/reset-password', async (req, res) => {
  try {
    const { company_id } = req.profile;
    const { id } = req.params;
    const { new_password } = req.body;

    if (!new_password || new_password.length < 6) {
      return res.status(400).json({
        error: 'Nova senha é obrigatória e deve ter no mínimo 6 caracteres'
      });
    }

    // Verificar se usuário existe na empresa
    const { data: userData, error: fetchError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', id)
      .eq('company_id', company_id)
      .single();

    if (fetchError || !userData) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    // Atualizar senha no Supabase Auth
    const { error: authError } = await supabase.auth.admin.updateUserById(
      id,
      { password: new_password }
    );

    if (authError) {
      console.error('Erro ao resetar senha:', authError);
      return res.status(500).json({
        error: authError.message || 'Erro ao resetar senha'
      });
    }

    res.json({ message: 'Senha resetada com sucesso' });
  } catch (error) {
    console.error('Erro ao resetar senha:', error);
    res.status(500).json({ error: 'Erro ao resetar senha' });
  }
});

module.exports = router;
