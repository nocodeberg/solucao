/*
 * LEGACY BACKUP FILE DISABLED.
 * This file is intentionally commented out to avoid TypeScript/build conflicts.
 * Keep only for historical reference.
 *

import { createClient } from '@supabase/supabase-js';

// Validação de variáveis de ambiente
const validateEnvVars = () => {
  const requiredVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY'
  ];

  const missing = requiredVars.filter(varName => !process.env[varName]);
  
  if (missing.length > 0) {
    throw new Error(`
❌ VARIÁVEIS DE AMBIENTE FALTANDO:

Variáveis necessárias:
${missing.map(var => `   - ${var}`).join('\n')}

Como configurar:
1. Crie o arquivo .env.local
2. Adicione as variáveis:
   NEXT_PUBLIC_SUPABASE_URL=https://SEU_PROJETO.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=SUA_CHAVE_ANON
   SUPABASE_SERVICE_ROLE_KEY=SUA_CHAVE_SERVICE

3. Reinicie o servidor de desenvolvimento
    `);
  }
};

// Validar no início
validateEnvVars();

// Cliente Supabase PÚBLICO (para frontend - usa ANON_KEY)
export const supabasePublic = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
    },
  }
);

// Cliente Supabase ADMIN (para backend/admin - usa SERVICE_ROLE_KEY)
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

// Obter profile do usuário atual (usando cliente público para autenticação)
const getCurrentProfile = async () => {
  const { data: { user }, error: authError } = await supabasePublic.auth.getUser();
  
  if (authError) {
    console.error('Erro de autenticação:', authError);
    throw new Error(`Erro de autenticação: ${authError.message}`);
  }
  
  if (!user) {
    throw new Error('Usuário não autenticado. Faça login para continuar.');
  }

  // Usar cliente admin para buscar profile (bypass RLS)
  const { data: profile, error } = await supabaseAdmin
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (error) {
    console.error('Erro ao buscar profile:', error);
    throw new Error(`Erro ao buscar profile: ${error.message}`);
  }

  if (!profile) {
    throw new Error('Profile não encontrado para o usuário');
  }

  return profile;
};

// =====================================================
// API COMPLETA - GRUPOS
// =====================================================
export const groups = {
  list: async () => {
    try {
      const profile = await getCurrentProfile();
      const { data, error } = await supabase
        .from('groups')
        .select('*')
        .eq('company_id', profile.company_id)
        .order('name');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erro em groups.list:', error);
      throw error;
    }
  },

  create: async (data: any) => {
    try {
      const profile = await getCurrentProfile();
      const { data: result, error } = await supabase
        .from('groups')
        .insert({ ...data, company_id: profile.company_id })
        .select()
        .single();

      if (error) throw error;
      return result;
    } catch (error) {
      console.error('Erro em groups.create:', error);
      throw error;
    }
  },

  update: async (id: string, data: any) => {
    try {
      const profile = await getCurrentProfile();
      const { data: result, error } = await supabase
        .from('groups')
        .update(data)
        .eq('id', id)
        .eq('company_id', profile.company_id)
        .select()
        .single();

      if (error) throw error;
      return result;
    } catch (error) {
      console.error('Erro em groups.update:', error);
      throw error;
    }
  },

  delete: async (id: string) => {
    try {
      const profile = await getCurrentProfile();
      const { error } = await supabase
        .from('groups')
        .delete()
        .eq('id', id)
        .eq('company_id', profile.company_id);

      if (error) throw error;
    } catch (error) {
      console.error('Erro em groups.delete:', error);
      throw error;
    }
  },
};

// =====================================================
// API COMPLETA - PRODUCTION LINES
// =====================================================
export const productionLines = {
  list: async () => {
    try {
      const profile = await getCurrentProfile();
      const { data, error } = await supabase
        .from('production_lines')
        .select('*')
        .eq('company_id', profile.company_id)
        .order('name');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erro em productionLines.list:', error);
      throw error;
    }
  },

  create: async (data: any) => {
    try {
      const profile = await getCurrentProfile();
      const { data: result, error } = await supabase
        .from('production_lines')
        .insert({ ...data, company_id: profile.company_id })
        .select()
        .single();

      if (error) throw error;
      return result;
    } catch (error) {
      console.error('Erro em productionLines.create:', error);
      throw error;
    }
  },

  update: async (id: string, data: any) => {
    try {
      const profile = await getCurrentProfile();
      const { data: result, error } = await supabase
        .from('production_lines')
        .update(data)
        .eq('id', id)
        .eq('company_id', profile.company_id)
        .select()
        .single();

      if (error) throw error;
      return result;
    } catch (error) {
      console.error('Erro em productionLines.update:', error);
      throw error;
    }
  },

  delete: async (id: string) => {
    try {
      const profile = await getCurrentProfile();
      const { error } = await supabase
        .from('production_lines')
        .delete()
        .eq('id', id)
        .eq('company_id', profile.company_id);

      if (error) throw error;
    } catch (error) {
      console.error('Erro em productionLines.delete:', error);
      throw error;
    }
  },
};

// =====================================================
// API COMPLETA - PRODUCTS
// =====================================================
export const products = {
  list: async () => {
    try {
      const profile = await getCurrentProfile();
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('company_id', profile.company_id)
        .order('name');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erro em products.list:', error);
      throw error;
    }
  },

  create: async (data: any) => {
    try {
      const profile = await getCurrentProfile();
      const { data: result, error } = await supabase
        .from('products')
        .insert({ ...data, company_id: profile.company_id })
        .select()
        .single();

      if (error) throw error;
      return result;
    } catch (error) {
      console.error('Erro em products.create:', error);
      throw error;
    }
  },

  update: async (id: string, data: any) => {
    try {
      const profile = await getCurrentProfile();
      const { data: result, error } = await supabase
        .from('products')
        .update(data)
        .eq('id', id)
        .eq('company_id', profile.company_id)
        .select()
        .single();

      if (error) throw error;
      return result;
    } catch (error) {
      console.error('Erro em products.update:', error);
      throw error;
    }
  },

  delete: async (id: string) => {
    try {
      const profile = await getCurrentProfile();
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id)
        .eq('company_id', profile.company_id);

      if (error) throw error;
    } catch (error) {
      console.error('Erro em products.delete:', error);
      throw error;
    }
  },
};

// =====================================================
// API COMPLETA - EMPLOYEES
// =====================================================
export const employees = {
  list: async (params?: { active?: boolean; cargo_id?: string; search?: string }) => {
    try {
      const profile = await getCurrentProfile();
      let query = supabase
        .from('employees')
        .select('*')
        .eq('company_id', profile.company_id);

      if (params?.active !== undefined) {
        query = query.eq('active', params.active);
      }
      if (params?.cargo_id) {
        query = query.eq('cargo_id', params.cargo_id);
      }
      if (params?.search) {
        query = query.or(`full_name.ilike.%${params.search}%,email.ilike.%${params.search}%`);
      }

      const { data, error } = await query.order('full_name');
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erro em employees.list:', error);
      throw error;
    }
  },

  create: async (data: any) => {
    try {
      const profile = await getCurrentProfile();
      const { data: result, error } = await supabase
        .from('employees')
        .insert({ ...data, company_id: profile.company_id })
        .select()
        .single();

      if (error) throw error;
      return result;
    } catch (error) {
      console.error('Erro em employees.create:', error);
      throw error;
    }
  },

  update: async (id: string, data: any) => {
    try {
      const profile = await getCurrentProfile();
      const { data: result, error } = await supabase
        .from('employees')
        .update(data)
        .eq('id', id)
        .eq('company_id', profile.company_id)
        .select()
        .single();

      if (error) throw error;
      return result;
    } catch (error) {
      console.error('Erro em employees.update:', error);
      throw error;
    }
  },

  delete: async (id: string) => {
    try {
      const profile = await getCurrentProfile();
      const { error } = await supabase
        .from('employees')
        .delete()
        .eq('id', id)
        .eq('company_id', profile.company_id);

      if (error) throw error;
    } catch (error) {
      console.error('Erro em employees.delete:', error);
      throw error;
    }
  },
};

// =====================================================
// API COMPLETA - CARGOS
// =====================================================
export const cargos = {
  list: async () => {
    try {
      const profile = await getCurrentProfile();
      const { data, error } = await supabase
        .from('cargos')
        .select('*')
        .eq('company_id', profile.company_id)
        .order('name');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erro em cargos.list:', error);
      throw error;
    }
  },

  create: async (data: any) => {
    try {
      const profile = await getCurrentProfile();
      const { data: result, error } = await supabase
        .from('cargos')
        .insert({ ...data, company_id: profile.company_id })
        .select()
        .single();

      if (error) throw error;
      return result;
    } catch (error) {
      console.error('Erro em cargos.create:', error);
      throw error;
    }
  },

  update: async (id: string, data: any) => {
    try {
      const profile = await getCurrentProfile();
      const { data: result, error } = await supabase
        .from('cargos')
        .update(data)
        .eq('id', id)
        .eq('company_id', profile.company_id)
        .select()
        .single();

      if (error) throw error;
      return result;
    } catch (error) {
      console.error('Erro em cargos.update:', error);
      throw error;
    }
  },

  delete: async (id: string) => {
    try {
      const profile = await getCurrentProfile();
      const { error } = await supabase
        .from('cargos')
        .delete()
        .eq('id', id)
        .eq('company_id', profile.company_id);

      if (error) throw error;
    } catch (error) {
      console.error('Erro em cargos.delete:', error);
      throw error;
    }
  },
};

// =====================================================
// API COMPLETA - ENCARGOS
// =====================================================
export const encargos = {
  list: async () => {
    try {
      const profile = await getCurrentProfile();
      const { data, error } = await supabase
        .from('encargos')
        .select('*')
        .eq('company_id', profile.company_id)
        .order('name');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erro em encargos.list:', error);
      throw error;
    }
  },

  create: async (data: any) => {
    try {
      const profile = await getCurrentProfile();
      const { data: result, error } = await supabase
        .from('encargos')
        .insert({ ...data, company_id: profile.company_id })
        .select()
        .single();

      if (error) throw error;
      return result;
    } catch (error) {
      console.error('Erro em encargos.create:', error);
      throw error;
    }
  },

  update: async (id: string, data: any) => {
    try {
      const profile = await getCurrentProfile();
      const { data: result, error } = await supabase
        .from('encargos')
        .update(data)
        .eq('id', id)
        .eq('company_id', profile.company_id)
        .select()
        .single();

      if (error) throw error;
      return result;
    } catch (error) {
      console.error('Erro em encargos.update:', error);
      throw error;
    }
  },

  delete: async (id: string) => {
    try {
      const profile = await getCurrentProfile();
      const { error } = await supabase
        .from('encargos')
        .delete()
        .eq('id', id)
        .eq('company_id', profile.company_id);

      if (error) throw error;
    } catch (error) {
      console.error('Erro em encargos.delete:', error);
      throw error;
    }
  },
};

// =====================================================
// API COMPLETA - MANUTENÇÃO
// =====================================================
export const manutencao = {
  list: async () => {
    try {
      const profile = await getCurrentProfile();
      const { data, error } = await supabase
        .from('manutencao')
        .select('*')
        .eq('company_id', profile.company_id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erro em manutencao.list:', error);
      throw error;
    }
  },

  create: async (data: any) => {
    try {
      const profile = await getCurrentProfile();
      const { data: result, error } = await supabase
        .from('manutencao')
        .insert({ ...data, company_id: profile.company_id })
        .select()
        .single();

      if (error) throw error;
      return result;
    } catch (error) {
      console.error('Erro em manutencao.create:', error);
      throw error;
    }
  },
};

// =====================================================
// API COMPLETA - CONSUMO ÁGUA
// =====================================================
export const consumoAgua = {
  list: async () => {
    try {
      const profile = await getCurrentProfile();
      const { data, error } = await supabase
        .from('consumo_agua')
        .select('*')
        .eq('company_id', profile.company_id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erro em consumoAgua.list:', error);
      throw error;
    }
  },

  create: async (data: any) => {
    try {
      const profile = await getCurrentProfile();
      const { data: result, error } = await supabase
        .from('consumo_agua')
        .insert({ ...data, company_id: profile.company_id })
        .select()
        .single();

      if (error) throw error;
      return result;
    } catch (error) {
      console.error('Erro em consumoAgua.create:', error);
      throw error;
    }
  },
};

// =====================================================
// API COMPLETA - LANÇAMENTO MO
// =====================================================
export const lancamentoMO = {
  list: async () => {
    try {
      const profile = await getCurrentProfile();
      const { data, error } = await supabase
        .from('lancamento_mo')
        .select('*')
        .eq('company_id', profile.company_id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erro em lancamentoMO.list:', error);
      throw error;
    }
  },

  create: async (data: any) => {
    try {
      const profile = await getCurrentProfile();
      const { data: result, error } = await supabase
        .from('lancamento_mo')
        .insert({ ...data, company_id: profile.company_id })
        .select()
        .single();

      if (error) throw error;
      return result;
    } catch (error) {
      console.error('Erro em lancamentoMO.create:', error);
      throw error;
    }
  },
};

// =====================================================
// API COMPLETA - PEÇAS
// =====================================================
export const pieces = {
  list: async () => {
    try {
      const profile = await getCurrentProfile();
      const { data, error } = await supabase
        .from('pieces')
        .select('*')
        .eq('company_id', profile.company_id)
        .order('name');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erro em pieces.list:', error);
      throw error;
    }
  },

  create: async (data: any) => {
    try {
      const profile = await getCurrentProfile();
      const { data: result, error } = await supabase
        .from('pieces')
        .insert({ ...data, company_id: profile.company_id })
        .select()
        .single();

      if (error) throw error;
      return result;
    } catch (error) {
      console.error('Erro em pieces.create:', error);
      throw error;
    }
  },
};

// =====================================================
// API COMPLETA - USERS
// =====================================================
export const users = {
  list: async () => {
    try {
      const profile = await getCurrentProfile();
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('company_id', profile.company_id)
        .order('full_name');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erro em users.list:', error);
      throw error;
    }
  },

  get: async (id: string) => {
    try {
      const profile = await getCurrentProfile();
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .eq('company_id', profile.company_id)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erro em users.get:', error);
      throw error;
    }
  },

  update: async (id: string, data: any) => {
    try {
      const profile = await getCurrentProfile();
      const { data: result, error } = await supabase
        .from('profiles')
        .update(data)
        .eq('id', id)
        .eq('company_id', profile.company_id)
        .select()
        .single();

      if (error) throw error;
      return result;
    } catch (error) {
      console.error('Erro em users.update:', error);
      throw error;
    }
  },

  delete: async (id: string) => {
    try {
      const profile = await getCurrentProfile();
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', id)
        .eq('company_id', profile.company_id);

      if (error) throw error;
    } catch (error) {
      console.error('Erro em users.delete:', error);
      throw error;
    }
  },

  resetPassword: async (id: string, new_password: string) => {
    try {
      const { error } = await supabase.auth.admin.updateUserById(id, {
        password: new_password,
      });

      if (error) throw error;
    } catch (error) {
      console.error('Erro em users.resetPassword:', error);
      throw error;
    }
  },
};

// =====================================================
// EXPORTAR API COMPLETA
// =====================================================
export const apiComplete = {
  groups,
  productionLines,
  products,
  employees,
  cargos,
  encargos,
  manutencao,
  consumoAgua,
  lancamentoMO,
  pieces,
  users,
};

export default apiComplete;
*/
