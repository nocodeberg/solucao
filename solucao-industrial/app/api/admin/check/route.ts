import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

const MASTER_EMAILS = (process.env.MASTER_EMAILS || '').split(',').map(e => e.trim().toLowerCase()).filter(Boolean);

export async function GET(request: NextRequest) {
  try {
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
    
    if (!user?.email) {
      return NextResponse.json({ isMaster: false });
    }

    return NextResponse.json({ 
      isMaster: MASTER_EMAILS.includes(user.email.toLowerCase()),
      email: user.email,
    });
  } catch {
    return NextResponse.json({ isMaster: false });
  }
}
