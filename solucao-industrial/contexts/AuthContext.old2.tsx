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

      const { data: { session } } = await supabase.auth.getSession();

      if (session?.user) {
        // Buscar profile
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        setUser(session.user);
        setProfile(profileData);
      }
    } catch (error) {
      console.error('Error loading user session:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUserData = async () => {
    // Mantido por compatibilidade, mas agora usa Supabase
    await loadUserSession();
  };

  const signIn = async (email: string, password: string) => {
    const supabase = createSupabaseClient();

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
    if (!data.user || !data.session) throw new Error('Credenciais inválidas');

    // Buscar profile
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .single();

    if (profileError) throw profileError;

    // Set user and profile
    setUser(data.user);
    setProfile(profileData);
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
