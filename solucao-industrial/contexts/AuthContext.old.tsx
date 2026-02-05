'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { Profile, UserRole } from '@/types/database.types';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api/client';

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
    const token = localStorage.getItem('auth_token');
    if (token) {
      loadUserData();
    }
  }, []);

  const loadUserData = async () => {
    try {
      setLoading(true);
      const { user: userData, profile: profileData } = await api.auth.me();
      setUser(userData);
      setProfile(profileData);
    } catch (error) {
      console.error('Error loading user data:', error);
      localStorage.removeItem('auth_token');
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    const response = await api.auth.login(email, password);

    // Save token
    localStorage.setItem('auth_token', response.session.access_token);

    // Set user and profile
    setUser(response.user);
    setProfile(response.profile);
  };

  const signOut = async () => {
    try {
      await api.auth.logout();
    } catch (error) {
      console.error('Error logging out:', error);
    } finally {
      localStorage.removeItem('auth_token');
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
