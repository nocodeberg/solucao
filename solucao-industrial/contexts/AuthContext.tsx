'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { Profile, UserRole } from '@/types/database.types';
import { useRouter } from 'next/navigation';
import { createSupabaseClient } from '@/lib/supabase/client';

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  hasPermission: (requiredRoles: UserRole[]) => boolean;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
  isAdmin: boolean;
  isGestor: boolean;
  isRH: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Check if user is already logged in
    loadUserSession();
  }, []);

  const loadUserSession = async () => {
    try {
      setLoading(true);
      const supabase = createSupabaseClient();

      // Timeout de 10 segundos para getSession
      const sessionPromise = supabase.auth.getSession();
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Session timeout')), 10000)
      );

      const { data: { session } } = await Promise.race([sessionPromise, timeoutPromise]);

      if (session?.user) {
        setUser(session.user);

        // Buscar profile via API route (bypassa RLS) - com timeout
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 12000); // 12 segundos

          const response = await fetch('/api/auth/profile', {
            headers: {
              'Authorization': `Bearer ${session.access_token}`
            },
            signal: controller.signal
          });

          clearTimeout(timeoutId);

          if (response.ok) {
            const data = await response.json();
            setProfile(data.profile);
          } else if (response.status === 503) {
            // Erro de rede/timeout do Supabase
            console.warn('Erro de conexão ao carregar profile. Tentando novamente...');
            // Não bloqueia a aplicação, apenas loga o erro
          }
        } catch (error) {
          console.error('Error loading profile:', error);
          // Não bloqueia a aplicação - permite continuar sem profile
        }
      }
    } catch (error) {
      console.error('Error loading user session:', error);
      // Em caso de timeout, redireciona para login
      if (error instanceof Error && error.message.includes('timeout')) {
        console.warn('Timeout ao carregar sessão - redirecionando para login');
        // Não redireciona automaticamente para evitar loops
      }
    } finally {
      setLoading(false);
    }
  };

  const loadUserData = async () => {
    // Mantido por compatibilidade
    await loadUserSession();
  };

  const signIn = async (email: string, password: string) => {
    // Chamar API route que usa service role key
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erro ao fazer login');
    }

    const data = await response.json();

    // Configurar sessão no Supabase client
    const supabase = createSupabaseClient();
    await supabase.auth.setSession({
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
    });

    // Set user and profile
    setUser(data.user);
    setProfile(data.profile);
  };

  const signOut = async () => {
    try {
      const supabase = createSupabaseClient();
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Error logging out:', error);
    } finally {
      setUser(null);
      setProfile(null);
      router.push('/login');
    }
  };

  const hasPermission = (requiredRoles: UserRole[]): boolean => {
    if (!profile) return false;
    return requiredRoles.includes(profile.role);
  };

  // Permission helpers
  const isAdmin = profile?.role === 'ADMIN';
  const isGestor = profile?.role === 'GESTOR' || isAdmin;
  const isRH = profile?.role === 'RH' || isAdmin;

  const canCreate = profile?.role !== 'LEITOR';
  const canEdit = profile?.role !== 'LEITOR';
  const canDelete = ['ADMIN', 'GESTOR', 'RH'].includes(profile?.role || '');

  const value = {
    user,
    profile,
    loading,
    signIn,
    signOut,
    hasPermission,
    canCreate,
    canEdit,
    canDelete,
    isAdmin,
    isGestor,
    isRH,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
