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

    const [companiesRes, usersRes, linesRes, employeesRes] = await Promise.all([
      supabase.from('companies').select('id', { count: 'exact', head: true }),
      supabase.from('profiles').select('id', { count: 'exact', head: true }),
      supabase.from('production_lines').select('id', { count: 'exact', head: true }),
      supabase.from('employees').select('id', { count: 'exact', head: true }),
    ]);

    return NextResponse.json({
      companies: companiesRes.count || 0,
      users: usersRes.count || 0,
      lines: linesRes.count || 0,
      employees: employeesRes.count || 0,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
