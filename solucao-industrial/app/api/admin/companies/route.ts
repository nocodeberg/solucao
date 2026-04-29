/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';

const MASTER_EMAILS = (process.env.MASTER_EMAILS || '').split(',').map(e => e.trim().toLowerCase()).filter(Boolean);

function isMasterEmail(email: string): boolean {
  return MASTER_EMAILS.includes(email.toLowerCase());
}

async function getAuthUser(request: NextRequest) {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll() {},
      },
    }
  );
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

// GET - Listar todas as empresas
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user?.email || !isMasterEmail(user.email)) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    const supabase = getAdminClient();
    const { data: companies, error } = await supabase
      .from('companies')
      .select('*')
      .order('name');

    if (error) throw error;

    // Contar usuários e linhas por empresa
    const enriched = await Promise.all(
      (companies || []).map(async (company: any) => {
        const [usersRes, linesRes] = await Promise.all([
          supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('company_id', company.id),
          supabase.from('production_lines').select('id', { count: 'exact', head: true }).eq('company_id', company.id),
        ]);
        return {
          ...company,
          _users_count: usersRes.count || 0,
          _lines_count: linesRes.count || 0,
        };
      })
    );

    return NextResponse.json(enriched);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST - Criar empresa
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user?.email || !isMasterEmail(user.email)) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    const body = await request.json();
    const { name, cnpj, email, phone, address } = body;

    if (!name || !cnpj) {
      return NextResponse.json({ error: 'Nome e CNPJ são obrigatórios' }, { status: 400 });
    }

    const supabase = getAdminClient();
    const { data, error } = await supabase
      .from('companies')
      .insert([{ name, cnpj, email, phone, address, active: true }])
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT - Atualizar empresa
export async function PUT(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user?.email || !isMasterEmail(user.email)) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID da empresa é obrigatório' }, { status: 400 });
    }

    const supabase = getAdminClient();
    const { data, error } = await supabase
      .from('companies')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
