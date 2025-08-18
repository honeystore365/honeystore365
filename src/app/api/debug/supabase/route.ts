import { NextResponse } from 'next/server';
import { createClientServer } from '@/lib/supabase/server';

export async function GET() {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || null;
    const hasServiceRole = Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);

    let probe: any = null;
    let error: any = null;
    try {
      const admin = await createClientServer('service_role');
      const { data, error: err } = await admin.from('store_settings').select('id').limit(1);
      if (err) error = err;
      probe = Array.isArray(data) ? data.length : data;
    } catch (e: any) {
      error = e?.message || String(e);
    }

    return NextResponse.json({
      env: {
        NEXT_PUBLIC_SUPABASE_URL: url,
        SUPABASE_SERVICE_ROLE_KEY_PRESENT: hasServiceRole,
      },
      store_settings_probe: {
        ok: !error,
        error,
        sample: probe,
      },
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
