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
        getAll() { return request.cookies.getAll(); },
        setAll() {},
      },
    }
  );
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user?.email || !MASTER_EMAILS.includes(user.email.toLowerCase())) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const companyId = formData.get('company_id') as string;

    if (!file || !companyId) {
      return NextResponse.json({ error: 'Arquivo e ID da empresa são obrigatórios' }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Upload file
    const ext = file.name.split('.').pop() || 'png';
    const filePath = `logos/${companyId}.${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    const { error: uploadError } = await supabase.storage
      .from('company-assets')
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: true,
      });

    if (uploadError) {
      // Try creating bucket if it doesn't exist
      if (uploadError.message.includes('not found') || uploadError.message.includes('Bucket')) {
        await supabase.storage.createBucket('company-assets', { public: true });
        const { error: retryError } = await supabase.storage
          .from('company-assets')
          .upload(filePath, buffer, { contentType: file.type, upsert: true });
        if (retryError) throw retryError;
      } else {
        throw uploadError;
      }
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('company-assets')
      .getPublicUrl(filePath);

    const logo_url = urlData.publicUrl;

    // Update company
    const { error: updateError } = await supabase
      .from('companies')
      .update({ logo_url, updated_at: new Date().toISOString() })
      .eq('id', companyId);

    if (updateError) throw updateError;

    return NextResponse.json({ logo_url });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
