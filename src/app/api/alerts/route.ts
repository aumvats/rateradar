import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

export async function GET(request: NextRequest) {
  const userId = request.headers.get('x-user-id');
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = getServiceClient();
  if (!supabase) {
    return NextResponse.json({ error: 'Service unavailable' }, { status: 503 });
  }

  const { data, error } = await supabase
    .from('rateradar_alerts')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const userId = request.headers.get('x-user-id');
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = getServiceClient();
  if (!supabase) {
    return NextResponse.json({ error: 'Service unavailable' }, { status: 503 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  // Check plan alert limit
  const { count } = await supabase
    .from('rateradar_alerts')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('active', true);

  const { data: prefs } = await supabase
    .from('rateradar_user_preferences')
    .select('plan')
    .eq('user_id', userId)
    .single();

  const plan = prefs?.plan ?? 'free';
  const limit = plan === 'free' ? 1 : 20;

  if ((count ?? 0) >= limit) {
    return NextResponse.json(
      { error: `Alert limit reached for ${plan} plan (${limit})` },
      { status: 403 }
    );
  }

  const { data, error } = await supabase
    .from('rateradar_alerts')
    .insert({
      user_id: userId,
      from_currency: body.fromCurrency,
      to_currency: body.toCurrency,
      threshold_type: body.thresholdType,
      threshold_value: body.thresholdValue,
      notify_once: body.notifyOnce ?? false,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}

export async function DELETE(request: NextRequest) {
  const userId = request.headers.get('x-user-id');
  const alertId = request.nextUrl.searchParams.get('id');

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!alertId) {
    return NextResponse.json({ error: 'Missing alert id' }, { status: 400 });
  }

  const supabase = getServiceClient();
  if (!supabase) {
    return NextResponse.json({ error: 'Service unavailable' }, { status: 503 });
  }

  const { error } = await supabase
    .from('rateradar_alerts')
    .delete()
    .eq('id', alertId)
    .eq('user_id', userId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
