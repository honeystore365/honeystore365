import { NextResponse } from 'next/server';
import { createClientServer } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabaseService = await createClientServer('service_role');
    const { data, error } = await supabaseService
      .from('store_settings')
      .select('delivery_fee, updated_at, id')
      .order('updated_at', { ascending: false })
      .limit(1);
    if (error) {
      console.warn('GET delivery-fee failed:', error);
      return NextResponse.json({ delivery_fee: 0, id: null });
    }
    const row = Array.isArray(data) ? data[0] : data;
    const delivery_fee = row?.delivery_fee ?? 0;
    return NextResponse.json({ delivery_fee, id: row?.id ?? null });
  } catch (e) {
    console.error('Unexpected error in GET delivery-fee route:', e);
    return NextResponse.json({ error: 'Unexpected error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const delivery_fee_raw = body?.delivery_fee;
    const delivery_fee = typeof delivery_fee_raw === 'number' ? delivery_fee_raw : parseFloat(String(delivery_fee_raw));

    if (Number.isNaN(delivery_fee) || delivery_fee < 0) {
      return NextResponse.json({ error: 'Invalid delivery_fee' }, { status: 400 });
    }

    // Check auth with anon key first
    const supabaseAnon = await createClientServer('anon');
    const { data: { user }, error: userError } = await supabaseAnon.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Optional: enforce admin by checking profiles.role (if table exists)
    // We attempt to check, but if table not present, we proceed.
    try {
      const { data: profile } = await supabaseAnon
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();
      if (profile && profile.role !== 'admin') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    } catch (_) {
      // Ignore if profiles table not available
    }

    const supabaseService = await createClientServer('service_role');

    // Detect if delivery_fee column exists
    let hasDeliveryFee = true;
    try {
      const { error: colErr } = await supabaseService
        .from('store_settings')
        .select('delivery_fee')
        .limit(1);
      if (colErr) hasDeliveryFee = false;
    } catch (_) {
      hasDeliveryFee = false;
    }

    // Try to get latest settings row (handle multiple rows gracefully)
    const { data: existingRows, error: fetchErr } = await supabaseService
      .from('store_settings')
      .select('id')
      .order('updated_at', { ascending: false })
      .limit(1);

    if (fetchErr) {
      console.warn('Fetch store_settings failed:', fetchErr);
      // Continue to insert
    }

    const existing = Array.isArray(existingRows) ? existingRows[0] : existingRows;

    if (existing?.id) {
      if (hasDeliveryFee) {
        const { error: updateErr } = await supabaseService
          .from('store_settings')
          .update({ delivery_fee })
          .eq('id', existing.id);
        if (updateErr) {
        console.error('Update delivery_fee failed:', updateErr);
        return NextResponse.json({ error: 'Update failed', detail: (updateErr as any)?.message || String(updateErr), code: (updateErr as any)?.code }, { status: 500 });
        }
        return NextResponse.json({ ok: true, id: existing.id, delivery_fee });
      } else {
        // Column missing; cannot update fee
        return NextResponse.json({ ok: false, id: existing.id, delivery_fee: null, warning: 'delivery_fee column missing. Run migration.' }, { status: 200 });
      }
    } else {
      // Build insert payload with minimal required fields
      const basePayload: any = { store_name: 'Mon Magasin', currency: 'TND' };
      if (hasDeliveryFee) basePayload.delivery_fee = delivery_fee;
      const { data: insertedRows, error: insertErr } = await supabaseService
        .from('store_settings')
        .insert([basePayload])
        .select('id, delivery_fee')
        .limit(1);
      if (insertErr) {
        console.error('Insert store_settings failed:', insertErr);
        const code = (insertErr as any)?.code;
        if (code === '42P01') {
          return NextResponse.json({ error: 'Insert failed: table "store_settings" does not exist. Run migrations.', code }, { status: 400 });
        }
        return NextResponse.json({ error: 'Insert failed', detail: (insertErr as any)?.message || String(insertErr), code }, { status: 500 });
      }
      const inserted = Array.isArray(insertedRows) ? insertedRows[0] : insertedRows;
      return NextResponse.json({ ok: true, id: inserted?.id ?? null, delivery_fee: inserted?.delivery_fee ?? (hasDeliveryFee ? delivery_fee : null), warning: hasDeliveryFee ? undefined : 'delivery_fee column missing. Run migration.' });
    }
  } catch (e) {
    console.error('Unexpected error in delivery-fee route:', e);
    return NextResponse.json({ error: 'Unexpected error' }, { status: 500 });
  }
}
