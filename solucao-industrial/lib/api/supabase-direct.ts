/*
 * LEGACY FILE DISABLED.
 * Kept only for reference. Not used by current app.
 *

import { createClient } from '@supabase/supabase-js';
import { createSupabaseClient } from '@/lib/supabase/client';
import type {
  Cargo,
  ConsumoAgua,
  Encargo,
  Employee,
  Group,
  LancamentoMO,
  Manutencao,
  Piece,
  Product,
  ProductionLine,
  Profile,
} from '@/types/database.types';

// Cliente Supabase com service role key (bypass RLS)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

// Cliente Supabase com user context (respeita RLS)
const supabaseUser = createSupabaseClient();

// Obter usuário atual
const getCurrentUser = async () => {
  // Tenta obter do contexto do usuário primeiro
  try {
    const { data: { user } } = await supabaseUser.auth.getUser();
    if (user) return user;
  } catch (error) {
    console.log('🔍 Usuário não encontrado no contexto, tentando admin...');
  }

  // Fallback para admin client
  const { data: { user } } = await supabaseAdmin.auth.getUser();
  return user;
};

// Obter profile do usuário atual
const getCurrentProfile = async () => {
  const user = await getCurrentUser();
  if (!user) throw new Error('Usuário não autenticado');

  console.log('🔍 Buscando profile para user_id:', user.id);

  const { data: profile, error } = await supabaseAdmin
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (error) {
    console.error('❌ Erro ao buscar profile:', error);
    throw new Error(`Erro ao buscar profile: ${error.message}`);
  }

  if (!profile) {
    throw new Error('Profile não encontrado para o usuário');
  }

  console.log('✅ Profile encontrado:', profile);
  return profile;
};

// =====================================================
// API DIRECT - GRUPOS
// =====================================================
export const groupsApi = {
  list: async (): Promise<Group[]> => {
    const profile = await getCurrentProfile();
    const { data, error } = await supabaseUser
      .from('groups')
      .select('*')
      .eq('company_id', profile.company_id)
      .order('name');

    if (error) throw error;
    return data || [];
  },

  create: async (data: Omit<Group, 'id' | 'created_at' | 'updated_at' | 'company_id'>): Promise<Group> => {
    const profile = await getCurrentProfile();
    const { data: result, error } = await supabaseUser
      .from('groups')
      .insert({ ...data, company_id: profile.company_id })
      .select()
      .single();

    if (error) throw error;
    return result;
  },

  update: async (id: string, data: Partial<Group>): Promise<Group> => {
    const profile = await getCurrentProfile();
    const { data: result, error } = await supabaseUser
      .from('groups')
      .update(data)
      .eq('id', id)
      .eq('company_id', profile.company_id)
      .select()
      .single();

    if (error) throw error;
    return result;
  },

  delete: async (id: string): Promise<void> => {
    const profile = await getCurrentProfile();
    const { error } = await supabaseUser
      .from('groups')
      .delete()
      .eq('id', id)
      .eq('company_id', profile.company_id);

    if (error) throw error;
  },
};

// =====================================================
// API DIRECT - EMPLOYEES
// =====================================================
export const employeesApi = {
  list: async (params?: { active?: boolean; cargo_id?: string; search?: string }): Promise<Employee[]> => {
    const profile = await getCurrentProfile();
    let query = supabaseUser
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
  },

  create: async (data: Omit<Employee, 'id' | 'created_at' | 'updated_at' | 'company_id'>): Promise<Employee> => {
    const profile = await getCurrentProfile();
    const { data: result, error } = await supabaseUser
      .from('employees')
      .insert({ ...data, company_id: profile.company_id })
      .select()
      .single();

    if (error) throw error;
    return result;
  },

  update: async (id: string, data: Partial<Employee>): Promise<Employee> => {
    const profile = await getCurrentProfile();
    const { data: result, error } = await supabaseUser
      .from('employees')
      .update(data)
      .eq('id', id)
      .eq('company_id', profile.company_id)
      .select()
      .single();

    if (error) throw error;
    return result;
  },

  delete: async (id: string): Promise<void> => {
    const profile = await getCurrentProfile();
    const { error } = await supabaseUser
      .from('employees')
      .delete()
      .eq('id', id)
      .eq('company_id', profile.company_id);

    if (error) throw error;
  },
};

// =====================================================
// API DIRECT - PRODUCTION LINES
// =====================================================
export const productionLinesApi = {
  list: async (): Promise<ProductionLine[]> => {
    const profile = await getCurrentProfile();
    const { data, error } = await supabaseUser
      .from('production_lines')
      .select('*')
      .eq('company_id', profile.company_id)
      .order('name');

    if (error) throw error;
    return data || [];
  },

  create: async (data: Omit<ProductionLine, 'id' | 'created_at' | 'updated_at' | 'company_id'>): Promise<ProductionLine> => {
    const profile = await getCurrentProfile();
    const { data: result, error } = await supabaseUser
      .from('production_lines')
      .insert({ ...data, company_id: profile.company_id })
      .select()
      .single();

    if (error) throw error;
    return result;
  },

  update: async (id: string, data: Partial<ProductionLine>): Promise<ProductionLine> => {
    const profile = await getCurrentProfile();
    const { data: result, error } = await supabaseUser
      .from('production_lines')
      .update(data)
      .eq('id', id)
      .eq('company_id', profile.company_id)
      .select()
      .single();

    if (error) throw error;
    return result;
  },

  delete: async (id: string): Promise<void> => {
    const profile = await getCurrentProfile();
    const { error } = await supabaseUser
      .from('production_lines')
      .delete()
      .eq('id', id)
      .eq('company_id', profile.company_id);

    if (error) throw error;
  },
};

// Export tudo em um único objeto
export const apiDirect = {
  groups: groupsApi,
  employees: employeesApi,
  productionLines: productionLinesApi,
};

export default apiDirect;

*/
