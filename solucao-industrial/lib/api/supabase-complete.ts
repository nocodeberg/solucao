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
// Mapeamento DB (inglês) → TypeScript (português) para employees
const EMPLOYEE_SELECT = 'id, company_id, cargo_id, nome:full_name, cpf, email, telefone:phone, salario_base:salary, data_admissao:admission_date, foto_url:avatar_url, active, tipo_mo, created_at, updated_at';
const mapEmployeeToDb = (data: any) => {
  const mapped: any = { ...data };
  if ('nome' in mapped) { mapped.full_name = mapped.nome; delete mapped.nome; }
  if ('salario_base' in mapped) { mapped.salary = mapped.salario_base; delete mapped.salario_base; }
  if ('data_admissao' in mapped) { mapped.admission_date = mapped.data_admissao; delete mapped.data_admissao; }
  if ('telefone' in mapped) { mapped.phone = mapped.telefone; delete mapped.telefone; }
  if ('foto_url' in mapped) { mapped.avatar_url = mapped.foto_url; delete mapped.foto_url; }
  return mapped;
};

export const employees = {
  list: async (params?: { active?: boolean; cargo_id?: string; search?: string }) => {
    try {
      const profile = await getCurrentProfile();
      let query = supabaseAdmin
        .from('employees')
        .select(EMPLOYEE_SELECT)
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
      const dbData = mapEmployeeToDb(data);
      const { data: result, error } = await supabaseAdmin
        .from('employees')
        .insert({ ...dbData, company_id: profile.company_id })
        .select(EMPLOYEE_SELECT)
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
      const dbData = mapEmployeeToDb(data);
      const { data: result, error } = await supabaseAdmin
        .from('employees')
        .update(dbData)
        .eq('id', id)
        .eq('company_id', profile.company_id)
        .select(EMPLOYEE_SELECT)
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
// Mapeamento DB (inglês) → TypeScript (português) para cargos
const CARGO_SELECT = 'id, company_id, nome:name, descricao:description, created_at, updated_at';
const mapCargoToDb = (data: any) => {
  const mapped: any = { ...data };
  if ('nome' in mapped) { mapped.name = mapped.nome; delete mapped.nome; }
  if ('descricao' in mapped) { mapped.description = mapped.descricao; delete mapped.descricao; }
  return mapped;
};

export const cargos = {
  list: async () => {
    try {
      const profile = await getCurrentProfile();
      const { data, error } = await supabaseAdmin
        .from('cargos')
        .select(CARGO_SELECT)
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
      const dbData = mapCargoToDb(data);
      const { data: result, error } = await supabaseAdmin
        .from('cargos')
        .insert({ ...dbData, company_id: profile.company_id })
        .select(CARGO_SELECT)
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
      const dbData = mapCargoToDb(data);
      const { data: result, error } = await supabaseAdmin
        .from('cargos')
        .update(dbData)
        .eq('id', id)
        .eq('company_id', profile.company_id)
        .select(CARGO_SELECT)
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
// Mapeamento DB (inglês) → TypeScript (português) para encargos
const ENCARGO_SELECT = 'id, company_id, nome:name, percentual:value, descricao:description, is_percentage, created_at, updated_at';
const mapEncargoToDb = (data: any) => {
  const mapped: any = { ...data };
  if ('nome' in mapped) { mapped.name = mapped.nome; delete mapped.nome; }
  if ('percentual' in mapped) { mapped.value = mapped.percentual; delete mapped.percentual; }
  if ('descricao' in mapped) { mapped.description = mapped.descricao; delete mapped.descricao; }
  return mapped;
};

export const encargos = {
  list: async () => {
    try {
      const profile = await getCurrentProfile();
      const { data, error } = await supabaseAdmin
        .from('encargos')
        .select(ENCARGO_SELECT)
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
      const dbData = mapEncargoToDb(data);
      const { data: result, error } = await supabaseAdmin
        .from('encargos')
        .insert({ ...dbData, company_id: profile.company_id })
        .select(ENCARGO_SELECT)
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
      const dbData = mapEncargoToDb(data);
      const { data: result, error } = await supabaseAdmin
        .from('encargos')
        .update(dbData)
        .eq('id', id)
        .eq('company_id', profile.company_id)
        .select(ENCARGO_SELECT)
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

  update: async (id: string, data: any) => {
    try {
      const { data: result, error } = await supabaseAdmin
        .from('manutencao')
        .update(data)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return result;
    } catch (error) {
      console.error('Erro em manutencao.update:', error);
      throw error;
    }
  },

  delete: async (id: string) => {
    try {
      const { error } = await supabaseAdmin
        .from('manutencao')
        .delete()
        .eq('id', id);
      if (error) throw error;
    } catch (error) {
      console.error('Erro em manutencao.delete:', error);
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

  update: async (id: string, data: any) => {
    try {
      const { data: result, error } = await supabaseAdmin
        .from('consumo_agua')
        .update(data)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return result;
    } catch (error) {
      console.error('Erro em consumoAgua.update:', error);
      throw error;
    }
  },

  delete: async (id: string) => {
    try {
      const { error } = await supabaseAdmin
        .from('consumo_agua')
        .delete()
        .eq('id', id);
      if (error) throw error;
    } catch (error) {
      console.error('Erro em consumoAgua.delete:', error);
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

  update: async (id: string, data: any) => {
    try {
      const profile = await getCurrentProfile();
      const { data: result, error } = await supabaseAdmin
        .from('lancamento_mo')
        .update(data)
        .eq('id', id)
        .eq('company_id', profile.company_id)
        .select()
        .single();

      if (error) throw error;
      return result;
    } catch (error) {
      console.error('Erro em lancamentoMO.update:', error);
      throw error;
    }
  },

  delete: async (id: string) => {
    try {
      const profile = await getCurrentProfile();
      const { error } = await supabaseAdmin
        .from('lancamento_mo')
        .delete()
        .eq('id', id)
        .eq('company_id', profile.company_id);

      if (error) throw error;
    } catch (error) {
      console.error('Erro em lancamentoMO.delete:', error);
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
      const base: Record<string, unknown> = {
        company_id: profile.company_id,
        name: data.name,
        area_dm2: data.area_dm2,
        weight_kg: data.weight_kg,
      };
      if (data.production_type) base.production_type = data.production_type;
      if (data.group_ids?.length > 0) base.group_id = data.group_ids[0];

      // Tenta com todos os campos (codigo + group_ids)
      const full: Record<string, unknown> = { ...base };
      if (data.codigo) full.codigo = data.codigo;
      if (data.group_ids?.length > 0) full.group_ids = data.group_ids;

      const { data: r1, error: e1 } = await supabaseAdmin
        .from('pieces').insert(full).select().single();
      if (!e1) return r1;

      // Fallback sem group_ids (coluna pode não existir)
      const withCodigo: Record<string, unknown> = { ...base };
      if (data.codigo) withCodigo.codigo = data.codigo;
      const { data: r2, error: e2 } = await supabaseAdmin
        .from('pieces').insert(withCodigo).select().single();
      if (!e2) return r2;

      // Fallback sem codigo (coluna pode não existir)
      const withGroupIds: Record<string, unknown> = { ...base };
      if (data.group_ids?.length > 0) withGroupIds.group_ids = data.group_ids;
      const { data: r3, error: e3 } = await supabaseAdmin
        .from('pieces').insert(withGroupIds).select().single();
      if (!e3) return r3;

      // Fallback mínimo (só campos originais)
      const { data: r4, error: e4 } = await supabaseAdmin
        .from('pieces').insert(base).select().single();
      if (e4) throw e4;
      return r4;
    } catch (error) {
      console.error('Erro em pieces.create:', error);
      throw error;
    }
  },

  update: async (id: number, data: any) => {
    try {
      const profile = await getCurrentProfile();
      const dbData: Record<string, unknown> = {
        name: data.name,
        area_dm2: data.area_dm2,
        weight_kg: data.weight_kg,
      };
      if (data.production_type !== undefined) dbData.production_type = data.production_type;
      if (data.codigo !== undefined) dbData.codigo = data.codigo;
      if (data.group_ids) {
        dbData.group_ids = data.group_ids;
        dbData.group_id = data.group_ids.length > 0 ? data.group_ids[0] : null;
      }

      const { data: result, error } = await supabaseAdmin
        .from('pieces')
        .update(dbData)
        .eq('id', id)
        .eq('company_id', profile.company_id)
        .select()
        .single();

      if (error) {
        // Fallback sem group_ids/codigo
        const fallback: Record<string, unknown> = {
          name: data.name,
          area_dm2: data.area_dm2,
          weight_kg: data.weight_kg,
        };
        if (data.production_type !== undefined) fallback.production_type = data.production_type;
        if (data.group_ids?.length > 0) fallback.group_id = data.group_ids[0];
        const { data: r2, error: e2 } = await supabaseAdmin
          .from('pieces')
          .update(fallback)
          .eq('id', id)
          .eq('company_id', profile.company_id)
          .select()
          .single();
        if (e2) throw e2;
        return r2;
      }
      return result;
    } catch (error) {
      console.error('Erro em pieces.update:', error);
      throw error;
    }
  },

  delete: async (id: number) => {
    try {
      const profile = await getCurrentProfile();
      const { error } = await supabaseAdmin
        .from('pieces')
        .delete()
        .eq('id', id)
        .eq('company_id', profile.company_id);

      if (error) throw error;
    } catch (error) {
      console.error('Erro em pieces.delete:', error);
      throw error;
    }
  },
};

// =====================================================
// API COMPLETA - LANÇAMENTO DE PEÇAS
// =====================================================
export const lancamentoPecas = {
  listByPiece: async (pieceId: number, ano: number) => {
    try {
      const profile = await getCurrentProfile();
      const { data, error } = await supabaseAdmin
        .from('lancamento_pecas')
        .select('*')
        .eq('company_id', profile.company_id)
        .eq('piece_id', pieceId)
        .eq('ano', ano)
        .order('mes');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erro em lancamentoPecas.listByPiece:', error);
      throw error;
    }
  },

  upsert: async (pieceId: number, mes: number, ano: number, quantidade: number) => {
    try {
      const profile = await getCurrentProfile();
      const { data, error } = await supabaseAdmin
        .from('lancamento_pecas')
        .upsert(
          {
            company_id: profile.company_id,
            piece_id: pieceId,
            mes,
            ano,
            quantidade,
            created_by: profile.id,
          },
          { onConflict: 'company_id,piece_id,mes,ano' }
        )
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erro em lancamentoPecas.upsert:', error);
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

      // Sempre usa API route (server-side) para criar auth user + profile
      const response = await fetch('/api/users/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: data.full_name,
          email: data.email,
          password: data.password,
          role: data.role,
          active: data.active ?? true,
          company_id: profile.company_id,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Erro ao criar usuário');
      }

      return result.user;
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
      const response = await fetch('/api/users/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: id, new_password }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Erro ao resetar senha');
      }
    } catch (error) {
      console.error('Erro em users.resetPassword:', error);
      throw error;
    }
  },
};

// =====================================================
// CUSTOS VARIÁVEIS (Energia, Telefone)
// =====================================================
const custosVariaveis = {
  list: async (ano?: number) => {
    try {
      const profile = await getCurrentProfile();
      let query = supabaseAdmin
        .from('custos_variaveis')
        .select('*')
        .eq('company_id', profile.company_id)
        .order('data', { ascending: false });

      if (ano) {
        query = query.gte('data', `${ano}-01-01`).lte('data', `${ano}-12-31`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erro em custosVariaveis.list:', error);
      throw error;
    }
  },

  create: async (data: any) => {
    try {
      const profile = await getCurrentProfile();
      const { data: result, error } = await supabaseAdmin
        .from('custos_variaveis')
        .insert({ ...data, company_id: profile.company_id })
        .select()
        .single();

      if (error) throw error;
      return result;
    } catch (error) {
      console.error('Erro em custosVariaveis.create:', error);
      throw error;
    }
  },

  delete: async (id: string) => {
    try {
      const profile = await getCurrentProfile();
      const { error } = await supabaseAdmin
        .from('custos_variaveis')
        .delete()
        .eq('id', id)
        .eq('company_id', profile.company_id);

      if (error) throw error;
    } catch (error) {
      console.error('Erro em custosVariaveis.delete:', error);
      throw error;
    }
  },
};

// =====================================================
// OUTROS CUSTOS
// =====================================================
const outrosCustos = {
  list: async (ano?: number) => {
    try {
      const profile = await getCurrentProfile();
      let query = supabaseAdmin
        .from('outros_custos')
        .select('*')
        .eq('company_id', profile.company_id)
        .order('ano', { ascending: false })
        .order('mes', { ascending: false });

      if (ano) {
        query = query.eq('ano', ano);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erro em outrosCustos.list:', error);
      throw error;
    }
  },

  create: async (data: any) => {
    try {
      const profile = await getCurrentProfile();
      const { data: result, error } = await supabaseAdmin
        .from('outros_custos')
        .insert({ ...data, company_id: profile.company_id })
        .select()
        .single();

      if (error) throw error;
      return result;
    } catch (error) {
      console.error('Erro em outrosCustos.create:', error);
      throw error;
    }
  },

  delete: async (id: string) => {
    try {
      const profile = await getCurrentProfile();
      const { error } = await supabaseAdmin
        .from('outros_custos')
        .delete()
        .eq('id', id)
        .eq('company_id', profile.company_id);

      if (error) throw error;
    } catch (error) {
      console.error('Erro em outrosCustos.delete:', error);
      throw error;
    }
  },
};

// =====================================================
// TRANSPORTE
// =====================================================
const transporte = {
  list: async (ano?: number) => {
    try {
      const profile = await getCurrentProfile();
      let query = supabaseAdmin
        .from('transporte')
        .select('*')
        .eq('company_id', profile.company_id)
        .order('ano', { ascending: false })
        .order('mes', { ascending: false });

      if (ano) {
        query = query.eq('ano', ano);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erro em transporte.list:', error);
      throw error;
    }
  },

  create: async (data: any) => {
    try {
      const profile = await getCurrentProfile();
      const { data: result, error } = await supabaseAdmin
        .from('transporte')
        .insert({ ...data, company_id: profile.company_id })
        .select()
        .single();

      if (error) throw error;
      return result;
    } catch (error) {
      console.error('Erro em transporte.create:', error);
      throw error;
    }
  },

  delete: async (id: string) => {
    try {
      const profile = await getCurrentProfile();
      const { error } = await supabaseAdmin
        .from('transporte')
        .delete()
        .eq('id', id)
        .eq('company_id', profile.company_id);

      if (error) throw error;
    } catch (error) {
      console.error('Erro em transporte.delete:', error);
      throw error;
    }
  },
};

// =====================================================
// INVESTIMENTOS
// =====================================================
const investimentos = {
  list: async () => {
    try {
      const profile = await getCurrentProfile();
      const { data, error } = await supabaseAdmin
        .from('investimentos')
        .select('*, production_line:production_lines(id, name)')
        .eq('company_id', profile.company_id)
        .order('data_aquisicao', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erro em investimentos.list:', error);
      throw error;
    }
  },

  create: async (data: any) => {
    try {
      const profile = await getCurrentProfile();
      const valorMensal = data.valor_investimento && data.depreciacao_meses
        ? data.valor_investimento / data.depreciacao_meses
        : 0;
      const dataVencimento = data.data_aquisicao && data.depreciacao_meses
        ? (() => {
            const d = new Date(data.data_aquisicao);
            d.setMonth(d.getMonth() + data.depreciacao_meses);
            return d.toISOString().split('T')[0];
          })()
        : null;

      const { data: result, error } = await supabaseAdmin
        .from('investimentos')
        .insert({
          ...data,
          company_id: profile.company_id,
          valor_mensal: valorMensal,
          data_vencimento: dataVencimento,
        })
        .select()
        .single();

      if (error) throw error;
      return result;
    } catch (error) {
      console.error('Erro em investimentos.create:', error);
      throw error;
    }
  },

  update: async (id: string, data: any) => {
    try {
      const profile = await getCurrentProfile();
      const valorMensal = data.valor_investimento && data.depreciacao_meses
        ? data.valor_investimento / data.depreciacao_meses
        : undefined;
      const dataVencimento = data.data_aquisicao && data.depreciacao_meses
        ? (() => {
            const d = new Date(data.data_aquisicao);
            d.setMonth(d.getMonth() + data.depreciacao_meses);
            return d.toISOString().split('T')[0];
          })()
        : undefined;

      const payload: any = { ...data };
      if (valorMensal !== undefined) payload.valor_mensal = valorMensal;
      if (dataVencimento !== undefined) payload.data_vencimento = dataVencimento;

      const { data: result, error } = await supabaseAdmin
        .from('investimentos')
        .update(payload)
        .eq('id', id)
        .eq('company_id', profile.company_id)
        .select()
        .single();

      if (error) throw error;
      return result;
    } catch (error) {
      console.error('Erro em investimentos.update:', error);
      throw error;
    }
  },

  delete: async (id: string) => {
    try {
      const profile = await getCurrentProfile();
      const { error } = await supabaseAdmin
        .from('investimentos')
        .delete()
        .eq('id', id)
        .eq('company_id', profile.company_id);

      if (error) throw error;
    } catch (error) {
      console.error('Erro em investimentos.delete:', error);
      throw error;
    }
  },
};

// =====================================================
// PEÇAS POR HORA (Cálculos Eletroquímicos)
// =====================================================
const pecasHora = {
  list: async () => {
    try {
      const profile = await getCurrentProfile();
      const { data, error } = await supabaseAdmin
        .from('pecas_hora')
        .select('*, production_line:production_lines(id, name)')
        .eq('company_id', profile.company_id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erro em pecasHora.list:', error);
      throw error;
    }
  },

  create: async (data: any) => {
    try {
      const profile = await getCurrentProfile();
      // Calcular campos derivados
      const pecasPorCarga = data.peso_peca_kg > 0
        ? data.kg_por_carga / data.peso_peca_kg
        : 0;
      const areaCargaDm2 = pecasPorCarga * data.area_peca_dm2;
      // Fórmula eletroquímica: tempo de banho
      const tempoBanho = data.densidade_corrente > 0 && data.equivalente_eletroquimico > 0 && (data.rendimento_corrente / 100) > 0
        ? (data.espessura_mm * data.peso_especifico * 1000) / (data.densidade_corrente * data.equivalente_eletroquimico * (data.rendimento_corrente / 100) * 60)
        : 0;
      const pecasPorHora = tempoBanho > 0
        ? (pecasPorCarga * data.numero_tambores * 60) / tempoBanho
        : 0;
      const kgPorHora = pecasPorHora * data.peso_peca_kg;

      const { data: result, error } = await supabaseAdmin
        .from('pecas_hora')
        .insert({
          ...data,
          company_id: profile.company_id,
          pecas_por_carga: pecasPorCarga,
          area_carga_dm2: areaCargaDm2,
          pecas_por_hora: pecasPorHora,
          kg_por_hora: kgPorHora,
          tempo_banho_min: tempoBanho,
        })
        .select()
        .single();

      if (error) throw error;
      return result;
    } catch (error) {
      console.error('Erro em pecasHora.create:', error);
      throw error;
    }
  },

  update: async (id: string, data: any) => {
    try {
      const profile = await getCurrentProfile();
      const pecasPorCarga = data.peso_peca_kg > 0
        ? data.kg_por_carga / data.peso_peca_kg
        : 0;
      const areaCargaDm2 = pecasPorCarga * data.area_peca_dm2;
      const tempoBanho = data.densidade_corrente > 0 && data.equivalente_eletroquimico > 0 && (data.rendimento_corrente / 100) > 0
        ? (data.espessura_mm * data.peso_especifico * 1000) / (data.densidade_corrente * data.equivalente_eletroquimico * (data.rendimento_corrente / 100) * 60)
        : 0;
      const pecasPorHora = tempoBanho > 0
        ? (pecasPorCarga * data.numero_tambores * 60) / tempoBanho
        : 0;
      const kgPorHora = pecasPorHora * data.peso_peca_kg;

      const { data: result, error } = await supabaseAdmin
        .from('pecas_hora')
        .update({
          ...data,
          pecas_por_carga: pecasPorCarga,
          area_carga_dm2: areaCargaDm2,
          pecas_por_hora: pecasPorHora,
          kg_por_hora: kgPorHora,
          tempo_banho_min: tempoBanho,
        })
        .eq('id', id)
        .eq('company_id', profile.company_id)
        .select()
        .single();

      if (error) throw error;
      return result;
    } catch (error) {
      console.error('Erro em pecasHora.update:', error);
      throw error;
    }
  },

  delete: async (id: string) => {
    try {
      const profile = await getCurrentProfile();
      const { error } = await supabaseAdmin
        .from('pecas_hora')
        .delete()
        .eq('id', id)
        .eq('company_id', profile.company_id);

      if (error) throw error;
    } catch (error) {
      console.error('Erro em pecasHora.delete:', error);
      throw error;
    }
  },
};

// =====================================================
// AUDIT LOGS
// =====================================================
const auditLogs = {
  list: async (params?: { limit?: number; entity?: string; action?: string }) => {
    try {
      const profile = await getCurrentProfile();
      let query = supabaseAdmin
        .from('audit_logs')
        .select('*')
        .eq('company_id', profile.company_id)
        .order('created_at', { ascending: false });

      if (params?.entity) query = query.eq('entity', params.entity);
      if (params?.action) query = query.eq('action', params.action);
      query = query.limit(params?.limit || 200);

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erro em auditLogs.list:', error);
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
  lancamentoPecas,
  users,
  custosVariaveis,
  outrosCustos,
  transporte,
  investimentos,
  pecasHora,
  auditLogs,
};

export default apiComplete;
