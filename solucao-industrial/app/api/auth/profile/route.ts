import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

// Função auxiliar para adicionar timeout
async function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error('Request timeout')), timeoutMs);
  });
  return Promise.race([promise, timeoutPromise]);
}

// Função para retry com timeout
async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries = 2,
  timeoutMs = 8000
): Promise<T> {
  let lastError: Error | undefined;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await withTimeout(operation(), timeoutMs);
    } catch (error) {
      lastError = error as Error;
      console.error(`Tentativa ${attempt}/${maxRetries} falhou:`, error);

      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
    }
  }

  throw lastError;
}

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');

    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);

    // Verificar token com Supabase auth (com retry e timeout)
    const supabaseAuth = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { data: { user }, error: authError } = await withRetry(() =>
      supabaseAuth.auth.getUser(token)
    );

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Token inválido' },
        { status: 401 }
      );
    }

    // Admin client para buscar profile (bypassa RLS)
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

    // Buscar profile com service role (sem RLS) - com retry e timeout
    const profileResult = await withRetry(async () => {
      return await supabaseAdmin
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
    });

    const { data: profile, error: profileError } = profileResult;

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'Perfil não encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json({ profile });
  } catch (error) {
    console.error('Profile fetch error:', error);

    // Erro mais específico para timeout/rede
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    if (errorMessage.includes('timeout') || errorMessage.includes('fetch failed')) {
      return NextResponse.json(
        {
          error: 'Erro de conexão com o banco de dados. Verifique sua internet.',
          details: 'NETWORK_TIMEOUT'
        },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: 'Erro interno no servidor' },
      { status: 500 }
    );
  }
}
