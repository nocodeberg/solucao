import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    // Client para autenticação (usa anon key)
    const supabaseAuth = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Fazer login
    const { data: authData, error: authError } = await supabaseAuth.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      return NextResponse.json(
        { error: authError.message },
        { status: 401 }
      );
    }

    if (!authData.user || !authData.session) {
      return NextResponse.json(
        { error: 'Credenciais inválidas' },
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

    // Buscar profile com service role (sem RLS)
    const { data: profiles, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', authData.user.id)
      .limit(1);

    let profile = profiles?.[0] || null;

    if (!profile && authData.user.email) {
      const { data: fallbackProfiles, error: fallbackError } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .eq('email', authData.user.email)
        .limit(1);

      if (!fallbackError) {
        profile = fallbackProfiles?.[0] || null;
      }
    }

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'Perfil não encontrado' },
        { status: 404 }
      );
    }

    // Verificar se a empresa está ativa (exceto master admins)
    const MASTER_EMAILS = (process.env.MASTER_EMAILS || '').split(',').map(e => e.trim().toLowerCase()).filter(Boolean);
    const isMaster = MASTER_EMAILS.includes((email || '').toLowerCase());

    if (!isMaster && profile.company_id) {
      const { data: company } = await supabaseAdmin
        .from('companies')
        .select('active')
        .eq('id', profile.company_id)
        .single();

      if (company && !company.active) {
        // Fazer signOut para limpar a sessão criada
        await supabaseAuth.auth.signOut();
        return NextResponse.json(
          { error: 'COMPANY_INACTIVE' },
          { status: 403 }
        );
      }
    }

    return NextResponse.json({
      user: authData.user,
      session: authData.session,
      profile,
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Erro interno no servidor' },
      { status: 500 }
    );
  }
}
