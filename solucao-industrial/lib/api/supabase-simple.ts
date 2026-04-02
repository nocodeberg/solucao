/**
 * API Simplificada com Supabase - Solução definitiva para erro de conexão
 * Versão simples sem complexidade de tipos
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import { createClient } from '@supabase/supabase-js';

// Cliente Supabase com service role (bypass RLS)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

// Obter usuário atual da sessão
const getCurrentUser = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
};

// Obter profile do usuário
const getCurrentProfile = async () => {
  const user = await getCurrentUser();
  if (!user) throw new Error('Usuário não autenticado');

  console.log('🔍 Buscando profile para user_id:', user.id);

  const { data: profile, error } = await supabase
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
// API SIMPLIFICADA - GRUPOS
// =====================================================
export const groupsApi = {
  list: async () => {
    try {
      console.log('🔍 Iniciando groups.list...');
      
      const profile = await getCurrentProfile();
      console.log('✅ Profile obtido, company_id:', profile.company_id);
      
      const { data, error } = await supabase
        .from('groups')
        .select('*')
        .eq('company_id', profile.company_id)
        .order('name');

      if (error) {
        console.error('❌ Erro na query groups:', error);
        throw error;
      }

      console.log('✅ Grupos encontrados:', data?.length || 0);
      return data || [];
    } catch (err) {
      console.error('❌ Erro geral em groups.list:', err);
      throw err;
    }
  },

  create: async (data: any) => {
    try {
      console.log('🔍 Criando grupo:', data);
      
      const profile = await getCurrentProfile();
      
      const { data: result, error } = await supabase
        .from('groups')
        .insert({ ...data, company_id: profile.company_id })
        .select()
        .single();

      if (error) {
        console.error('❌ Erro ao criar grupo:', error);
        throw error;
      }

      console.log('✅ Grupo criado:', result);
      return result;
    } catch (err) {
      console.error('❌ Erro geral ao criar grupo:', err);
      throw err;
    }
  },

  update: async (id: string, data: any) => {
    try {
      console.log('🔍 Atualizando grupo:', id, data);
      
      const profile = await getCurrentProfile();
      
      const { data: result, error } = await supabase
        .from('groups')
        .update(data)
        .eq('id', id)
        .eq('company_id', profile.company_id)
        .select()
        .single();

      if (error) {
        console.error('❌ Erro ao atualizar grupo:', error);
        throw error;
      }

      console.log('✅ Grupo atualizado:', result);
      return result;
    } catch (err) {
      console.error('❌ Erro geral ao atualizar grupo:', err);
      throw err;
    }
  },

  delete: async (id: string) => {
    try {
      console.log('🔍 Excluindo grupo:', id);
      
      const profile = await getCurrentProfile();
      
      const { error } = await supabase
        .from('groups')
        .delete()
        .eq('id', id)
        .eq('company_id', profile.company_id);

      if (error) {
        console.error('❌ Erro ao excluir grupo:', error);
        throw error;
      }

      console.log('✅ Grupo excluído');
    } catch (err) {
      console.error('❌ Erro geral ao excluir grupo:', err);
      throw err;
    }
  },
};

// =====================================================
// API SIMPLIFICADA - EMPLOYEES
// =====================================================
export const employeesApi = {
  list: async (params?: any) => {
    try {
      console.log('🔍 Listando employees com params:', params);
      
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
      
      if (error) {
        console.error('❌ Erro ao listar employees:', error);
        throw error;
      }

      console.log('✅ Employees encontrados:', data?.length || 0);
      return data || [];
    } catch (err) {
      console.error('❌ Erro geral em employees.list:', err);
      throw err;
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
    } catch (err) {
      console.error('❌ Erro ao criar employee:', err);
      throw err;
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
    } catch (err) {
      console.error('❌ Erro ao atualizar employee:', err);
      throw err;
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
    } catch (err) {
      console.error('❌ Erro ao excluir employee:', err);
      throw err;
    }
  },
};

// Export tudo
export const apiSimple = {
  groups: groupsApi,
  employees: employeesApi,
};

export default apiSimple;
