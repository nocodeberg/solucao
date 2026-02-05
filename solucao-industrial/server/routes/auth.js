const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const { z } = require('zod');

// Schemas de validação
const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres')
});

/**
 * POST /api/auth/login
 * Login de usuário
 */
router.post('/login', async (req, res) => {
  try {
    // Validar dados
    const { email, password } = loginSchema.parse(req.body);

    // Autenticar com Supabase
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      return res.status(401).json({
        error: 'Credenciais inválidas',
        message: error.message
      });
    }

    // Buscar profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .single();

    res.json({
      user: data.user,
      profile,
      session: data.session
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Dados inválidos',
        details: error.errors
      });
    }

    console.error('Login error:', error);
    res.status(500).json({ error: 'Erro ao fazer login' });
  }
});

/**
 * POST /api/auth/logout
 * Logout de usuário
 */
router.post('/logout', async (req, res) => {
  try {
    const token = req.headers.authorization?.substring(7);

    if (token) {
      await supabase.auth.admin.signOut(token);
    }

    res.json({ message: 'Logout realizado com sucesso' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Erro ao fazer logout' });
  }
});

/**
 * GET /api/auth/me
 * Obter usuário atual
 */
router.get('/me', async (req, res) => {
  try {
    const token = req.headers.authorization?.substring(7);

    if (!token) {
      return res.status(401).json({ error: 'Token não fornecido' });
    }

    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({ error: 'Token inválido' });
    }

    // Buscar profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    res.json({ user, profile });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Erro ao buscar usuário' });
  }
});

module.exports = router;
