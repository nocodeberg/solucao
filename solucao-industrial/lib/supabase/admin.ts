/**
 * Supabase Admin Client
 * ATENÇÃO: Este arquivo só deve ser usado em Server Components, API Routes ou Server Actions
 * NUNCA use em Client Components
 */

import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database.types';

// Verificar se estamos no servidor
if (typeof window !== 'undefined') {
  throw new Error(
    'supabaseAdmin não pode ser usado no cliente! Use createSupabaseClient() para operações do lado do cliente.'
  );
}

export const supabaseAdmin = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);
