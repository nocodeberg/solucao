'use client';

import React, { createContext, useContext, useMemo } from 'react';
import { SupabaseClient } from '@supabase/supabase-js';
import { createSupabaseClient } from '@/lib/supabase/client';
import type { Database } from '@/types/database.types';

interface SupabaseContextType {
  supabase: SupabaseClient<Database>;
}

const SupabaseContext = createContext<SupabaseContextType | undefined>(undefined);

export function SupabaseProvider({ children }: { children: React.ReactNode }) {
  const supabase = useMemo(() => createSupabaseClient(), []);

  return (
    <SupabaseContext.Provider value={{ supabase }}>
      {children}
    </SupabaseContext.Provider>
  );
}

export function useSupabase() {
  const context = useContext(SupabaseContext);
  if (context === undefined) {
    throw new Error('useSupabase must be used within a SupabaseProvider');
  }
  return context.supabase;
}
