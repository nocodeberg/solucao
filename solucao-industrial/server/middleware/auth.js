const supabase = require('../config/supabase');

/**
 * Middleware de autenticação
 * Valida o token JWT do Supabase
 */
async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Token não fornecido' });
    }

    const token = authHeader.substring(7);

    // Validar token com Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({ error: 'Token inválido ou expirado' });
    }

    // Buscar profile do usuário
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return res.status(403).json({ error: 'Perfil de usuário não encontrado' });
    }

    // Anexar user e profile ao request
    req.user = user;
    req.profile = profile;

    next();
  } catch (error) {
    console.error('Auth error:', error);
    res.status(500).json({ error: 'Erro ao autenticar' });
  }
}

/**
 * Middleware de autorização por role
 * @param {string[]} allowedRoles - Array de roles permitidas
 */
function authorize(...allowedRoles) {
  return (req, res, next) => {
    if (!req.profile || !req.profile.role) {
      return res.status(403).json({ error: 'Acesso negado' });
    }

    if (!allowedRoles.includes(req.profile.role)) {
      return res.status(403).json({
        error: 'Você não tem permissão para acessar este recurso',
        requiredRoles: allowedRoles,
        yourRole: req.profile.role
      });
    }

    next();
  };
}

/**
 * Middleware para verificar se o usuário tem permissão de escrita
 */
function canWrite(req, res, next) {
  const readOnlyRoles = ['LEITOR'];

  if (readOnlyRoles.includes(req.profile.role)) {
    return res.status(403).json({
      error: 'Usuários com perfil LEITOR não podem realizar esta ação'
    });
  }

  next();
}

module.exports = {
  authenticate,
  authorize,
  canWrite
};
