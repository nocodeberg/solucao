import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { user_id, new_email, current_password } = await request.json();

    if (!user_id || !new_email || !current_password) {
      return NextResponse.json(
        { error: 'Campos obrigatórios: user_id, new_email, current_password' },
        { status: 400 }
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

    // Primeiro, buscar o email atual do usuário para verificar a senha
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data: userData, error: getUserError } = await supabaseAdmin.auth.admin.getUserById(user_id);
    if (getUserError || !userData?.user) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      );
    }

    // Verificar senha atual fazendo login com o email atual
    const supabaseAuth = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { error: signInError } = await supabaseAuth.auth.signInWithPassword({
      email: userData.user.email!,
      password: current_password,
    });

    if (signInError) {
      return NextResponse.json(
        { error: 'Senha atual incorreta' },
        { status: 401 }
      );
    }

    // Alterar email via admin (sem necessidade de confirmação)
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(user_id, {
      email: new_email,
      email_confirm: true,
    });

    if (updateError) {
      console.error('Erro ao alterar email:', updateError);
      return NextResponse.json(
        { error: updateError.message },
        { status: 400 }
      );
    }

    // Atualizar email na tabela profiles também
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .update({ email: new_email })
      .eq('id', user_id);

    if (profileError) {
      console.error('Aviso: Erro ao atualizar email no profile:', profileError);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao alterar email:', error);
    return NextResponse.json(
      { error: 'Erro interno no servidor' },
      { status: 500 }
    );
  }
}
