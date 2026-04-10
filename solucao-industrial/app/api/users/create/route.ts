import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { full_name, email, password, role, active, company_id } = await request.json();

    if (!full_name || !email || !password || !company_id) {
      return NextResponse.json(
        { error: 'Campos obrigatórios: full_name, email, password, company_id' },
        { status: 400 }
      );
    }

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

    // 1. Criar usuário no Auth
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name },
    });

    if (authError) {
      console.error('Erro ao criar auth user:', authError);
      if (authError.message?.includes('already been registered')) {
        return NextResponse.json(
          { error: 'Este email já está cadastrado' },
          { status: 409 }
        );
      }
      return NextResponse.json(
        { error: authError.message },
        { status: 400 }
      );
    }

    if (!authUser.user?.id) {
      return NextResponse.json(
        { error: 'Falha ao criar usuário no Auth' },
        { status: 500 }
      );
    }

    // 2. Criar/atualizar profile
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .upsert({
        id: authUser.user.id,
        full_name,
        email,
        role: role || 'LEITOR',
        active: active ?? true,
        company_id,
      })
      .select()
      .single();

    if (profileError) {
      console.error('Erro ao criar profile:', profileError);
      // Tentar deletar o auth user já criado
      await supabaseAdmin.auth.admin.deleteUser(authUser.user.id);
      return NextResponse.json(
        { error: profileError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ user: profile });
  } catch (error) {
    console.error('Erro ao criar usuário:', error);
    return NextResponse.json(
      { error: 'Erro interno no servidor' },
      { status: 500 }
    );
  }
}
