/**
 * API Completa com Supabase - Versão Corrigida
 * Separando cliente público do admin com validação de variáveis de ambiente
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import { createClient } from '@supabase/supabase-js';
import { createSupabaseClient } from '@/lib/supabase/client';

const isBrowser = typeof window !== 'undefined';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const buildEnvError = (missing: string[]) => {
  const lines = [
    '❌ VARIÁVEIS DE AMBIENTE FALTANDO:',
    '',
    'Variáveis necessárias:',
    ...missing.map((name) => `   - ${name}`),
    '',
    'Como configurar:',
    '1. Crie o arquivo .env.local',
    '2. Adicione as variáveis:',
    '   NEXT_PUBLIC_SUPABASE_URL=https://SEU_PROJETO.supabase.co',
    '   NEXT_PUBLIC_SUPABASE_ANON_KEY=SUA_CHAVE_ANON',
    '   SUPABASE_SERVICE_ROLE_KEY=SUA_CHAVE_SERVICE',
    '',
    '3. Reinicie o servidor de desenvolvimento',
  ];

  return new Error(lines.join('\n'));
};

const validatePublicEnvVars = () => {
  const missing: string[] = [];
  if (!SUPABASE_URL) missing.push('NEXT_PUBLIC_SUPABASE_URL');
  if (!SUPABASE_ANON_KEY) missing.push('NEXT_PUBLIC_SUPABASE_ANON_KEY');
  if (missing.length > 0) throw buildEnvError(missing);
};

const validateAdminEnvVars = () => {
  if (!SUPABASE_SERVICE_ROLE_KEY) {
    throw buildEnvError(['SUPABASE_SERVICE_ROLE_KEY']);
  }
};

validatePublicEnvVars();

// Cliente Supabase PÚBLICO (para frontend - usa ANON_KEY)
export const supabasePublic: any = isBrowser
  ? createSupabaseClient()
  : createClient(
      SUPABASE_URL!,
      SUPABASE_ANON_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

// Cliente Supabase ADMIN
// No browser: reutiliza o cliente autenticado (com JWT do usuário) para passar RLS
// No servidor: usa SERVICE_ROLE_KEY que bypassa RLS
export const supabaseAdmin: any = isBrowser
  ? supabasePublic
  : (() => {
      validateAdminEnvVars();
      return createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!, {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      });
    })();

// Obter profile do usuário atual (usando cliente público para autenticação)
const getCurrentProfile = async () => {
  let user = null as { id: string; email?: string | null } | null;
  let lastSessionError: Error | null = null;

  const attempts = isBrowser ? 3 : 1;
  for (let i = 0; i < attempts; i++) {
    const { data: { session }, error: sessionError } = await supabasePublic.auth.getSession();

    if (!sessionError && session?.user) {
      user = { id: session.user.id, email: session.user.email };
      break;
    }

    if (sessionError) {
      lastSessionError = new Error(sessionError.message);
    }

    if (isBrowser && i < attempts - 1) {
      await new Promise((resolve) => setTimeout(resolve, 250));
    }
  }

  if (!user) {
    if (isBrowser) {
      const userFromAuthState = await new Promise<{ id: string; email?: string | null } | null>((resolve) => {
        const timeout = setTimeout(() => resolve(null), 1500);

        const {
          data: { subscription },
        } = supabasePublic.auth.onAuthStateChange((_event: unknown, session: { user?: { id: string; email?: string | null } } | null) => {
          if (session?.user) {
            clearTimeout(timeout);
            resolve({ id: session.user.id, email: session.user.email });
          }
        });

        setTimeout(() => {
          subscription.unsubscribe();
        }, 1600);
      });

      if (userFromAuthState) {
        user = userFromAuthState;
      }
    }
  }

  if (!user) {
    const { data: userData, error: userError } = await supabasePublic.auth.getUser();
    if (userError && userError.message !== 'Auth session missing!') {
      console.error('Erro de autenticação:', userError);
      throw new Error(`Erro de autenticação: ${userError.message}`);
    }
    if (userData?.user) {
      user = { id: userData.user.id, email: userData.user.email };
    }
  }

  if (!user) {
    if (lastSessionError && lastSessionError.message !== 'Auth session missing!') {
      throw new Error(`Erro de autenticação: ${lastSessionError.message}`);
    }
    throw new Error('Usuário não autenticado. Faça login para continuar.');
  }

  let profile: any = null;

  if (isBrowser) {
    try {
      const { data: { session } } = await supabasePublic.auth.getSession();
      const token = session?.access_token;

      if (token) {
        const response = await fetch('/api/auth/profile', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const payload = await response.json();
          profile = payload?.profile || null;
        }
      }
    } catch (error) {
      console.error('Erro ao buscar profile via API route:', error);
    }
  }

  if (!profile) {
    const { data: profiles, error } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .limit(1);

    if (error) {
      console.error('Erro ao buscar profile:', error);
      throw new Error(`Erro ao buscar profile: ${error.message}`);
    }

    profile = profiles?.[0] || null;

    if (!profile && user.email) {
      const { data: fallbackProfiles, error: fallbackError } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .eq('email', user.email)
        .limit(1);

      if (!fallbackError) {
        profile = fallbackProfiles?.[0] || null;
      }
    }
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
      const { data, error } = await supabaseAdmin
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
      const { data: result, error } = await supabaseAdmin
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
      const { data: result, error } = await supabaseAdmin
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
      const { error } = await supabaseAdmin
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
      const { data, error } = await supabaseAdmin
        .from('production_lines')
        .select('*')
        .eq('company_id', profile.company_id)
        .order('name');

      if (error && String(error.message || '').includes('line_type')) {
        const { data: fallbackData, error: fallbackError } = await supabaseAdmin
          .from('production_lines')
          .select('id, company_id, name, description, active, created_at, updated_at')
          .eq('company_id', profile.company_id)
          .order('name');

        if (fallbackError) throw fallbackError;

        return (fallbackData || []).map((line: any) => ({
          ...line,
          line_type: 'GALVANOPLASTIA',
        }));
      }

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
      const payload = { ...data, company_id: profile.company_id };
      const { data: result, error } = await supabaseAdmin
        .from('production_lines')
        .insert(payload)
        .select()
        .single();

      if (error && String(error.message || '').includes('line_type')) {
        const { line_type, ...legacyPayload } = payload;
        void line_type;

        const { data: legacyResult, error: legacyError } = await supabaseAdmin
          .from('production_lines')
          .insert(legacyPayload)
          .select()
          .single();

        if (legacyError) throw legacyError;

        return {
          ...legacyResult,
          line_type: 'GALVANOPLASTIA',
        };
      }

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
      const { data: result, error } = await supabaseAdmin
        .from('production_lines')
        .update(data)
        .eq('id', id)
        .eq('company_id', profile.company_id)
        .select()
        .single();

      if (error && String(error.message || '').includes('line_type')) {
        const { line_type, ...legacyData } = data || {};
        void line_type;

        const { data: legacyResult, error: legacyError } = await supabaseAdmin
          .from('production_lines')
          .update(legacyData)
          .eq('id', id)
          .eq('company_id', profile.company_id)
          .select('id, company_id, name, description, active, created_at, updated_at')
          .single();

        if (legacyError) throw legacyError;

        return {
          ...legacyResult,
          line_type: 'GALVANOPLASTIA',
        };
      }

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
      const { error } = await supabaseAdmin
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
      const { data, error } = await supabaseAdmin
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
      const { data: result, error } = await supabaseAdmin
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
      const { data: result, error } = await supabaseAdmin
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
      const { error } = await supabaseAdmin
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
      let query = supabaseAdmin
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
      const { data: result, error } = await supabaseAdmin
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
      const { data: result, error } = await supabaseAdmin
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
      const { error } = await supabaseAdmin
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
      const { data, error } = await supabaseAdmin
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
      const { data: result, error } = await supabaseAdmin
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
      const { data: result, error } = await supabaseAdmin
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
      const { error } = await supabaseAdmin
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
      const { data, error } = await supabaseAdmin
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
      const { data: result, error } = await supabaseAdmin
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
      const { data: result, error } = await supabaseAdmin
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
      const { error } = await supabaseAdmin
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
      const { data, error } = await supabaseAdmin
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
      const { data: result, error } = await supabaseAdmin
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
      const { data, error } = await supabaseAdmin
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
      const { data: result, error } = await supabaseAdmin
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
      const { data, error } = await supabaseAdmin
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
      const { data: result, error } = await supabaseAdmin
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
      const { data, error } = await supabaseAdmin
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
      const { data: result, error } = await supabaseAdmin
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
      const { data, error } = await supabaseAdmin
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
      const { data: rows, error } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .eq('id', id)
        .eq('company_id', profile.company_id)
        .limit(1);

      if (error) throw error;
      return rows?.[0] ?? null;
    } catch (error) {
      console.error('Erro em users.get:', error);
      throw error;
    }
  },

  create: async (data: any) => {
    try {
      const profile = await getCurrentProfile();
      const payload = {
        full_name: data.full_name,
        email: data.email,
        role: data.role,
        active: data.active ?? true,
        company_id: profile.company_id,
      };

      if (isBrowser) {
        const { data: result, error } = await supabasePublic
          .from('profiles')
          .insert(payload)
          .select()
          .single();

        if (error) throw error;
        return result;
      }

      const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: data.email,
        password: data.password,
        email_confirm: true,
        user_metadata: {
          full_name: data.full_name,
        },
      });

      if (authError) throw authError;
      if (!authUser.user?.id) {
        throw new Error('Falha ao criar usuário no Auth');
      }

      const { data: result, error } = await supabaseAdmin
        .from('profiles')
        .upsert({
          id: authUser.user.id,
          ...payload,
        })
        .select()
        .single();

      if (error) throw error;
      return result;
    } catch (error) {
      console.error('Erro em users.create:', error);
      throw error;
    }
  },

  update: async (id: string, data: any) => {
    try {
      const profile = await getCurrentProfile();
      const { data: result, error } = await supabaseAdmin
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
      const { error } = await supabaseAdmin
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
      const { error } = await supabaseAdmin.auth.admin.updateUserById(id, {
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
