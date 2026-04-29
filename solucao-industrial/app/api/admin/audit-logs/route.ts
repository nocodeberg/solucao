/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';

const MASTER_EMAILS = (process.env.MASTER_EMAILS || '').split(',').map(e => e.trim().toLowerCase()).filter(Boolean);

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

// GET - Listar audit logs de todas empresas (master only)
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user?.email || !MASTER_EMAILS.includes(user.email.toLowerCase())) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('company_id');
    const entity = searchParams.get('entity');
    const action = searchParams.get('action');
    const limit = parseInt(searchParams.get('limit') || '500');

    let query = supabase
      .from('audit_logs')
      .select('*, companies:company_id(name)')
      .order('created_at', { ascending: false });

    if (companyId) query = query.eq('company_id', companyId);
    if (entity) query = query.eq('entity', entity);
    if (action) query = query.eq('action', action);
    query = query.limit(limit);

    const { data, error } = await query;
    if (error) throw error;

    return NextResponse.json(data || []);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
